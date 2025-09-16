import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  Order,
  OrderDocument,
  OrderStatus,
  PaymentMethod,
} from "./schemas/order.schema";
import { ObjectIdType } from "../types/object-id.type";

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>
  ) {}

  /**
   * Create a new order
   */
  async createOrder(
    orderId: string,
    userId: ObjectIdType,
    planId: ObjectIdType,
    paymentMethod: PaymentMethod,
    amount: number,
    amountInTiyin: number,
    description?: string,
    returnUrl?: string
  ): Promise<OrderDocument> {
    const order = new this.orderModel({
      orderId,
      userId,
      planId,
      paymentMethod,
      amount,
      amountInTiyin,
      description,
      returnUrl,
      status: OrderStatus.PENDING,
    });

    return await order.save();
  }

  /**
   * Find order by orderId
   */
  async findByOrderId(orderId: string): Promise<OrderDocument | null> {
    return await this.orderModel.findOne({ orderId }).exec();
  }

  /**
   * Find order by transactionId
   */
  async findByTransactionId(
    transactionId: string
  ): Promise<OrderDocument | null> {
    return await this.orderModel.findOne({ transactionId }).exec();
  }

  /**
   * Find orders by userId
   */
  async findByUserId(userId: ObjectIdType): Promise<OrderDocument[]> {
    return await this.orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    transactionId?: string,
    paymentUrl?: string,
    failureReason?: string,
    metadata?: Record<string, any>
  ): Promise<OrderDocument | null> {
    const updateData: any = { status };

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    if (paymentUrl) {
      updateData.paymentUrl = paymentUrl;
    }

    if (failureReason) {
      updateData.failureReason = failureReason;
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    if (status === OrderStatus.PAID) {
      updateData.completedAt = new Date();
    }

    if (status === OrderStatus.CANCELLED || status === OrderStatus.FAILED) {
      updateData.cancelledAt = new Date();
    }

    return await this.orderModel
      .findOneAndUpdate({ orderId }, updateData, { new: true })
      .exec();
  }

  /**
   * Get order statistics
   */
  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    paid: number;
    cancelled: number;
    failed: number;
    totalRevenue: number;
  }> {
    const stats = await this.orderModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const result = {
      total: 0,
      pending: 0,
      paid: 0,
      cancelled: 0,
      failed: 0,
      totalRevenue: 0,
    };

    stats.forEach((stat) => {
      result.total += stat.count;
      if (stat._id === OrderStatus.PENDING) result.pending = stat.count;
      if (stat._id === OrderStatus.PAID) {
        result.paid = stat.count;
        result.totalRevenue += stat.totalAmount;
      }
      if (stat._id === OrderStatus.CANCELLED) result.cancelled = stat.count;
      if (stat._id === OrderStatus.FAILED) result.failed = stat.count;
    });

    return result;
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(
    status: OrderStatus,
    limit: number = 50
  ): Promise<OrderDocument[]> {
    return await this.orderModel
      .find({ status })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "email firstName lastName")
      .populate("planId", "title price")
      .exec();
  }

  /**
   * Delete order (for cleanup)
   */
  async deleteOrder(orderId: string): Promise<boolean> {
    const result = await this.orderModel.deleteOne({ orderId }).exec();
    return result.deletedCount > 0;
  }

  /**
   * Validate order exists and is in correct status
   */
  async validateOrderForPayment(orderId: string): Promise<OrderDocument> {
    const order = await this.findByOrderId(orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Order ${orderId} is not in pending status. Current status: ${order.status}`
      );
    }

    return order;
  }
}
