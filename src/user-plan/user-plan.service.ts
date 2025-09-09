import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  UserPlan,
  UserPlanDocument,
  UserPlanStatus,
  SubscriptionType,
  PaymentStatus,
} from "./schemas/user-plan.schema";
import { Plan, PlanDocument } from "../plan/schemas/plan.schema";
import {
  CreateUserPlanDto,
  UpdateUserPlanDto,
  QueryUserPlanDto,
  UserPlanBalanceDto,
  IncrementTrialDto,
  SubscriptionUpdateDto,
  RequestPlanChangeDto,
  MockPaymentDto,
} from "./dto/user-plan.dto";
import { ObjectIdType } from "../types/object-id.type";

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UserPlanAnalytics {
  totalUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalRevenue: number;
  averageRevenuePerUser: number;
  subscriptionTypes: { type: string; count: number }[];
  paymentStatuses: { status: string; count: number }[];
  monthlyGrowth: { month: string; count: number; revenue: number }[];
}

@Injectable()
export class UserPlanService {
  constructor(
    @InjectModel(UserPlan.name) private userPlanModel: Model<UserPlanDocument>,
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>
  ) {}

  async create(createUserPlanDto: CreateUserPlanDto): Promise<UserPlan> {
    // Check if user already has a plan
    const existingUserPlan = await this.userPlanModel
      .findOne({
        user: createUserPlanDto.user,
      })
      .exec();

    if (existingUserPlan) {
      throw new ConflictException("User already has a plan");
    }

    const createdUserPlan = new this.userPlanModel({
      ...createUserPlanDto,
      subscriptionStartDate: createUserPlanDto.subscriptionStartDate
        ? new Date(createUserPlanDto.subscriptionStartDate)
        : new Date(),
      subscriptionEndDate: createUserPlanDto.subscriptionEndDate
        ? new Date(createUserPlanDto.subscriptionEndDate)
        : undefined,
    });

    return createdUserPlan.save();
  }

  async findAll(
    queryDto: QueryUserPlanDto
  ): Promise<PaginatedResult<UserPlan>> {
    const {
      page = 1,
      limit = 10,
      userId,
      planId,
      status,
      subscriptionType,
      paymentStatus,
      isActive,
      hasPaidPlan,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = queryDto;

    // Build filter object
    const filter: any = {};

    if (userId) filter.user = userId;
    if (planId) filter.plan = planId;
    if (status) filter.status = status;
    if (subscriptionType) filter.subscriptionType = subscriptionType;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (isActive !== undefined) filter.isActive = isActive;
    if (hasPaidPlan !== undefined) filter.hasPaidPlan = hasPaidPlan;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [data, total] = await Promise.all([
      this.userPlanModel
        .find(filter)
        .populate("user", "firstName lastName email")
        .populate("plan", "title price currency")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userPlanModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: ObjectIdType): Promise<UserPlan> {
    const userPlan = await this.userPlanModel
      .findById(id)
      .populate("user", "firstName lastName email")
      .populate("plan", "title price currency features")
      .exec();

    if (!userPlan) {
      throw new NotFoundException("User plan not found");
    }
    return userPlan;
  }

  async findByUserId(userId: ObjectIdType): Promise<UserPlan[]> {
    return this.userPlanModel
      .find({ user: userId })
      .populate("plan", "title price currency features")
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    id: ObjectIdType,
    updateUserPlanDto: UpdateUserPlanDto
  ): Promise<UserPlan> {
    const updateData: any = { ...updateUserPlanDto };

    // Convert date strings to Date objects
    if (updateUserPlanDto.subscriptionStartDate) {
      updateData.subscriptionStartDate = new Date(
        updateUserPlanDto.subscriptionStartDate
      );
    }
    if (updateUserPlanDto.subscriptionEndDate) {
      updateData.subscriptionEndDate = new Date(
        updateUserPlanDto.subscriptionEndDate
      );
    }
    if (updateUserPlanDto.cancellationDate) {
      updateData.cancellationDate = new Date(
        updateUserPlanDto.cancellationDate
      );
    }

    const userPlan = await this.userPlanModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate("user", "firstName lastName email")
      .populate("plan", "title price currency")
      .exec();

    if (!userPlan) {
      throw new NotFoundException("User plan not found");
    }
    return userPlan;
  }

  async remove(id: ObjectIdType): Promise<UserPlan> {
    const userPlan = await this.userPlanModel.findByIdAndDelete(id).exec();
    if (!userPlan) {
      throw new NotFoundException("User plan not found");
    }
    return userPlan;
  }

  // Enhanced methods
  async incrementTrialCount(
    incrementDto: IncrementTrialDto
  ): Promise<UserPlan> {
    const { userId, planId, count, type = "premium" } = incrementDto;

    const field = type === "free" ? "freeTrialCount" : "premiumTrialCount";

    const userPlan = await this.userPlanModel
      .findOneAndUpdate(
        { user: userId, plan: planId },
        { $inc: { [field]: count } },
        { new: true, upsert: true }
      )
      .exec();

    return userPlan;
  }

  async decrementBalance(
    userId: ObjectIdType,
    count: number = 1
  ): Promise<UserPlan> {
    const userPlan = await this.userPlanModel.findOne({ user: userId }).exec();
    if (!userPlan) {
      throw new NotFoundException("User plan not found");
    }

    if (userPlan.premiumTrialCount > 0) {
      const updated = await this.userPlanModel
        .findOneAndUpdate(
          { user: userId },
          { $inc: { premiumTrialCount: -count } },
          { new: true }
        )
        .exec();
      return updated;
    }

    if (userPlan.freeTrialCount > 0) {
      const updated = await this.userPlanModel
        .findOneAndUpdate(
          { user: userId },
          { $inc: { freeTrialCount: -count } },
          { new: true }
        )
        .exec();
      return updated;
    }

    throw new BadRequestException("User has no access to plan");
  }

  async getUserBalance(userId: ObjectIdType): Promise<any> {
    const userPlan = await this.userPlanModel
      .findOne({ user: userId })
      .populate("plan", "title price currency features")
      .exec();

    if (!userPlan) {
      return {
        hasAccess: false,
        freeTrialCount: 0,
        premiumTrialCount: 0,
        hasPaidPlan: false,
        submissionsUsed: 0,
        submissionsLimit: 0,
        submissionsRemaining: 0,
        plan: null,
      };
    }

    const submissionsRemaining = Math.max(
      0,
      userPlan.submissionsLimit - userPlan.submissionsUsed
    );

    return {
      hasAccess:
        userPlan.freeTrialCount > 0 ||
        userPlan.premiumTrialCount > 0 ||
        userPlan.hasPaidPlan,
      freeTrialCount: userPlan.freeTrialCount,
      premiumTrialCount: userPlan.premiumTrialCount,
      hasPaidPlan: userPlan.hasPaidPlan,
      submissionsUsed: userPlan.submissionsUsed,
      submissionsLimit: userPlan.submissionsLimit,
      submissionsRemaining,
      plan: userPlan.plan,
      status: userPlan.status,
      subscriptionType: userPlan.subscriptionType,
      subscriptionEndDate: userPlan.subscriptionEndDate,
    };
  }

  async hasUserAccess(userId: ObjectIdType): Promise<boolean> {
    const userPlan = await this.userPlanModel.findOne({ user: userId }).exec();
    if (!userPlan) {
      return false;
    }
    return (
      userPlan.freeTrialCount > 0 ||
      userPlan.premiumTrialCount > 0 ||
      userPlan.hasPaidPlan
    );
  }

  async updateSubscriptionStatus(
    userPlanId: ObjectIdType,
    status: UserPlanStatus
  ): Promise<UserPlan> {
    const userPlan = await this.userPlanModel
      .findByIdAndUpdate(userPlanId, { status }, { new: true })
      .exec();

    if (!userPlan) {
      throw new NotFoundException("User plan not found");
    }
    return userPlan;
  }

  async cancelSubscription(
    userPlanId: ObjectIdType,
    reason?: string
  ): Promise<UserPlan> {
    const userPlan = await this.userPlanModel
      .findByIdAndUpdate(
        userPlanId,
        {
          status: UserPlanStatus.CANCELLED,
          cancellationDate: new Date(),
          cancellationReason: reason,
          isActive: false,
        },
        { new: true }
      )
      .exec();

    if (!userPlan) {
      throw new NotFoundException("User plan not found");
    }
    return userPlan;
  }

  async updateSubscription(
    subscriptionUpdateDto: SubscriptionUpdateDto
  ): Promise<UserPlan> {
    const { userPlanId, newPlanId, prorate = false } = subscriptionUpdateDto;

    const userPlan = await this.userPlanModel
      .findByIdAndUpdate(userPlanId, { plan: newPlanId }, { new: true })
      .exec();

    if (!userPlan) {
      throw new NotFoundException("User plan not found");
    }

    // In a real application, you would handle prorating logic here
    // if (prorate) {
    //   await this.handleProrating(userPlan, newPlanId);
    // }

    return userPlan;
  }

  async incrementSubmissions(
    userId: ObjectIdType,
    count: number = 1
  ): Promise<UserPlan> {
    const userPlan = await this.userPlanModel
      .findOneAndUpdate(
        { user: userId },
        {
          $inc: {
            submissionsUsed: count,
            totalSubmissions: count,
          },
        },
        { new: true }
      )
      .exec();

    if (!userPlan) {
      throw new NotFoundException("User plan not found");
    }
    return userPlan;
  }

  async resetMonthlySubmissions(): Promise<void> {
    await this.userPlanModel
      .updateMany(
        {},
        {
          $set: {
            submissionsUsed: 0,
            lastSubmissionReset: new Date(),
          },
        }
      )
      .exec();
  }

  async getExpiredSubscriptions(): Promise<UserPlan[]> {
    return this.userPlanModel
      .find({
        subscriptionEndDate: { $lt: new Date() },
        status: UserPlanStatus.ACTIVE,
      })
      .populate("user", "firstName lastName email")
      .populate("plan", "title")
      .exec();
  }

  async getUpcomingRenewals(days: number = 7): Promise<UserPlan[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.userPlanModel
      .find({
        nextPaymentDate: { $lte: futureDate },
        status: UserPlanStatus.ACTIVE,
        subscriptionType: SubscriptionType.PAID,
      })
      .populate("user", "firstName lastName email")
      .populate("plan", "title price")
      .exec();
  }

  async getUserPlanAnalytics(): Promise<UserPlanAnalytics> {
    const [
      totalUsers,
      activeSubscriptions,
      expiredSubscriptions,
      revenueStats,
      subscriptionTypeStats,
      paymentStatusStats,
      monthlyGrowth,
    ] = await Promise.all([
      this.userPlanModel.countDocuments().exec(),
      this.userPlanModel
        .countDocuments({ status: UserPlanStatus.ACTIVE })
        .exec(),
      this.userPlanModel
        .countDocuments({ status: UserPlanStatus.EXPIRED })
        .exec(),
      this.userPlanModel
        .aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$totalPaidAmount" },
              averageRevenue: { $avg: "$totalPaidAmount" },
            },
          },
        ])
        .exec(),
      this.userPlanModel
        .aggregate([
          { $group: { _id: "$subscriptionType", count: { $sum: 1 } } },
        ])
        .exec(),
      this.userPlanModel
        .aggregate([{ $group: { _id: "$paymentStatus", count: { $sum: 1 } } }])
        .exec(),
      this.userPlanModel
        .aggregate([
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
              },
              count: { $sum: 1 },
              revenue: { $sum: "$totalPaidAmount" },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
          { $limit: 12 },
        ])
        .exec(),
    ]);

    const revenueData = revenueStats[0] || {
      totalRevenue: 0,
      averageRevenue: 0,
    };

    return {
      totalUsers,
      activeSubscriptions,
      expiredSubscriptions,
      totalRevenue: revenueData.totalRevenue,
      averageRevenuePerUser: revenueData.averageRevenue,
      subscriptionTypes: subscriptionTypeStats.map((stat) => ({
        type: stat._id,
        count: stat.count,
      })),
      paymentStatuses: paymentStatusStats.map((stat) => ({
        status: stat._id,
        count: stat.count,
      })),
      monthlyGrowth: monthlyGrowth.map((stat) => ({
        month: `${stat._id.year}-${stat._id.month}`,
        count: stat.count,
        revenue: stat.revenue,
      })),
    };
  }

  async getPlanUsageStats(planId: ObjectIdType): Promise<any> {
    const stats = await this.userPlanModel
      .aggregate([
        { $match: { plan: planId } },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [{ $eq: ["$status", UserPlanStatus.ACTIVE] }, 1, 0],
              },
            },
            totalRevenue: { $sum: "$totalPaidAmount" },
            averageSubmissions: { $avg: "$totalSubmissions" },
          },
        },
      ])
      .exec();

    return (
      stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        totalRevenue: 0,
        averageSubmissions: 0,
      }
    );
  }

  async requestPlanChange(
    userId: ObjectIdType,
    requestPlanChangeDto: RequestPlanChangeDto
  ): Promise<any> {
    // Check if user has an existing plan
    const existingUserPlan = await this.userPlanModel
      .findOne({ user: userId })
      .exec();

    if (!existingUserPlan) {
      throw new NotFoundException("User plan not found");
    }

    // For MVP, we'll just return a mock payment URL
    // In production, this would redirect to Click or Payme
    return {
      userPlanId: existingUserPlan._id,
      targetPlanId: requestPlanChangeDto.planId,
      reason: requestPlanChangeDto.reason,
      paymentUrl: `https://mock-payment.com/pay?userPlanId=${existingUserPlan._id}&planId=${requestPlanChangeDto.planId}`,
      message: "Redirect to payment gateway for plan upgrade",
    };
  }

  async processMockPayment(
    userId: ObjectIdType,
    mockPaymentDto: MockPaymentDto
  ): Promise<any> {
    // Find the target plan
    const targetPlan = await this.planModel
      .findById(mockPaymentDto.planId)
      .exec();
    if (!targetPlan) {
      throw new NotFoundException(
        `Plan with ID ${mockPaymentDto.planId} not found`
      );
    }

    // Check if the plan is active
    if (!targetPlan.isActive) {
      throw new BadRequestException(`Plan ${targetPlan.title} is not active`);
    }

    // Find user's current plan, create free plan if doesn't exist
    let userPlan: UserPlanDocument | null = await this.userPlanModel
      .findOne({ user: userId })
      .exec();
    if (!userPlan) {
      // Create a free plan for the user first
      userPlan = await this.createFreePlanForUser(userId);
    }

    // Check if user is trying to upgrade to the same plan
    if (userPlan.plan.toString() === targetPlan._id.toString()) {
      throw new BadRequestException("You are already subscribed to this plan");
    }

    // Simulate payment processing (90% success rate)
    const paymentSuccess = Math.random() > 0.1;
    if (!paymentSuccess) {
      throw new BadRequestException("Payment failed - please try again");
    }

    // Update user plan with new plan details
    userPlan.plan = targetPlan._id.toString();
    userPlan.paymentStatus = PaymentStatus.COMPLETED;
    userPlan.totalPaidAmount += targetPlan.price || 0;
    userPlan.lastPaymentDate = new Date();
    userPlan.subscriptionType = SubscriptionType.PAID;
    userPlan.hasPaidPlan = true;
    userPlan.subscriptionStartDate = new Date();
    userPlan.subscriptionEndDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ); // 30 days
    userPlan.nextPaymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    userPlan.submissionsLimit =
      targetPlan.maxSubmissions || userPlan.submissionsLimit;
    userPlan.features = targetPlan.features || userPlan.features;
    userPlan.paymentMethodId = mockPaymentDto.paymentMethod;

    await userPlan.save();

    return {
      userPlanId: userPlan._id,
      planId: targetPlan._id,
      planName: targetPlan.title,
      paymentStatus: PaymentStatus.COMPLETED,
      paymentMethod: mockPaymentDto.paymentMethod,
      amount: targetPlan.price || 0,
      subscriptionEndDate: userPlan.subscriptionEndDate,
      submissionsLimit: userPlan.submissionsLimit,
      message: "Payment processed successfully",
    };
  }

  async createFreePlanForUser(userId: ObjectIdType): Promise<UserPlanDocument> {
    // Find the free plan
    const freePlan = await this.planModel.findOne({ type: "FREE" }).exec();

    if (!freePlan) {
      throw new NotFoundException("Free plan not found");
    }

    // Check if user already has a plan
    const existingUserPlan = await this.userPlanModel
      .findOne({ user: userId })
      .exec();
    if (existingUserPlan) {
      return existingUserPlan;
    }

    // Create free plan for user
    const userPlanData = {
      user: userId,
      plan: freePlan._id,
      status: UserPlanStatus.ACTIVE,
      subscriptionType: SubscriptionType.FREE,
      paymentStatus: PaymentStatus.COMPLETED,
      submissionsLimit: freePlan.maxSubmissions || 5, // Default free plan limit
      features: freePlan.features || [],
      isActive: true,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year for free plan
    };

    const userPlan = new this.userPlanModel(userPlanData);
    return userPlan.save();
  }

  async checkSubmissionLimit(userId: ObjectIdType): Promise<{
    canSubmit: boolean;
    remainingSubmissions: number;
    limit: number;
  }> {
    const userPlan = await this.userPlanModel.findOne({ user: userId }).exec();

    if (!userPlan) {
      throw new NotFoundException("User plan not found");
    }

    // Check if plan is active
    if (userPlan.status !== UserPlanStatus.ACTIVE || !userPlan.isActive) {
      return {
        canSubmit: false,
        remainingSubmissions: 0,
        limit: userPlan.submissionsLimit,
      };
    }

    // Check if subscription is expired
    if (
      userPlan.subscriptionEndDate &&
      userPlan.subscriptionEndDate < new Date()
    ) {
      return {
        canSubmit: false,
        remainingSubmissions: 0,
        limit: userPlan.submissionsLimit,
      };
    }

    // Check submission limits
    const remainingSubmissions = Math.max(
      0,
      userPlan.submissionsLimit - userPlan.submissionsUsed
    );
    const canSubmit = remainingSubmissions > 0;

    return {
      canSubmit,
      remainingSubmissions,
      limit: userPlan.submissionsLimit,
    };
  }

  async incrementSubmissionCount(userId: ObjectIdType): Promise<void> {
    const userPlan = await this.userPlanModel.findOne({ user: userId }).exec();

    if (!userPlan) {
      throw new NotFoundException("User plan not found");
    }

    userPlan.submissionsUsed += 1;
    userPlan.totalSubmissions += 1;
    await userPlan.save();
  }
}
