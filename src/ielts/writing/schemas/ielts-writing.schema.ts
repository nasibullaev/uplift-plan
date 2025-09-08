import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export enum IELTSWritingType {
  TASK_ONE = "TASK_ONE",
  TASK_TWO = "TASK_TWO",
}

export type IELTSWritingDocument = IELTSWriting & Document;

@Schema({ timestamps: true })
export class IELTSWriting {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, trim: true })
  question: string;

  @Prop({
    enum: Object.values(IELTSWritingType),
    required: true,
    default: IELTSWritingType.TASK_ONE,
  })
  type: IELTSWritingType;
}

export const IELTSWritingSchema = SchemaFactory.createForClass(IELTSWriting);
