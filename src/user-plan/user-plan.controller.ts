import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UserPlanService } from "./user-plan.service";
import {
  CreateUserPlanDto,
  UpdateUserPlanDto,
  QueryUserPlanDto,
  ObjectIdDto,
  IncrementTrialDto,
  SubscriptionUpdateDto,
} from "./dto/user-plan.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";
import { UserPlanStatus } from "./schemas/user-plan.schema";

@ApiTags("user-plans")
@Controller("user-plans")
export class UserPlanController {
  constructor(private readonly userPlanService: UserPlanService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create a new user plan (Admin only)" })
  @ApiResponse({ status: 201, description: "User plan created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 409, description: "User already has a plan" })
  async create(@Body() createUserPlanDto: CreateUserPlanDto) {
    const userPlan = await this.userPlanService.create(createUserPlanDto);
    return {
      message: "User plan created successfully",
      data: userPlan,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get all user plans with pagination and filtering (Admin only)",
  })
  @ApiResponse({
    status: 200,
    description: "User plans retrieved successfully",
  })
  async findAll(@Query() queryDto: QueryUserPlanDto) {
    const result = await this.userPlanService.findAll(queryDto);
    return result;
  }

  @Get("my-plans")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get current user plans" })
  @ApiResponse({
    status: 200,
    description: "User plans retrieved successfully",
  })
  async getMyPlans(@Param("userId") userId: string) {
    const userPlans = await this.userPlanService.findByUserId(userId);
    return { data: userPlans };
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

  @Get("expired")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get expired subscriptions (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Expired subscriptions retrieved successfully",
  })
  async getExpiredSubscriptions() {
    const expired = await this.userPlanService.getExpiredSubscriptions();
    return { data: expired };
  }

  @Get("renewals")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get upcoming renewals (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Upcoming renewals retrieved successfully",
  })
  async getUpcomingRenewals(@Query("days") days?: number) {
    const renewals = await this.userPlanService.getUpcomingRenewals(days || 7);
    return { data: renewals };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user plan by ID" })
  @ApiResponse({ status: 200, description: "User plan retrieved successfully" })
  @ApiResponse({ status: 404, description: "User plan not found" })
  async findOne(@Param() params: ObjectIdDto) {
    const userPlan = await this.userPlanService.findOne(params.id);
    return { data: userPlan };
  }

  @Get("user/:id/balance")
  @ApiOperation({ summary: "Get user balance" })
  @ApiResponse({
    status: 200,
    description: "User balance retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "User plan not found" })
  async getUserBalance(@Param() params: ObjectIdDto) {
    const balance = await this.userPlanService.getUserBalance(params.id);
    return { data: balance };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update user plan" })
  @ApiResponse({ status: 200, description: "User plan updated successfully" })
  @ApiResponse({ status: 404, description: "User plan not found" })
  async update(
    @Param() params: ObjectIdDto,
    @Body() updateUserPlanDto: UpdateUserPlanDto
  ) {
    const userPlan = await this.userPlanService.update(
      params.id,
      updateUserPlanDto
    );
    return {
      message: "User plan updated successfully",
      data: userPlan,
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete user plan" })
  @ApiResponse({ status: 200, description: "User plan deleted successfully" })
  @ApiResponse({ status: 404, description: "User plan not found" })
  async remove(@Param() params: ObjectIdDto) {
    const userPlan = await this.userPlanService.remove(params.id);
    return {
      message: "User plan deleted successfully",
      data: userPlan,
    };
  }
}
