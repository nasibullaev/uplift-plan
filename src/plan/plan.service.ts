import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Plan, PlanDocument } from "./schemas/plan.schema";
import { CreatePlanDto, UpdatePlanDto } from "./dto/plan.dto";
import { ObjectIdType } from "../types/object-id.type";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class PlanService {
  constructor(@InjectModel(Plan.name) private planModel: Model<PlanDocument>) {}

  async create(createPlanDto: CreatePlanDto, iconFile?: any): Promise<Plan> {
    let iconPath: string | undefined;

    // Handle icon upload if provided
    if (iconFile) {
      iconPath = await this.uploadIcon(iconFile);
    }

    // Create plan with icon path
    const planData = {
      ...createPlanDto,
      icon: iconPath,
    };

    const createdPlan = new this.planModel(planData);
    return createdPlan.save();
  }

  async uploadIcon(file: any): Promise<string> {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    // Check if file is SVG
    if (
      file.mimetype !== "image/svg+xml" &&
      !file.originalname.toLowerCase().endsWith(".svg")
    ) {
      throw new BadRequestException("Only SVG files are allowed");
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads", "icons");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `plan-icon-${timestamp}.svg`;
    const filePath = path.join(uploadsDir, filename);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Return relative path for API
    return `/uploads/icons/${filename}`;
  }

  async findAll(): Promise<Plan[]> {
    return this.planModel.find().sort({ sortOrder: 1 }).exec();
  }

  async findOne(id: ObjectIdType): Promise<Plan> {
    const plan = await this.planModel.findById(id).exec();
    if (!plan) {
      throw new NotFoundException("Plan not found");
    }
    return plan;
  }

  async update(
    id: ObjectIdType,
    updatePlanDto: UpdatePlanDto,
    iconFile?: any
  ): Promise<Plan> {
    let updateData: any = { ...updatePlanDto };

    // Handle icon upload if provided
    if (iconFile) {
      const iconPath = await this.uploadIcon(iconFile);
      updateData.icon = iconPath;
    }

    const plan = await this.planModel
      .findByIdAndUpdate(id, updateData, { new: true })
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

  async findFreePlan(): Promise<Plan> {
    const freePlan = await this.planModel
      .findOne({
        type: "FREE",
        isActive: true,
        status: "ACTIVE",
      })
      .exec();

    if (!freePlan) {
      throw new Error("No active free plan found in the system");
    }

    return freePlan;
  }
}
