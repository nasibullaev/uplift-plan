import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsObject,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { CurrencyCode } from "../../types/object-id.type";
import { PlanType, PlanStatus, PlanBillingCycle } from "../schemas/plan.schema";

export class CreatePlanDto {
  @ApiPropertyOptional({ description: "Plan icon" })
  @IsString()
  @IsOptional()
  readonly icon?: string;

  @ApiProperty({ description: "Plan title" })
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @ApiPropertyOptional({ description: "Plan description" })
  @IsString()
  @IsOptional()
  readonly description?: string;

  @ApiProperty({ description: "Plan features", type: [String] })
  @IsArray()
  @IsNotEmpty()
  readonly features: string[];

  @ApiProperty({ description: "Plan price" })
  @IsNumber()
  @IsNotEmpty()
  readonly price: number;

  @ApiPropertyOptional({ description: "Currency code", enum: CurrencyCode })
  @IsEnum(CurrencyCode)
  @IsOptional()
  readonly currency: CurrencyCode;

  @ApiPropertyOptional({ description: "Duration in days", default: 30 })
  @IsNumber()
  @IsOptional()
  readonly durationInDays: number = 30;

  @ApiPropertyOptional({ description: "Trial count", default: 0 })
  @IsNumber()
  @IsOptional()
  readonly trialCount: number = 0;

  @ApiPropertyOptional({ description: "Is plan active", default: true })
  @IsBoolean()
  @IsOptional()
  readonly isActive: boolean = true;

  // New enhanced fields
  @ApiPropertyOptional({ description: "Billing cycle", enum: PlanBillingCycle })
  @IsEnum(PlanBillingCycle)
  @IsOptional()
  readonly billingCycle?: PlanBillingCycle;

  @ApiPropertyOptional({ description: "Plan type", enum: PlanType })
  @IsEnum(PlanType)
  @IsOptional()
  readonly type?: PlanType;

  @ApiPropertyOptional({ description: "Plan tags" })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly tags?: string[];

  @ApiPropertyOptional({ description: "Maximum users (0 = unlimited)" })
  @IsNumber()
  @Min(0)
  @IsOptional()
  readonly maxUsers?: number;

  @ApiPropertyOptional({
    description: "Maximum submissions per month (0 = unlimited)",
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  readonly maxSubmissions?: number;

  @ApiPropertyOptional({ description: "Is popular plan" })
  @IsBoolean()
  @IsOptional()
  readonly isPopular?: boolean;

  @ApiPropertyOptional({ description: "Sort order" })
  @IsNumber()
  @IsOptional()
  readonly sortOrder?: number;

  @ApiPropertyOptional({ description: "Stripe price ID" })
  @IsString()
  @IsOptional()
  readonly stripePriceId?: string;

  @ApiPropertyOptional({ description: "Stripe product ID" })
  @IsString()
  @IsOptional()
  readonly stripeProductId?: string;

  @ApiPropertyOptional({ description: "Additional metadata" })
  @IsObject()
  @IsOptional()
  readonly metadata?: Record<string, any>;
}

export class UpdatePlanDto {
  @ApiPropertyOptional({ description: "Plan icon" })
  @IsString()
  @IsOptional()
  readonly icon?: string;

  @ApiPropertyOptional({ description: "Plan title" })
  @IsString()
  @IsOptional()
  readonly title?: string;

  @ApiPropertyOptional({ description: "Plan description" })
  @IsString()
  @IsOptional()
  readonly description?: string;

  @ApiPropertyOptional({ description: "Plan features", type: [String] })
  @IsArray()
  @IsOptional()
  readonly features?: string[];

  @ApiPropertyOptional({ description: "Plan price" })
  @IsNumber()
  @IsOptional()
  readonly price?: number;

  @ApiPropertyOptional({ description: "Currency code", enum: CurrencyCode })
  @IsEnum(CurrencyCode)
  @IsOptional()
  readonly currency?: CurrencyCode;

  @ApiPropertyOptional({ description: "Duration in days" })
  @IsNumber()
  @IsOptional()
  readonly durationInDays?: number;

  @ApiPropertyOptional({ description: "Trial count" })
  @IsNumber()
  @IsOptional()
  readonly trialCount?: number;

  @ApiPropertyOptional({ description: "Is plan active" })
  @IsBoolean()
  @IsOptional()
  readonly isActive?: boolean;

  // New enhanced fields
  @ApiPropertyOptional({ description: "Billing cycle", enum: PlanBillingCycle })
  @IsEnum(PlanBillingCycle)
  @IsOptional()
  readonly billingCycle?: PlanBillingCycle;

  @ApiPropertyOptional({ description: "Plan type", enum: PlanType })
  @IsEnum(PlanType)
  @IsOptional()
  readonly type?: PlanType;

  @ApiPropertyOptional({ description: "Plan status", enum: PlanStatus })
  @IsEnum(PlanStatus)
  @IsOptional()
  readonly status?: PlanStatus;

  @ApiPropertyOptional({ description: "Plan tags" })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly tags?: string[];

  @ApiPropertyOptional({ description: "Maximum users (0 = unlimited)" })
  @IsNumber()
  @Min(0)
  @IsOptional()
  readonly maxUsers?: number;

  @ApiPropertyOptional({
    description: "Maximum submissions per month (0 = unlimited)",
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  readonly maxSubmissions?: number;

  @ApiPropertyOptional({ description: "Is popular plan" })
  @IsBoolean()
  @IsOptional()
  readonly isPopular?: boolean;

  @ApiPropertyOptional({ description: "Sort order" })
  @IsNumber()
  @IsOptional()
  readonly sortOrder?: number;

  @ApiPropertyOptional({ description: "Stripe price ID" })
  @IsString()
  @IsOptional()
  readonly stripePriceId?: string;

  @ApiPropertyOptional({ description: "Stripe product ID" })
  @IsString()
  @IsOptional()
  readonly stripeProductId?: string;

  @ApiPropertyOptional({ description: "Additional metadata" })
  @IsObject()
  @IsOptional()
  readonly metadata?: Record<string, any>;
}

export class QueryPlanDto {
  @ApiPropertyOptional({ description: "Page number", default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1;

  @ApiPropertyOptional({ description: "Items per page", default: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  readonly limit?: number = 10;

  @ApiPropertyOptional({ description: "Search term" })
  @IsString()
  @IsOptional()
  readonly search?: string;

  @ApiPropertyOptional({ description: "Plan type", enum: PlanType })
  @IsEnum(PlanType)
  @IsOptional()
  readonly type?: PlanType;

  @ApiPropertyOptional({ description: "Plan status", enum: PlanStatus })
  @IsEnum(PlanStatus)
  @IsOptional()
  readonly status?: PlanStatus;

  @ApiPropertyOptional({ description: "Billing cycle", enum: PlanBillingCycle })
  @IsEnum(PlanBillingCycle)
  @IsOptional()
  readonly billingCycle?: PlanBillingCycle;

  @ApiPropertyOptional({ description: "Currency code", enum: CurrencyCode })
  @IsEnum(CurrencyCode)
  @IsOptional()
  readonly currency?: CurrencyCode;

  @ApiPropertyOptional({ description: "Minimum price" })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  readonly minPrice?: number;

  @ApiPropertyOptional({ description: "Maximum price" })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  readonly maxPrice?: number;

  @ApiPropertyOptional({ description: "Show only active plans" })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  readonly isActive?: boolean;

  @ApiPropertyOptional({ description: "Show only popular plans" })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  readonly isPopular?: boolean;

  @ApiPropertyOptional({ description: "Sort by field", default: "sortOrder" })
  @IsString()
  @IsOptional()
  readonly sortBy?: string = "sortOrder";

  @ApiPropertyOptional({ description: "Sort order", default: "asc" })
  @IsString()
  @IsOptional()
  readonly sortOrder?: "asc" | "desc" = "asc";

  @ApiPropertyOptional({ description: "Filter by tags" })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly tags?: string[];
}

export class ObjectIdDto {
  @ApiProperty({ description: "Object ID" })
  @IsString()
  @IsNotEmpty()
  readonly id: string;
}
