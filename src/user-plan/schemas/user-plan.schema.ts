import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ObjectIdType } from "../../types/object-id.type";

export enum UserPlanStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  SUSPENDED = "SUSPENDED",
  CANCELLED = "CANCELLED",
}

export enum SubscriptionType {
  FREE = "FREE",
  TRIAL = "TRIAL",
  PAID = "PAID",
  ENTERPRISE = "ENTERPRISE",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  CANCELLED = "CANCELLED",
}

export type UserPlanDocument = UserPlan & Document;

@Schema({ timestamps: true })
export class UserPlan {
  @Prop({ type: "ObjectId", ref: "User", required: true })
  user: ObjectIdType;

  @Prop({ type: "ObjectId", ref: "Plan", required: true })
  plan: ObjectIdType;

  @Prop({ default: 0 })
  freeTrialCount: number;

  @Prop({ default: 0 })
  premiumTrialCount: number;

  @Prop({ default: false })
  hasPaidPlan: boolean;

  // Enhanced fields
  @Prop({ enum: Object.values(UserPlanStatus), default: UserPlanStatus.ACTIVE })
  status: UserPlanStatus;

  @Prop({
    enum: Object.values(SubscriptionType),
    default: SubscriptionType.FREE,
  })
  subscriptionType: SubscriptionType;

  @Prop({
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.COMPLETED,
  })
  paymentStatus: PaymentStatus;

  @Prop()
  subscriptionStartDate?: Date;

  @Prop()
  subscriptionEndDate?: Date;

  @Prop()
  lastPaymentDate?: Date;

  @Prop()
  nextPaymentDate?: Date;

  @Prop({ default: 0 })
  totalPaidAmount: number;

  @Prop()
  stripeSubscriptionId?: string;

  @Prop()
  stripeCustomerId?: string;

  @Prop()
  paymentMethodId?: string;

  @Prop({ default: 0 })
  submissionsUsed: number; // Current month submissions

  @Prop({ default: 0 })
  submissionsLimit: number; // Monthly limit

  @Prop()
  lastSubmissionReset?: Date; // When submissions were last reset

  @Prop({ default: 0 })
  totalSubmissions: number; // Lifetime submissions

  @Prop({ default: 0 })
  totalTrialDays: number; // Total trial days used

  @Prop({ default: 0 })
  totalPaidDays: number; // Total paid days

  @Prop({ type: [String], default: [] })
  features: string[]; // Available features

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  cancellationReason?: string;

  @Prop()
  cancellationDate?: Date;

  @Prop()
  notes?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const UserPlanSchema = SchemaFactory.createForClass(UserPlan);

// Add indexes for better performance
UserPlanSchema.index({ user: 1 });
UserPlanSchema.index({ plan: 1 });
UserPlanSchema.index({ status: 1 });
UserPlanSchema.index({ subscriptionType: 1 });
UserPlanSchema.index({ paymentStatus: 1 });
UserPlanSchema.index({ isActive: 1 });
UserPlanSchema.index({ subscriptionEndDate: 1 });
UserPlanSchema.index({ nextPaymentDate: 1 });
UserPlanSchema.index({ stripeSubscriptionId: 1 });
UserPlanSchema.index({ stripeCustomerId: 1 });
UserPlanSchema.index({ createdAt: -1 });
UserPlanSchema.index({ user: 1, plan: 1 }, { unique: true }); // Unique user-plan combination
