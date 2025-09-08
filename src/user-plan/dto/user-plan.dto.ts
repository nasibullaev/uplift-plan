import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ObjectIdType } from "../../types/object-id.type";

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
}

export class ObjectIdDto {
  @ApiProperty({ description: "Object ID" })
  @IsString()
  @IsNotEmpty()
  readonly id: string;
}
