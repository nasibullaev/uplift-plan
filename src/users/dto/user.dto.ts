import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole, UserStatus } from "../schemas/user.schema";

export class CreateUserDto {
  @ApiProperty({ description: "User email address" })
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty({ description: "User password", minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  readonly password: string;

  @ApiProperty({ description: "User first name" })
  @IsString()
  @IsNotEmpty()
  readonly firstName: string;

  @ApiProperty({ description: "User last name" })
  @IsString()
  @IsNotEmpty()
  readonly lastName: string;

  @ApiPropertyOptional({ description: "User phone number" })
  @IsString()
  @IsOptional()
  readonly phone?: string;

  @ApiPropertyOptional({ description: "User role", enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  readonly role?: UserRole;

  @ApiPropertyOptional({ description: "User avatar URL" })
  @IsString()
  @IsOptional()
  readonly avatar?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: "User email address" })
  @IsEmail()
  @IsOptional()
  readonly email?: string;

  @ApiPropertyOptional({ description: "User first name" })
  @IsString()
  @IsOptional()
  readonly firstName?: string;

  @ApiPropertyOptional({ description: "User last name" })
  @IsString()
  @IsOptional()
  readonly lastName?: string;

  @ApiPropertyOptional({ description: "User phone number" })
  @IsString()
  @IsOptional()
  readonly phone?: string;

  @ApiPropertyOptional({ description: "User role", enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  readonly role?: UserRole;

  @ApiPropertyOptional({ description: "User status", enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  readonly status?: UserStatus;

  @ApiPropertyOptional({ description: "User avatar URL" })
  @IsString()
  @IsOptional()
  readonly avatar?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: "Current password" })
  @IsString()
  @IsNotEmpty()
  readonly currentPassword: string;

  @ApiProperty({ description: "New password", minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  readonly newPassword: string;
}

export class LoginDto {
  @ApiProperty({ description: "User email address" })
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty({ description: "User password" })
  @IsString()
  @IsNotEmpty()
  readonly password: string;
}

export class ObjectIdDto {
  @ApiProperty({ description: "Object ID" })
  @IsString()
  @IsNotEmpty()
  readonly id: string;
}
