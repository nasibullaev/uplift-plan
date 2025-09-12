import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsNumber,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PaymentDto {
  @ApiProperty({ description: "Target plan ID to upgrade to" })
  @IsString()
  @IsNotEmpty()
  readonly planId: string;

  @ApiPropertyOptional({ description: "Return URL after payment completion" })
  @IsString()
  @IsOptional()
  readonly returnUrl?: string;
}

export class PaymeCallbackDto {
  @ApiProperty({ description: "Callback ID" })
  @IsString()
  @IsNotEmpty()
  readonly id: string;

  @ApiProperty({ description: "Callback method" })
  @IsString()
  @IsNotEmpty()
  readonly method: string;

  @ApiProperty({ description: "Callback parameters" })
  @IsObject()
  @IsNotEmpty()
  readonly params: {
    id?: string;
    account?: {
      orderId: string;
    };
    amount?: number;
    time?: number;
    reason?: number;
    from?: number;
    to?: number;
    password?: string;
  };
}

export class VerifyPaymentDto {
  @ApiProperty({ description: "Transaction ID to verify" })
  @IsString()
  @IsNotEmpty()
  readonly transactionId: string;
}
