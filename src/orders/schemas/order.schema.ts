import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ObjectIdType } from "../../types/object-id.type";

export enum OrderStatus {
  PENDING = "PENDING",
  CREATED = "CREATED",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum PaymentMethod {
  PAYME = "PAYME",
  UZUM = "UZUM",
  CLICK = "CLICK",
  STRIPE = "STRIPE",
}

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderId: string;

  @Prop({ type: "ObjectId", ref: "User", required: true })
  userId: ObjectIdType;

  @Prop({ type: "ObjectId", ref: "Plan", required: true })
  planId: ObjectIdType;

  @Prop({ enum: Object.values(PaymentMethod), required: true })
  paymentMethod: PaymentMethod;

  @Prop({ enum: Object.values(OrderStatus), default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ required: true })
  amount: number; // Amount in UZS

  @Prop({ required: true })
  amountInTiyin: number; // Amount in tiyin (for Payme)

  @Prop()
  transactionId?: string; // Payme transaction ID

  @Prop()
  paymentUrl?: string; // Payment URL for redirect

  @Prop()
  description?: string;

  @Prop()
  returnUrl?: string;

  @Prop()
  failureReason?: string;

  @Prop()
  completedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Additional data like Payme callback data
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Add indexes for better performance
OrderSchema.index({ orderId: 1 }, { unique: true });
OrderSchema.index({ userId: 1 });
OrderSchema.index({ planId: 1 });
OrderSchema.index({ paymentMethod: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ transactionId: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ orderId: 1, status: 1 });
