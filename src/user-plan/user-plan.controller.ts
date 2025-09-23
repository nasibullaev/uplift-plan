import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UserPlanService } from "./user-plan.service";
import { OrderService } from "../orders/order.service";
import { PlanService } from "../plan/plan.service";
import { PaymeService } from "../payment/payme.service";
import { MockPaymentDto, PromoteUserDto } from "./dto/user-plan.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";
import { PaymentMethod, OrderStatus } from "../orders/schemas/order.schema";

@ApiTags("user-plans")
@Controller("user-plans")
export class UserPlanController {
  private readonly logger = new Logger(UserPlanController.name);

  constructor(
    private readonly userPlanService: UserPlanService,
    private readonly orderService: OrderService,
    private readonly planService: PlanService,
    private readonly paymeService: PaymeService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get current user's plan" })
  @ApiResponse({
    status: 200,
    description: "User plan retrieved successfully",
  })
  async getMyPlan(@Request() req) {
    const userId = req.user.sub;
    const userPlans = await this.userPlanService.findByUserId(userId);
    // Ensure experiment variant is assigned for FREE users without paid plan
    let experimentVariant: "trial_a" | "trial_b" | undefined;
    try {
      experimentVariant =
        await this.userPlanService.getOrAssignExperimentVariant(userId);
    } catch (e) {
      // If user plan not found or other errors, ignore variant assignment here
    }

    const data = (userPlans || []).map((plan: any) => ({
      ...(plan.toObject?.() ? plan.toObject() : plan),
      experimentVariant:
        plan?.metadata?.experimentVariant || experimentVariant || undefined,
    }));

    return { data };
  }

  @Post("payment")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Process payment for plan upgrade",
  })
  @ApiResponse({ status: 200, description: "Payment created successfully" })
  @ApiResponse({ status: 400, description: "Payment failed" })
  async processPayment(@Body() mockPaymentDto: MockPaymentDto, @Request() req) {
    const userId = req.user.sub;
    const { planId, paymentMethod } = mockPaymentDto;

    this.logger.log(
      `Processing payment for user ${userId} to plan ${planId} with method ${paymentMethod}`
    );

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

    // Handle different payment methods
    if (paymentMethod === "Payme") {
      // Convert amount to tiyin (Payme uses tiyin as the smallest unit)
      const amountInTiyin = this.paymeService.convertToTiyin(targetPlan.price);

      // Create order in database
      const order = await this.orderService.createOrder(
        orderId,
        userId,
        planId,
        PaymentMethod.PAYME,
        targetPlan.price,
        amountInTiyin,
        `Upgrade to ${targetPlan.title} plan`,
        `${process.env.CLIENT_URL || "http://localhost:3000"}/payment/success`
      );

      // Create payment URL using direct method (most reliable)
      const paymentUrl = this.paymeService.createDirectPaymentUrl(
        orderId,
        amountInTiyin,
        `${process.env.CLIENT_URL || "http://localhost:3000"}/payment/success`
      );

      // Update order with payment URL
      await this.orderService.updateOrderStatus(
        orderId,
        OrderStatus.CREATED,
        undefined,
        paymentUrl
      );

      return {
        message: "Payme payment created successfully",
        data: {
          orderId,
          paymentUrl,
          amount: targetPlan.price,
          amountInTiyin,
          planName: targetPlan.title,
          paymentMethod: "Payme",
          instructions:
            "Complete the payment in the Payme interface to activate your plan",
        },
      };
    } else if (paymentMethod === "Click") {
      // For Click payments, you would implement Click integration here
      throw new BadRequestException("Click payment method not implemented yet");
    } else {
      throw new BadRequestException(
        `Unsupported payment method: ${paymentMethod}`
      );
    }
  }

  @Get("analytics")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get user plan analytics (Admin only)" })
  @ApiResponse({ status: 200, description: "Analytics retrieved successfully" })
  async getAnalytics() {
    const analytics = await this.userPlanService.getUserPlanAnalytics();
    return { data: analytics };
  }

  @Post("promote")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Promote user to premium plan (Admin only)" })
  @ApiResponse({ status: 200, description: "User promoted successfully" })
  @ApiResponse({
    status: 400,
    description: "Invalid request or user already on plan",
  })
  @ApiResponse({ status: 404, description: "User or plan not found" })
  async promoteUser(@Body() promoteUserDto: PromoteUserDto) {
    const result = await this.userPlanService.promoteUser(promoteUserDto);
    return {
      message: "User promoted successfully",
      data: result,
    };
  }

  @Get("orders")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get user's orders" })
  @ApiResponse({ status: 200, description: "Orders retrieved successfully" })
  async getUserOrders(@Request() req) {
    const userId = req.user.sub;
    const orders = await this.orderService.findByUserId(userId);
    return { data: orders };
  }

  @Post("orders/:orderId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get specific order by ID" })
  @ApiResponse({ status: 200, description: "Order retrieved successfully" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async getOrderById(@Request() req, @Body() body: { orderId: string }) {
    const userId = req.user.sub;
    const order = await this.orderService.findByOrderId(body.orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${body.orderId} not found`);
    }

    // Check if the order belongs to the current user
    if (order.userId.toString() !== userId) {
      throw new NotFoundException(`Order with ID ${body.orderId} not found`);
    }

    return { data: order };
  }
}
