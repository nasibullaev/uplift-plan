import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Plan, PlanDocument } from "./schemas/plan.schema";
import { CreatePlanDto, UpdatePlanDto, QueryPlanDto } from "./dto/plan.dto";
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

@Injectable()
export class PlanService {
  constructor(@InjectModel(Plan.name) private planModel: Model<PlanDocument>) {}

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    const createdPlan = new this.planModel(createPlanDto);
    return createdPlan.save();
  }

  async findAll(queryDto: QueryPlanDto): Promise<PaginatedResult<Plan>> {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      billingCycle,
      currency,
      minPrice,
      maxPrice,
      isActive,
      isPopular,
      sortBy = "sortOrder",
      sortOrder = "asc",
      tags,
    } = queryDto;

    // Build filter object
    const filter: any = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { features: { $regex: search, $options: "i" } },
      ];
    }

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (billingCycle) filter.billingCycle = billingCycle;
    if (currency) filter.currency = currency;
    if (isActive !== undefined) filter.isActive = isActive;
    if (isPopular !== undefined) filter.isPopular = isPopular;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [data, total] = await Promise.all([
      this.planModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.planModel.countDocuments(filter).exec(),
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

  async findOne(id: ObjectIdType): Promise<Plan> {
    const plan = await this.planModel.findById(id).exec();
    if (!plan) {
      throw new NotFoundException("Plan not found");
    }
    return plan;
  }

  async update(id: ObjectIdType, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.planModel
      .findByIdAndUpdate(id, updatePlanDto, { new: true })
      .exec();
    if (!plan) {
      throw new NotFoundException("Plan not found");
    }
    return plan;
  }

  async remove(id: ObjectIdType): Promise<Plan> {
    const plan = await this.planModel.findByIdAndDelete(id).exec();
    if (!plan) {
      throw new NotFoundException("Plan not found");
    }
    return plan;
  }

  // New enhanced methods
  async findActivePlans(): Promise<Plan[]> {
    return this.planModel
      .find({ isActive: true, status: "ACTIVE" })
      .sort({ sortOrder: 1, createdAt: -1 })
      .exec();
  }

  async findPopularPlans(): Promise<Plan[]> {
    return this.planModel
      .find({ isPopular: true, isActive: true })
      .sort({ sortOrder: 1 })
      .exec();
  }

  async findByType(type: string): Promise<Plan[]> {
    return this.planModel
      .find({ type, isActive: true })
      .sort({ sortOrder: 1 })
      .exec();
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Plan[]> {
    return this.planModel
      .find({
        price: { $gte: minPrice, $lte: maxPrice },
        isActive: true,
      })
      .sort({ price: 1 })
      .exec();
  }

  async getPlanStats(): Promise<any> {
    const stats = await this.planModel.aggregate([
      {
        $group: {
          _id: null,
          totalPlans: { $sum: 1 },
          activePlans: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          popularPlans: {
            $sum: { $cond: [{ $eq: ["$isPopular", true] }, 1, 0] },
          },
          averagePrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]);

    const typeStats = await this.planModel.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    const currencyStats = await this.planModel.aggregate([
      { $group: { _id: "$currency", count: { $sum: 1 } } },
    ]);

    return {
      overview: stats[0] || {},
      byType: typeStats,
      byCurrency: currencyStats,
    };
  }

  async bulkUpdateStatus(ids: string[], status: string): Promise<any> {
    return this.planModel.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );
  }

  async duplicatePlan(id: ObjectIdType, newTitle: string): Promise<Plan> {
    const originalPlan = await this.findOne(id);
    const { _id, createdAt, updatedAt, ...planData } = (
      originalPlan as PlanDocument
    ).toObject();
    const duplicatedPlan = new this.planModel({
      ...planData,
      title: newTitle,
    });
    return duplicatedPlan.save();
  }

  async handleUpliftPlan(order: any): Promise<void> {
    const product = order.products[0];
    const userId = order.user._id;
    const plan = await this.planModel.findById(product._id).exec();
    if (!plan) {
      throw new NotFoundException("Plan not found");
    }
    // This would typically interact with user plan service
    // await this.userPlanService.incBalance(userId, plan.trialCount);
  }
}
