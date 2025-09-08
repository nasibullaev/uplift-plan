import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ObjectIdType } from "../../../types/object-id.type";
import {
  IELTSWritingSubmissionStatus,
  IELTSWritingTargetScore,
  IELTSWritingTopicEnum,
} from "../schemas/ielts-writing-submission.schema";

export class CreateIELTSWritingSubmissionDto {
  @ApiPropertyOptional({
    description: "Writing task ID (required if topic is GENERATED)",
  })
  @ValidateIf((o) => o.topic === IELTSWritingTopicEnum.GENERATED)
  @IsString()
  @IsNotEmpty()
  readonly writing?: ObjectIdType;

  @ApiPropertyOptional({
    description: "Custom writing question (required if topic is CUSTOM)",
  })
  @ValidateIf((o) => o.topic === IELTSWritingTopicEnum.CUSTOM)
  @IsString()
  @IsNotEmpty()
  readonly customWritingQuestion?: string;

  @ApiProperty({ description: "Essay body content" })
  @IsString()
  @IsNotEmpty()
  readonly body: string;

  @ApiProperty({ description: "Topic type", enum: IELTSWritingTopicEnum })
  @IsEnum(IELTSWritingTopicEnum)
  readonly topic: IELTSWritingTopicEnum;

  @ApiProperty({ description: "Target score", enum: IELTSWritingTargetScore })
  @IsEnum(IELTSWritingTargetScore)
  readonly targetScore: IELTSWritingTargetScore;
}

export class UpdateIELTSWritingSubmissionDto {
  @ApiPropertyOptional({ description: "Writing task ID" })
  @ValidateIf((o) => o.topic === IELTSWritingTopicEnum.GENERATED)
  @IsString()
  @IsOptional()
  readonly writing?: ObjectIdType;

  @ApiPropertyOptional({ description: "Custom writing question" })
  @ValidateIf((o) => o.topic === IELTSWritingTopicEnum.CUSTOM)
  @IsString()
  @IsOptional()
  readonly customWritingQuestion?: string;

  @ApiPropertyOptional({ description: "Essay body content" })
  @IsString()
  @IsOptional()
  readonly body?: string;

  @ApiPropertyOptional({
    description: "Topic type",
    enum: IELTSWritingTopicEnum,
  })
  @IsEnum(IELTSWritingTopicEnum)
  @IsOptional()
  readonly topic?: IELTSWritingTopicEnum;

  @ApiPropertyOptional({
    description: "Submission status",
    enum: IELTSWritingSubmissionStatus,
  })
  @IsEnum(IELTSWritingSubmissionStatus)
  @IsOptional()
  readonly status?: IELTSWritingSubmissionStatus;

  @ApiPropertyOptional({
    description: "Target score",
    enum: IELTSWritingTargetScore,
  })
  @IsEnum(IELTSWritingTargetScore)
  @IsOptional()
  readonly targetScore?: IELTSWritingTargetScore;
}

export class ObjectIdDto {
  @ApiProperty({ description: "Object ID" })
  @IsString()
  @IsNotEmpty()
  readonly id: string;
}
