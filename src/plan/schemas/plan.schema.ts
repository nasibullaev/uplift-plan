import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { CurrencyCode } from "../../types/object-id.type";

export type PlanDocument = Plan & Document;

@Schema({ timestamps: true })
export class Plan {
  @Prop({ required: false })
  icon: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ enum: Object.values(CurrencyCode), default: CurrencyCode.UZS })
  currency: CurrencyCode;

  @Prop({ required: true })
  durationInDays: number;

  @Prop({ required: true })
  trialCount: number;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ default: true })
  isActive: boolean;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
