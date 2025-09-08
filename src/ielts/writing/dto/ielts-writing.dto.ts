import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IELTSWritingType } from "../schemas/ielts-writing.schema";

export class CreateIELTSWritingDto {
  @ApiProperty({ description: "Writing task title" })
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @ApiProperty({ description: "Writing task question" })
  @IsString()
  @IsNotEmpty()
  readonly question: string;

  @ApiProperty({ description: "Writing task type", enum: IELTSWritingType })
  @IsEnum(IELTSWritingType)
  readonly type: IELTSWritingType;
}

export class UpdateIELTSWritingDto {
  @ApiPropertyOptional({ description: "Writing task title" })
  @IsString()
  @IsOptional()
  readonly title?: string;

  @ApiPropertyOptional({ description: "Writing task question" })
  @IsString()
  @IsOptional()
  readonly question?: string;

  @ApiPropertyOptional({
    description: "Writing task type",
    enum: IELTSWritingType,
  })
  @IsEnum(IELTSWritingType)
  @IsOptional()
  readonly type?: IELTSWritingType;
}

export class ObjectIdDto {
  @ApiProperty({ description: "Object ID" })
  @IsString()
  @IsNotEmpty()
  readonly id: string;
}
