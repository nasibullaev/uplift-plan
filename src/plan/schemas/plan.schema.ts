import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { CurrencyCode } from "../../types/object-id.type";

export enum PlanType {
  FREE = "FREE",
  TRIAL = "TRIAL",
  BASIC = "BASIC",
  PREMIUM = "PREMIUM",
  ENTERPRISE = "ENTERPRISE",
}

export enum PlanStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum PlanBillingCycle {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
  LIFETIME = "LIFETIME",
}

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

  // New enhanced fields
  @Prop({
    enum: Object.values(PlanBillingCycle),
    default: PlanBillingCycle.MONTHLY,
  })
  billingCycle: PlanBillingCycle;

  @Prop({ enum: Object.values(PlanType), default: PlanType.BASIC })
  type: PlanType;

  @Prop({ enum: Object.values(PlanStatus), default: PlanStatus.ACTIVE })
  status: PlanStatus;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  maxUsers: number; // Maximum users allowed (0 = unlimited)

  @Prop({ default: 0 })
  maxSubmissions: number; // Maximum submissions per month (0 = unlimited)

  @Prop({ default: false })
  isPopular: boolean;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);

// Add indexes for better performance
PlanSchema.index({ type: 1 });
PlanSchema.index({ status: 1 });
PlanSchema.index({ isActive: 1 });
PlanSchema.index({ isPopular: 1 });
PlanSchema.index({ sortOrder: 1 });
PlanSchema.index({ price: 1 });
PlanSchema.index({ tags: 1 });
PlanSchema.index({ createdAt: -1 });
