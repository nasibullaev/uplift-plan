import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ObjectIdType } from "../../types/object-id.type";

export type UserPlanDocument = UserPlan & Document;

@Schema({ timestamps: true })
export class UserPlan {
  @Prop({ required: true })
  user: ObjectIdType;

  @Prop({ required: true })
  plan: ObjectIdType;

  @Prop({ default: 0 })
  freeTrialCount: number;

  @Prop({ default: 0 })
  premiumTrialCount: number;

  @Prop({ default: false })
  hasPaidPlan: boolean;
}

export const UserPlanSchema = SchemaFactory.createForClass(UserPlan);
