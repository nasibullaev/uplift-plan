import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  Transaction,
  TransactionDocument,
  TransactionState,
  TransactionReason,
  ReceiptState,
  Account,
  Receiver,
} from "./schemas/transaction.schema";
import { ObjectIdType } from "../types/object-id.type";

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>
  ) {}

  /**
   * Create a new transaction
   */
  async createTransaction(
    id: string,
    time: number,
    amount: number,
    account: Account,
    createTime: number,
    orderId?: ObjectIdType,
    userId?: ObjectIdType,
    planId?: ObjectIdType,
    merchantTransactionId?: string,
    description?: string,
    receivers?: Receiver[]
  ): Promise<TransactionDocument> {
    this.logger.log(`Creating transaction ${id} for amount ${amount} tiyin`);

    const newTransaction = new this.transactionModel({
      id,
      time,
      amount,
      account,
      create_time: createTime,
      orderId,
      userId,
      planId,
      merchantTransactionId,
      description,
      receivers,
      state: TransactionState.CREATED,
      receiptState: ReceiptState.CREATED,
    });

    return await newTransaction.save();
  }

  /**
   * Find transaction by Payme ID
   */
  async findByPaymeId(id: string): Promise<TransactionDocument | null> {
    return await this.transactionModel.findOne({ id }).exec();
  }

  /**
   * Find transaction by order ID
   */
  async findByOrderId(
    orderId: ObjectIdType
  ): Promise<TransactionDocument | null> {
    return await this.transactionModel.findOne({ orderId }).exec();
  }

  /**
   * Find transaction by account orderId (merchant order ID)
   */
  async findByAccountOrderId(
    accountOrderId: string
  ): Promise<TransactionDocument | null> {
    return await this.transactionModel
      .findOne({ "account.orderId": accountOrderId })
      .exec();
  }

  /**
   * Find recent transactions within specified hours
   */
  async findRecentTransactions(hours: number): Promise<TransactionDocument[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await this.transactionModel
      .find({ createdAt: { $gte: cutoffTime } })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();
  }

  /**
   * Find transaction by merchant transaction ID
   */
  async findByMerchantTransactionId(
    merchantTransactionId: string
  ): Promise<TransactionDocument | null> {
    return await this.transactionModel
      .findOne({ merchantTransactionId })
      .exec();
  }

  /**
   * Find transactions by user ID
   */
  async findByUserId(userId: ObjectIdType): Promise<TransactionDocument[]> {
    return await this.transactionModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find transactions by state
   */
  async findByState(state: TransactionState): Promise<TransactionDocument[]> {
    return await this.transactionModel
      .find({ state })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find transactions by receipt state
   */
  async findByReceiptState(
    receiptState: ReceiptState
  ): Promise<TransactionDocument[]> {
    return await this.transactionModel
      .find({ receiptState })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Update transaction state
   */
  async updateTransactionState(
    id: string,
    state: TransactionState,
    performTime?: number,
    cancelTime?: number,
    reason?: TransactionReason,
    transaction?: string
  ): Promise<TransactionDocument | null> {
    this.logger.log(`Updating transaction ${id} state to ${state}`);

    const updateData: any = {
      state,
      lastProcessedAt: new Date(),
    };

    if (performTime !== null && performTime !== undefined) {
      updateData.perform_time = performTime;
    }

    if (cancelTime !== null && cancelTime !== undefined) {
      updateData.cancel_time = cancelTime;
    }

    if (reason) {
      updateData.reason = reason;
    }

    if (transaction) {
      updateData.transaction = transaction;
    }

    return await this.transactionModel
      .findOneAndUpdate({ id }, updateData, { new: true })
      .exec();
  }

  /**
   * Update receipt state
   */
  async updateReceiptState(
    id: string,
    receiptState: ReceiptState,
    receiptId?: string,
    receiptUrl?: string
  ): Promise<TransactionDocument | null> {
    this.logger.log(
      `Updating transaction ${id} receipt state to ${receiptState}`
    );

    const updateData: any = {
      receiptState,
      lastProcessedAt: new Date(),
    };

    if (receiptId) {
      updateData.receiptId = receiptId;
    }

    if (receiptUrl) {
      updateData.receiptUrl = receiptUrl;
    }

    return await this.transactionModel
      .findOneAndUpdate({ id }, updateData, { new: true })
      .exec();
  }

  /**
   * Update transaction metadata
   */
  async updateMetadata(
    id: string,
    metadata: Record<string, any>
  ): Promise<TransactionDocument | null> {
    return await this.transactionModel
      .findOneAndUpdate(
        { id },
        { metadata, lastProcessedAt: new Date() },
        { new: true }
      )
      .exec();
  }

  /**
   * Update transaction error information
   */
  async updateError(
    id: string,
    error: string,
    incrementRetry: boolean = true
  ): Promise<TransactionDocument | null> {
    const updateData: any = {
      lastError: error,
      lastProcessedAt: new Date(),
    };

    if (incrementRetry) {
      updateData.$inc = { retryCount: 1 };
    }

    return await this.transactionModel
      .findOneAndUpdate({ id }, updateData, { new: true })
      .exec();
  }

  /**
   * Get transaction statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byState: Record<TransactionState, number>;
    byReceiptState: Record<ReceiptState, number>;
    totalAmount: number;
    successfulAmount: number;
  }> {
    const total = await this.transactionModel.countDocuments();

    const byState = await this.transactionModel.aggregate([
      { $group: { _id: "$state", count: { $sum: 1 } } },
    ]);

    const byReceiptState = await this.transactionModel.aggregate([
      { $group: { _id: "$receiptState", count: { $sum: 1 } } },
    ]);

    const amountStats = await this.transactionModel.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          successfulAmount: {
            $sum: {
              $cond: [
                { $eq: ["$state", TransactionState.PERFORMED] },
                "$amount",
                0,
              ],
            },
          },
        },
      },
    ]);

    const result = {
      total,
      byState: {} as Record<TransactionState, number>,
      byReceiptState: {} as Record<ReceiptState, number>,
      totalAmount: amountStats[0]?.totalAmount || 0,
      successfulAmount: amountStats[0]?.successfulAmount || 0,
    };

    // Convert aggregation results to objects
    byState.forEach((item) => {
      result.byState[item._id as TransactionState] = item.count;
    });

    byReceiptState.forEach((item) => {
      result.byReceiptState[item._id as ReceiptState] = item.count;
    });

    return result;
  }

  /**
   * Get transactions with pagination
   */
  async getTransactions(
    page: number = 1,
    limit: number = 10,
    filters?: {
      state?: TransactionState;
      receiptState?: ReceiptState;
      userId?: ObjectIdType;
      orderId?: ObjectIdType;
      fromDate?: Date;
      toDate?: Date;
    }
  ): Promise<{
    transactions: TransactionDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query: any = {};

    if (filters) {
      if (filters.state) query.state = filters.state;
      if (filters.receiptState) query.receiptState = filters.receiptState;
      if (filters.userId) query.userId = filters.userId;
      if (filters.orderId) query.orderId = filters.orderId;

      if (filters.fromDate || filters.toDate) {
        query.createdAt = {};
        if (filters.fromDate) query.createdAt.$gte = filters.fromDate;
        if (filters.toDate) query.createdAt.$lte = filters.toDate;
      }
    }

    const skip = (page - 1) * limit;
    const total = await this.transactionModel.countDocuments(query);
    const transactions = await this.transactionModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete transaction (for cleanup purposes)
   */
  async deleteTransaction(id: string): Promise<boolean> {
    const result = await this.transactionModel.deleteOne({ id }).exec();
    return result.deletedCount > 0;
  }

  /**
   * Validate transaction data
   */
  validateTransactionData(data: {
    id: string;
    time: number;
    amount: number;
    account: Account;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate ID (should be 24 characters)
    if (!data.id || data.id.length !== 24) {
      errors.push("Transaction ID must be exactly 24 characters");
    }

    // Validate time (should be 13-digit timestamp)
    if (!data.time || data.time.toString().length !== 13) {
      errors.push("Time must be a 13-digit timestamp");
    }

    // Validate amount (should be positive integer)
    if (!data.amount || data.amount <= 0 || !Number.isInteger(data.amount)) {
      errors.push("Amount must be a positive integer");
    }

    // Validate account (should be an object)
    if (!data.account || typeof data.account !== "object") {
      errors.push("Account must be an object");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
