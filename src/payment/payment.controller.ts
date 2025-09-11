import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import {
  PaymeService,
  PaymePaymentRequest,
  PaymeCallbackData,
} from "./payme.service";
import { UserPlanService } from "../user-plan/user-plan.service";
import { PlanService } from "../plan/plan.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PaymentDto, PaymeCallbackDto } from "./dto/payment.dto";
import {
  PaymentStatus,
  SubscriptionType,
  UserPlanStatus,
} from "../user-plan/schemas/user-plan.schema";

@ApiTags("payments")
@Controller("payments")
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymeService: PaymeService,
    private readonly userPlanService: UserPlanService,
    private readonly planService: PlanService
  ) {}

  @Post("create")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create payment for plan upgrade" })
  @ApiResponse({ status: 200, description: "Payment created successfully" })
  @ApiResponse({
    status: 400,
    description: "Invalid request or plan not found",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createPayment(@Body() paymentDto: PaymentDto, @Request() req) {
    const userId = req.user.sub;
    const { planId, returnUrl } = paymentDto;

    this.logger.log(`Creating payment for user ${userId} to plan ${planId}`);

    // Find the target plan
    const targetPlan = await this.planService.findOne(planId);
    if (!targetPlan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // Check if the plan is active
    if (!targetPlan.isActive) {
      throw new BadRequestException(`Plan ${targetPlan.title} is not active`);
    }

    // Find user's current plan
    const userPlans = await this.userPlanService.findByUserId(userId);
    let currentUserPlan;

    if (!userPlans || userPlans.length === 0) {
      // Create a free plan for the user first
      currentUserPlan =
        await this.userPlanService.createFreePlanForUser(userId);
    } else {
      currentUserPlan = userPlans[0];
    }

    // Check if user is trying to upgrade to the same plan
    if (currentUserPlan.plan.toString() === planId) {
      throw new BadRequestException("You are already subscribed to this plan");
    }

    // Generate unique order ID
    const orderId = `order_${userId}_${planId}_${Date.now()}`;

    // Convert amount to tiyin (Payme uses tiyin as the smallest unit)
    const amountInTiyin = this.paymeService.convertToTiyin(targetPlan.price);

    // Create payment request
    const paymentRequest: PaymePaymentRequest = {
      orderId,
      amount: amountInTiyin,
      description: `Upgrade to ${targetPlan.title} plan`,
      returnUrl,
    };

    const paymentResponse =
      await this.paymeService.createPayment(paymentRequest);

    if (!paymentResponse.success) {
      throw new BadRequestException(
        paymentResponse.error || "Payment creation failed"
      );
    }

    // Store payment information in user plan metadata
    currentUserPlan.metadata = {
      ...currentUserPlan.metadata,
      pendingPayment: {
        orderId,
        transactionId: paymentResponse.transactionId,
        planId,
        amount: targetPlan.price,
        amountInTiyin,
        paymentUrl: paymentResponse.paymentUrl,
        createdAt: new Date(),
      },
    };

    await currentUserPlan.save();

    return {
      message: "Payment created successfully",
      data: {
        paymentUrl: paymentResponse.paymentUrl,
        orderId,
        transactionId: paymentResponse.transactionId,
        amount: targetPlan.price,
        planName: targetPlan.title,
        instructions:
          "Complete the payment in the Payme interface to activate your plan",
      },
    };
  }

  @Post("payme/callback")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Handle Payme payment callback" })
  @ApiBody({ type: PaymeCallbackDto })
  @ApiResponse({ status: 200, description: "Callback processed successfully" })
  @ApiResponse({ status: 400, description: "Invalid callback data" })
  async handlePaymeCallback(@Body() callbackDto: PaymeCallbackDto) {
    this.logger.log(
      "Received Payme callback:",
      JSON.stringify(callbackDto, null, 2)
    );

    try {
      const callbackData: PaymeCallbackData = callbackDto;
      const result = await this.paymeService.handleCallback(callbackData);

      if (!result.success) {
        this.logger.error("Callback processing failed:", result.error);
        return { error: { code: -31000, message: result.error } };
      }

      // Handle successful payment
      if (callbackData.method === "cards.perform_transaction") {
        await this.handleSuccessfulPayment(callbackData);
      }

      return { result: { success: true } };
    } catch (error) {
      this.logger.error("Error processing callback:", error);
      return { error: { code: -31000, message: "Internal server error" } };
    }
  }

  @Post("verify")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Verify payment status" })
  @ApiResponse({ status: 200, description: "Payment status verified" })
  @ApiResponse({ status: 400, description: "Invalid transaction ID" })
  async verifyPayment(@Body() body: { transactionId: string }, @Request() req) {
    const userId = req.user.sub;
    const { transactionId } = body;

    this.logger.log(`Verifying payment ${transactionId} for user ${userId}`);

    const paymentStatus =
      await this.paymeService.checkPaymentStatus(transactionId);

    if (!paymentStatus) {
      throw new BadRequestException(
        "Payment not found or invalid transaction ID"
      );
    }

    // Payment states in Payme:
    // 0 - waiting
    // 1 - paid
    // 2 - cancelled
    // -1 - cancelled after paid

    const statusMap = {
      0: "WAITING",
      1: "PAID",
      2: "CANCELLED",
      "-1": "CANCELLED_AFTER_PAID",
    };

    return {
      message: "Payment status retrieved successfully",
      data: {
        transactionId,
        status: statusMap[paymentStatus.state] || "UNKNOWN",
        amount: this.paymeService.convertToUzs(paymentStatus.amount),
        amountInTiyin: paymentStatus.amount,
      },
    };
  }

  /**
   * Handle successful payment completion
   */
  private async handleSuccessfulPayment(
    callbackData: PaymeCallbackData
  ): Promise<void> {
    try {
      const { params } = callbackData;
      const orderId = params.account.orderId;
      const amount = params.amount;

      this.logger.log(
        `Processing successful payment for order ${orderId} with amount ${amount}`
      );

      // Extract user ID and plan ID from order ID
      const orderParts = orderId.split("_");
      if (orderParts.length < 4) {
        this.logger.error(`Invalid order ID format: ${orderId}`);
        return;
      }

      const userId = orderParts[1];
      const planId = orderParts[2];

      // Find user's current plan
      const userPlans = await this.userPlanService.findByUserId(userId);
      if (!userPlans || userPlans.length === 0) {
        this.logger.error(`User plan not found for user ${userId}`);
        return;
      }

      const userPlan = userPlans[0];

      // Verify the pending payment matches
      const pendingPayment = userPlan.metadata?.pendingPayment;
      if (!pendingPayment || pendingPayment.orderId !== orderId) {
        this.logger.error(
          `Pending payment not found or mismatch for order ${orderId}`
        );
        return;
      }

      // Find the target plan
      const targetPlan = await this.planService.findOne(planId);
      if (!targetPlan) {
        this.logger.error(`Target plan not found: ${planId}`);
        return;
      }

      // Update user plan with new plan details
      userPlan.plan = planId;
      userPlan.paymentStatus = PaymentStatus.COMPLETED;
      userPlan.totalPaidAmount += targetPlan.price || 0;
      userPlan.lastPaymentDate = new Date();
      userPlan.subscriptionType = SubscriptionType.PAID;
      userPlan.hasPaidPlan = true;
      userPlan.subscriptionStartDate = new Date();
      userPlan.subscriptionEndDate = new Date(
        Date.now() + (targetPlan.durationInDays || 30) * 24 * 60 * 60 * 1000
      );
      userPlan.nextPaymentDate = new Date(
        Date.now() + (targetPlan.durationInDays || 30) * 24 * 60 * 60 * 1000
      );
      userPlan.submissionsLimit =
        targetPlan.maxSubmissions || userPlan.submissionsLimit;
      userPlan.features = targetPlan.features || userPlan.features;
      userPlan.status = UserPlanStatus.ACTIVE;
      userPlan.isActive = true;

      // Clear pending payment and add payment history
      userPlan.metadata = {
        ...userPlan.metadata,
        pendingPayment: undefined,
        paymentHistory: [
          ...(userPlan.metadata?.paymentHistory || []),
          {
            orderId,
            transactionId: callbackData.id,
            planId,
            amount: targetPlan.price,
            amountInTiyin: amount,
            paymentMethod: "Payme",
            completedAt: new Date(),
          },
        ],
      };

      await userPlan.save();

      this.logger.log(`Successfully updated user ${userId} to plan ${planId}`);
    } catch (error) {
      this.logger.error("Error handling successful payment:", error);
    }
  }
}
