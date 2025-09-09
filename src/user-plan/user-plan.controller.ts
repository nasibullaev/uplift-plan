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
import { MockPaymentDto } from "./dto/user-plan.dto";
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
  @ApiOperation({ summary: "Process mock payment for plan upgrade (MVP)" })
  @ApiResponse({ status: 200, description: "Payment processed successfully" })
  @ApiResponse({ status: 400, description: "Payment failed" })
  async processMockPayment(
    @Body() mockPaymentDto: MockPaymentDto,
    @Request() req
  ) {
    const result = await this.userPlanService.processMockPayment(
      req.user.sub,
      mockPaymentDto
    );
    return {
      message: "Payment processed successfully",
      data: result,
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
}
