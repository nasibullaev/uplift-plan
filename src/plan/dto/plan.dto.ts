import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CurrencyCode } from "../../types/object-id.type";

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
}

export class ObjectIdDto {
  @ApiProperty({ description: "Object ID" })
  @IsString()
  @IsNotEmpty()
  readonly id: string;
}
