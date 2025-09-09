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
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { PlanService } from "./plan.service";
import { CreatePlanDto, UpdatePlanDto, ObjectIdDto } from "./dto/plan.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";

@ApiTags("plans")
@Controller("plans")
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth("JWT-auth")
  @UseInterceptors(FileInterceptor("icon"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Create a new plan with icon upload (Admin only)" })
  @ApiBody({
    description: "Plan data with optional icon file",
    type: "multipart/form-data",
    schema: {
      type: "object",
      properties: {
        icon: {
          type: "string",
          format: "binary",
          description: "SVG icon file (optional)",
        },
        title: {
          type: "string",
          description: "Plan title",
        },
        description: {
          type: "string",
          description: "Plan description",
        },
        price: {
          type: "number",
          description: "Plan price",
        },
        currency: {
          type: "string",
          enum: ["UZS", "USD", "EUR"],
          description: "Currency code",
        },
        durationInDays: {
          type: "number",
          description: "Duration in days",
        },
        trialCount: {
          type: "number",
          description: "Trial count",
        },
        features: {
          type: "array",
          items: { type: "string" },
          description: "Plan features",
        },
        billingCycle: {
          type: "string",
          enum: ["MONTHLY", "QUARTERLY", "YEARLY", "LIFETIME"],
          description: "Billing cycle",
        },
        type: {
          type: "string",
          enum: ["FREE", "TRIAL", "BASIC", "PREMIUM", "ENTERPRISE"],
          description: "Plan type",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Plan tags",
        },
        maxUsers: {
          type: "number",
          description: "Maximum users (0 = unlimited)",
        },
        maxSubmissions: {
          type: "number",
          description: "Maximum submissions per month (0 = unlimited)",
        },
        isPopular: {
          type: "boolean",
          description: "Is popular plan",
        },
        sortOrder: {
          type: "number",
          description: "Sort order",
        },
      },
      required: ["title", "price", "features"],
    },
  })
  @ApiResponse({ status: 201, description: "Plan created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async create(
    @Body() createPlanDto: CreatePlanDto,
    @UploadedFile() iconFile?: any
  ) {
    const plan = await this.planService.create(createPlanDto, iconFile);
    return {
      message: "Plan created successfully",
      data: plan,
    };
  }

  @Get()
  @ApiOperation({ summary: "Get all plans" })
  @ApiResponse({ status: 200, description: "Plans retrieved successfully" })
  async findAll() {
    const plans = await this.planService.findAll();
    return { data: plans };
  }

  @Get("active")
  @ApiOperation({ summary: "Get all active plans" })
  @ApiResponse({
    status: 200,
    description: "Active plans retrieved successfully",
  })
  async findActivePlans() {
    const plans = await this.planService.findActivePlans();
    return { data: plans };
  }

  @Get("popular")
  @ApiOperation({ summary: "Get popular plans" })
  @ApiResponse({
    status: 200,
    description: "Popular plans retrieved successfully",
  })
  async findPopularPlans() {
    const plans = await this.planService.findPopularPlans();
    return { data: plans };
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get plan statistics (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Plan statistics retrieved successfully",
  })
  async getPlanStats() {
    const stats = await this.planService.getPlanStats();
    return { data: stats };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get plan by ID" })
  @ApiResponse({ status: 200, description: "Plan retrieved successfully" })
  @ApiResponse({ status: 404, description: "Plan not found" })
  async findOne(@Param() params: ObjectIdDto) {
    const plan = await this.planService.findOne(params.id);
    return { data: plan };
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth("JWT-auth")
  @UseInterceptors(FileInterceptor("icon"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Update plan with optional icon upload (Admin only)",
  })
  @ApiBody({
    description: "Plan update data with optional icon file",
    type: "multipart/form-data",
    schema: {
      type: "object",
      properties: {
        icon: {
          type: "string",
          format: "binary",
          description: "SVG icon file (optional)",
        },
        title: {
          type: "string",
          description: "Plan title",
        },
        description: {
          type: "string",
          description: "Plan description",
        },
        price: {
          type: "number",
          description: "Plan price",
        },
        currency: {
          type: "string",
          enum: ["UZS", "USD", "EUR"],
          description: "Currency code",
        },
        durationInDays: {
          type: "number",
          description: "Duration in days",
        },
        trialCount: {
          type: "number",
          description: "Trial count",
        },
        features: {
          type: "array",
          items: { type: "string" },
          description: "Plan features",
        },
        isActive: {
          type: "boolean",
          description: "Is plan active",
        },
        billingCycle: {
          type: "string",
          enum: ["MONTHLY", "QUARTERLY", "YEARLY", "LIFETIME"],
          description: "Billing cycle",
        },
        type: {
          type: "string",
          enum: ["FREE", "TRIAL", "BASIC", "PREMIUM", "ENTERPRISE"],
          description: "Plan type",
        },
        status: {
          type: "string",
          enum: ["ACTIVE", "INACTIVE", "ARCHIVED"],
          description: "Plan status",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Plan tags",
        },
        maxUsers: {
          type: "number",
          description: "Maximum users (0 = unlimited)",
        },
        maxSubmissions: {
          type: "number",
          description: "Maximum submissions per month (0 = unlimited)",
        },
        isPopular: {
          type: "boolean",
          description: "Is popular plan",
        },
        sortOrder: {
          type: "number",
          description: "Sort order",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Plan updated successfully" })
  @ApiResponse({ status: 404, description: "Plan not found" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async update(
    @Param() params: ObjectIdDto,
    @Body() updatePlanDto: UpdatePlanDto,
    @UploadedFile() iconFile?: any
  ) {
    const plan = await this.planService.update(
      params.id,
      updatePlanDto,
      iconFile
    );
    return {
      message: "Plan updated successfully",
      data: plan,
    };
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete plan (Super Admin only)" })
  @ApiResponse({ status: 200, description: "Plan deleted successfully" })
  @ApiResponse({ status: 404, description: "Plan not found" })
  async remove(@Param() params: ObjectIdDto) {
    const plan = await this.planService.remove(params.id);
    return {
      message: "Plan deleted successfully",
      data: plan,
    };
  }

  @Post(":id/duplicate")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Duplicate plan (Admin only)" })
  @ApiResponse({ status: 201, description: "Plan duplicated successfully" })
  @ApiResponse({ status: 404, description: "Plan not found" })
  async duplicatePlan(
    @Param() params: ObjectIdDto,
    @Body() body: { title: string }
  ) {
    const plan = await this.planService.duplicatePlan(params.id, body.title);
    return {
      message: "Plan duplicated successfully",
      data: plan,
    };
  }
}
