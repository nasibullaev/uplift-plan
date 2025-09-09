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
    example: "68beebafa02d9604a4cadcd9",
  })
  @ValidateIf((o) => o.topic === IELTSWritingTopicEnum.GENERATED)
  @IsString()
  @IsNotEmpty()
  readonly writing?: ObjectIdType;

  @ApiPropertyOptional({
    description: "Custom writing question (required if topic is CUSTOM)",
    example:
      "Some people believe that technology has made our lives more complicated, while others argue that it has simplified our daily routines. Discuss both views and give your opinion.",
  })
  @ValidateIf((o) => o.topic === IELTSWritingTopicEnum.CUSTOM)
  @IsString()
  @IsNotEmpty()
  readonly customWritingQuestion?: string;

  @ApiProperty({
    description: "Essay body content",
    example:
      "In today's rapidly evolving world, technology has become an integral part of our daily lives. While some argue that technological advancements have complicated our existence, others maintain that these innovations have streamlined and simplified our routines. This essay will explore both perspectives and provide a balanced view on this contentious issue.\n\nOn one hand, critics of technology argue that it has introduced unnecessary complexity into our lives. The constant influx of new devices, applications, and digital platforms requires continuous learning and adaptation. Many people find themselves overwhelmed by the sheer volume of information available online, leading to decision fatigue and increased stress levels. Furthermore, the expectation to be constantly connected and responsive has blurred the boundaries between work and personal life, creating additional pressure and anxiety.\n\nOn the other hand, proponents of technology highlight its numerous benefits in simplifying daily tasks. Smartphones, for instance, have consolidated multiple functions into a single device, eliminating the need for separate cameras, calculators, maps, and communication tools. Online banking and shopping have reduced the time spent on errands, while digital calendars and reminder systems help organize our schedules more efficiently. Additionally, technology has made information more accessible, allowing people to learn new skills, access healthcare services, and connect with others regardless of geographical barriers.\n\nIn conclusion, while technology has indeed introduced certain complexities, its overall impact has been largely positive in simplifying our daily routines. The key lies in finding a balance and using technology mindfully to enhance rather than complicate our lives.",
  })
  @IsString()
  @IsNotEmpty()
  readonly body: string;

  @ApiProperty({
    description: "Topic type",
    enum: IELTSWritingTopicEnum,
    example: IELTSWritingTopicEnum.GENERATED,
  })
  @IsEnum(IELTSWritingTopicEnum)
  readonly topic: IELTSWritingTopicEnum;

  @ApiProperty({
    description: "Target score",
    enum: IELTSWritingTargetScore,
    example: IELTSWritingTargetScore.BAND_SEVEN,
  })
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
