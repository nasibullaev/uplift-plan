import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { UserRole } from "../schemas/user.schema";

export class CreateUserDto {
  @ApiProperty({ description: "User phone number" })
  @IsString()
  @IsNotEmpty()
  readonly phone: string;

  @ApiPropertyOptional({ description: "User role", enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  readonly role?: UserRole;

  @ApiPropertyOptional({ description: "User avatar URL" })
  @IsString()
  @IsOptional()
  readonly avatar?: string;
}

export class SendVerificationCodeDto {
  @ApiProperty({ description: "User phone number" })
  @IsString()
  @IsNotEmpty()
  readonly phone: string;
}

export class VerifyPhoneDto {
  @ApiProperty({ description: "User phone number" })
  @IsString()
  @IsNotEmpty()
  readonly phone: string;

  @ApiProperty({ description: "Verification code" })
  @IsString()
  @IsNotEmpty()
  readonly code: string;
}

export class ObjectIdDto {
  @ApiProperty({ description: "Object ID" })
  @IsString()
  @IsNotEmpty()
  readonly id: string;
}

export class QueryUserDto {
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

  @ApiPropertyOptional({ description: "User role", enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  readonly role?: UserRole;

  @ApiPropertyOptional({ description: "User status" })
  @IsString()
  @IsOptional()
  readonly status?: string;

  @ApiPropertyOptional({ description: "Sort by field", default: "createdAt" })
  @IsString()
  @IsOptional()
  readonly sortBy?: string = "createdAt";

  @ApiPropertyOptional({ description: "Sort order", default: "desc" })
  @IsString()
  @IsOptional()
  readonly sortOrder?: "asc" | "desc" = "desc";
}
