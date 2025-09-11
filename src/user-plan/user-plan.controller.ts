import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UserPlanService } from "./user-plan.service";
import { MockPaymentDto, PromoteUserDto } from "./dto/user-plan.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";

@ApiTags("user-plans")
@Controller("user-plans")
export class UserPlanController {
  constructor(private readonly userPlanService: UserPlanService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get current user's plan" })
  @ApiResponse({
    status: 200,
    description: "User plan retrieved successfully",
  })
  async getMyPlan(@Request() req) {
    const userPlan = await this.userPlanService.findByUserId(req.user.sub);
    return { data: userPlan };
  }

  @Post("payment")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Process payment for plan upgrade (Redirects to Payme)",
  })
  @ApiResponse({ status: 200, description: "Payment created successfully" })
  @ApiResponse({ status: 400, description: "Payment failed" })
  async processPayment(@Body() mockPaymentDto: MockPaymentDto, @Request() req) {
    // This endpoint is now deprecated in favor of /payments/create
    // Redirect to the new payment system
    return {
      message:
        "This endpoint is deprecated. Please use /payments/create instead.",
      redirectTo: "/payments/create",
      data: {
        planId: mockPaymentDto.planId,
        paymentMethod: mockPaymentDto.paymentMethod,
      },
    };
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
}
