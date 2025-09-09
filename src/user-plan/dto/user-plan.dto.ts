import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsDateString,
  Min,
  Max,
  IsObject,
  IsIn,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ObjectIdType } from "../../types/object-id.type";
import {
  UserPlanStatus,
  SubscriptionType,
  PaymentStatus,
} from "../schemas/user-plan.schema";

export class CreateUserPlanDto {
  @ApiProperty({ description: "User ID" })
  @IsString()
  @IsNotEmpty()
  readonly user: ObjectIdType;

  @ApiProperty({ description: "Plan ID" })
  @IsString()
  @IsNotEmpty()
  readonly plan: ObjectIdType;

  @ApiPropertyOptional({ description: "Free trial count", default: 0 })
  @IsNumber()
  @IsOptional()
  readonly freeTrialCount: number = 0;

  @ApiPropertyOptional({ description: "Premium trial count", default: 0 })
  @IsNumber()
  @IsOptional()
  readonly premiumTrialCount: number = 0;

  @ApiPropertyOptional({ description: "Has paid plan", default: false })
  @IsBoolean()
  @IsOptional()
  readonly hasPaidPlan: boolean = false;

  // Enhanced fields
  @ApiPropertyOptional({
    description: "User plan status",
    enum: UserPlanStatus,
  })
  @IsEnum(UserPlanStatus)
  @IsOptional()
  readonly status?: UserPlanStatus;

  @ApiPropertyOptional({
    description: "Subscription type",
    enum: SubscriptionType,
  })
  @IsEnum(SubscriptionType)
  @IsOptional()
  readonly subscriptionType?: SubscriptionType;

  @ApiPropertyOptional({ description: "Payment status", enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  readonly paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ description: "Subscription start date" })
  @IsDateString()
  @IsOptional()
  readonly subscriptionStartDate?: string;

  @ApiPropertyOptional({ description: "Subscription end date" })
  @IsDateString()
  @IsOptional()
  readonly subscriptionEndDate?: string;

  @ApiPropertyOptional({ description: "Total paid amount", default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  readonly totalPaidAmount?: number;

  @ApiPropertyOptional({ description: "Stripe subscription ID" })
  @IsString()
  @IsOptional()
  readonly stripeSubscriptionId?: string;

  @ApiPropertyOptional({ description: "Stripe customer ID" })
  @IsString()
  @IsOptional()
  readonly stripeCustomerId?: string;

  @ApiPropertyOptional({ description: "Payment method ID" })
  @IsString()
  @IsOptional()
  readonly paymentMethodId?: string;

  @ApiPropertyOptional({ description: "Submissions limit", default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  readonly submissionsLimit?: number;

  @ApiPropertyOptional({ description: "Available features" })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly features?: string[];

  @ApiPropertyOptional({ description: "Notes" })
  @IsString()
  @IsOptional()
  readonly notes?: string;

  @ApiPropertyOptional({ description: "Additional metadata" })
  @IsObject()
  @IsOptional()
  readonly metadata?: Record<string, any>;
}

export class UpdateUserPlanDto {
  @ApiPropertyOptional({ description: "User ID" })
  @IsString()
  @IsOptional()
  readonly user?: ObjectIdType;

  @ApiPropertyOptional({ description: "Plan ID" })
  @IsString()
  @IsOptional()
  readonly plan?: ObjectIdType;

  @ApiPropertyOptional({ description: "Free trial count" })
  @IsNumber()
  @IsOptional()
  readonly freeTrialCount?: number;

  @ApiPropertyOptional({ description: "Premium trial count" })
  @IsNumber()
  @IsOptional()
  readonly premiumTrialCount?: number;

  @ApiPropertyOptional({ description: "Has paid plan" })
  @IsBoolean()
  @IsOptional()
  readonly hasPaidPlan?: boolean;

  // Enhanced fields
  @ApiPropertyOptional({
    description: "User plan status",
    enum: UserPlanStatus,
  })
  @IsEnum(UserPlanStatus)
  @IsOptional()
  readonly status?: UserPlanStatus;

  @ApiPropertyOptional({
    description: "Subscription type",
    enum: SubscriptionType,
  })
  @IsEnum(SubscriptionType)
  @IsOptional()
  readonly subscriptionType?: SubscriptionType;

  @ApiPropertyOptional({ description: "Payment status", enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  readonly paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ description: "Subscription start date" })
  @IsDateString()
  @IsOptional()
  readonly subscriptionStartDate?: string;

  @ApiPropertyOptional({ description: "Subscription end date" })
  @IsDateString()
  @IsOptional()
  readonly subscriptionEndDate?: string;

  @ApiPropertyOptional({ description: "Total paid amount" })
  @IsNumber()
  @Min(0)
  @IsOptional()
  readonly totalPaidAmount?: number;

  @ApiPropertyOptional({ description: "Stripe subscription ID" })
  @IsString()
  @IsOptional()
  readonly stripeSubscriptionId?: string;

  @ApiPropertyOptional({ description: "Stripe customer ID" })
  @IsString()
  @IsOptional()
  readonly stripeCustomerId?: string;

  @ApiPropertyOptional({ description: "Payment method ID" })
  @IsString()
  @IsOptional()
  readonly paymentMethodId?: string;

  @ApiPropertyOptional({ description: "Submissions limit" })
  @IsNumber()
  @Min(0)
  @IsOptional()
  readonly submissionsLimit?: number;

  @ApiPropertyOptional({ description: "Available features" })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly features?: string[];

  @ApiPropertyOptional({ description: "Is active" })
  @IsBoolean()
  @IsOptional()
  readonly isActive?: boolean;

  @ApiPropertyOptional({ description: "Cancellation reason" })
  @IsString()
  @IsOptional()
  readonly cancellationReason?: string;

  @ApiPropertyOptional({ description: "Cancellation date" })
  @IsDateString()
  @IsOptional()
  readonly cancellationDate?: string;

  @ApiPropertyOptional({ description: "Notes" })
  @IsString()
  @IsOptional()
  readonly notes?: string;

  @ApiPropertyOptional({ description: "Additional metadata" })
  @IsObject()
  @IsOptional()
  readonly metadata?: Record<string, any>;
}

export class QueryUserPlanDto {
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

  @ApiPropertyOptional({ description: "User ID" })
  @IsString()
  @IsOptional()
  readonly userId?: string;

  @ApiPropertyOptional({ description: "Plan ID" })
  @IsString()
  @IsOptional()
  readonly planId?: string;

  @ApiPropertyOptional({
    description: "User plan status",
    enum: UserPlanStatus,
  })
  @IsEnum(UserPlanStatus)
  @IsOptional()
  readonly status?: UserPlanStatus;

  @ApiPropertyOptional({
    description: "Subscription type",
    enum: SubscriptionType,
  })
  @IsEnum(SubscriptionType)
  @IsOptional()
  readonly subscriptionType?: SubscriptionType;

  @ApiPropertyOptional({ description: "Payment status", enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  readonly paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ description: "Show only active plans" })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  readonly isActive?: boolean;

  @ApiPropertyOptional({ description: "Show only paid plans" })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  readonly hasPaidPlan?: boolean;

  @ApiPropertyOptional({ description: "Sort by field", default: "createdAt" })
  @IsString()
  @IsOptional()
  readonly sortBy?: string = "createdAt";

  @ApiPropertyOptional({ description: "Sort order", default: "desc" })
  @IsString()
  @IsOptional()
  readonly sortOrder?: "asc" | "desc" = "desc";
}

export class UserPlanBalanceDto {
  @ApiProperty({ description: "User ID" })
  @IsString()
  @IsNotEmpty()
  readonly userId: string;
}

export class IncrementTrialDto {
  @ApiProperty({ description: "User ID" })
  @IsString()
  @IsNotEmpty()
  readonly userId: string;

  @ApiProperty({ description: "Plan ID" })
  @IsString()
  @IsNotEmpty()
  readonly planId: string;

  @ApiProperty({ description: "Trial count to increment" })
  @IsNumber()
  @Min(1)
  readonly count: number;

  @ApiPropertyOptional({ description: "Trial type", enum: ["free", "premium"] })
  @IsString()
  @IsOptional()
  readonly type?: "free" | "premium";
}

export class SubscriptionUpdateDto {
  @ApiProperty({ description: "User plan ID" })
  @IsString()
  @IsNotEmpty()
  readonly userPlanId: string;

  @ApiProperty({ description: "New plan ID" })
  @IsString()
  @IsNotEmpty()
  readonly newPlanId: string;

  @ApiPropertyOptional({ description: "Prorate the change" })
  @IsBoolean()
  @IsOptional()
  readonly prorate?: boolean;
}

export class ObjectIdDto {
  @ApiProperty({ description: "Object ID" })
  @IsString()
  @IsNotEmpty()
  readonly id: string;
}

export class RequestPlanChangeDto {
  @ApiProperty({ description: "Target plan ID" })
  @IsString()
  @IsNotEmpty()
  readonly planId: string;

  @ApiPropertyOptional({ description: "Reason for plan change" })
  @IsString()
  @IsOptional()
  readonly reason?: string;
}

export class MockPaymentDto {
  @ApiProperty({ description: "Target plan ID to upgrade to" })
  @IsString()
  @IsNotEmpty()
  readonly planId: string;

  @ApiProperty({ description: "Payment method", enum: ["Click", "Payme"] })
  @IsString()
  @IsIn(["Click", "Payme"])
  readonly paymentMethod: string;
}
