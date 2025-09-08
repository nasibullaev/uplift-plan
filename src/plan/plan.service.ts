import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan, PlanDocument } from './schemas/plan.schema';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { ObjectIdType } from '../types/object-id.type';

@Injectable()
export class PlanService {
  constructor(@InjectModel(Plan.name) private planModel: Model<PlanDocument>) {}

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    const createdPlan = new this.planModel(createPlanDto);
    return createdPlan.save();
  }

  async findAll(): Promise<Plan[]> {
    return this.planModel.find().exec();
  }

  async findOne(id: ObjectIdType): Promise<Plan> {
    const plan = await this.planModel.findById(id).exec();
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  async update(id: ObjectIdType, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.planModel.findByIdAndUpdate(id, updatePlanDto, { new: true }).exec();
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  async remove(id: ObjectIdType): Promise<Plan> {
    const plan = await this.planModel.findByIdAndDelete(id).exec();
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  async handleUpliftPlan(order: any): Promise<void> {
    const product = order.products[0];
    const userId = order.user._id;
    const plan = await this.planModel.findById(product._id).exec();
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    // This would typically interact with user plan service
    // await this.userPlanService.incBalance(userId, plan.trialCount);
  }
}
