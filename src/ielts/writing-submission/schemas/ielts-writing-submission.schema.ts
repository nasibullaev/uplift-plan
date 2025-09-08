import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { ObjectIdType } from "../../../types/object-id.type";

export enum IELTSWritingSubmissionType {
  Task1 = "Task 1",
  Task2 = "Task 2",
}

export enum IELTSWritingSubmissionStatus {
  IDLE = "IDLE",
  IN_PROGRESS = "IN_PROGRESS",
  ANALYZED = "ANALYZED",
  FAILED_TO_CHECK = "FAILED_TO_CHECK",
}

export enum IELTSWritingTopicEnum {
  GENERATED = "GENERATED",
  CUSTOM = "CUSTOM",
}

export enum IELTSWritingTargetScore {
  BAND_SEVEN = "BAND_SEVEN",
  BAND_EIGHT = "BAND_EIGHT",
  BAND_NINE = "BAND_NINE",
}

export type IELTSWritingSubmissionDocument = IELTSWritingSubmission & Document;

@Schema({ timestamps: true })
export class CriteriaScores {
  @Prop({ min: 0, max: 9 })
  taskResponse?: number;

  @Prop({ min: 0, max: 9 })
  coherence?: number;

  @Prop({ min: 0, max: 9 })
  lexical?: number;

  @Prop({ min: 0, max: 9 })
  grammar?: number;
}

@Schema({ _id: false })
export class CriteriaResponse {
  @Prop()
  taskResponse: string;

  @Prop()
  coherence: string;

  @Prop()
  lexical: string;

  @Prop()
  grammar: string;
}

@Schema({ _id: false })
export class ImprovedVersion {
  @Prop()
  introduction?: string;

  @Prop({ type: [String] })
  body?: string[];

  @Prop()
  conclusion?: string;

  @Prop({ type: CriteriaResponse })
  criteriaResponse: CriteriaResponse;
}

@Schema({ _id: false })
export class ImprovedVersions {
  @Prop({ type: ImprovedVersion })
  band7?: ImprovedVersion;

  @Prop({ type: ImprovedVersion })
  band8?: ImprovedVersion;

  @Prop({ type: ImprovedVersion })
  band9?: ImprovedVersion;
}

@Schema({ _id: false })
export class AIFeedback {
  @Prop({ type: [String] })
  mistakes?: string[];

  @Prop({ type: [String] })
  suggestions?: string[];

  @Prop({ type: ImprovedVersions })
  improvedVersions?: ImprovedVersions;
}

@Schema({ timestamps: true })
export class IELTSWritingSubmission {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  user: ObjectIdType;

  @Prop({ type: Types.ObjectId, ref: "IELTSWriting" })
  writing?: ObjectIdType;

  @Prop()
  customWritingQuestion?: string;

  @Prop({ required: true, trim: true })
  body: string;

  @Prop()
  score?: number;

  @Prop({
    enum: Object.values(IELTSWritingSubmissionStatus),
    default: IELTSWritingSubmissionStatus.IDLE,
  })
  status: IELTSWritingSubmissionStatus;

  @Prop({
    enum: Object.values(IELTSWritingTopicEnum),
    default: IELTSWritingTopicEnum.GENERATED,
  })
  topic: IELTSWritingTopicEnum;

  @Prop({
    enum: Object.values(IELTSWritingTargetScore),
    default: IELTSWritingTargetScore.BAND_SEVEN,
  })
  targetScore: IELTSWritingTargetScore;

  @Prop({ type: CriteriaScores })
  criteriaScores?: CriteriaScores;

  @Prop({ type: AIFeedback })
  aiFeedback?: AIFeedback;
}

export const IELTSWritingSubmissionSchema = SchemaFactory.createForClass(
  IELTSWritingSubmission
);

// Add indexes
IELTSWritingSubmissionSchema.index({ user: 1, writing: 1 });
IELTSWritingSubmissionSchema.index({ createdAt: -1 });
