import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserPlan, UserPlanDocument } from './schemas/user-plan.schema';
import { CreateUserPlanDto, UpdateUserPlanDto } from './dto/user-plan.dto';
import { ObjectIdType } from '../types/object-id.type';

@Injectable()
export class UserPlanService {
  constructor(@InjectModel(UserPlan.name) private userPlanModel: Model<UserPlanDocument>) {}

  async create(createUserPlanDto: CreateUserPlanDto): Promise<UserPlan> {
    const createdUserPlan = new this.userPlanModel(createUserPlanDto);
    return createdUserPlan.save();
  }

  async findAll(): Promise<UserPlan[]> {
    return this.userPlanModel.find().exec();
  }

  async findOne(id: ObjectIdType): Promise<UserPlan> {
    const userPlan = await this.userPlanModel.findById(id).exec();
    if (!userPlan) {
      throw new NotFoundException('User plan not found');
    }
    return userPlan;
  }

  async findByUserId(userId: ObjectIdType): Promise<UserPlan> {
    const userPlan = await this.userPlanModel.findOne({ user: userId }).exec();
    if (!userPlan) {
      throw new NotFoundException('User plan not found');
    }
    return userPlan;
  }

  async update(id: ObjectIdType, updateUserPlanDto: UpdateUserPlanDto): Promise<UserPlan> {
    const userPlan = await this.userPlanModel.findByIdAndUpdate(id, updateUserPlanDto, { new: true }).exec();
    if (!userPlan) {
      throw new NotFoundException('User plan not found');
    }
    return userPlan;
  }

  async remove(id: ObjectIdType): Promise<UserPlan> {
    const userPlan = await this.userPlanModel.findByIdAndDelete(id).exec();
    if (!userPlan) {
      throw new NotFoundException('User plan not found');
    }
    return userPlan;
  }

  async incrementTrialCount(userId: ObjectIdType, count: number = 1): Promise<UserPlan> {
    const userPlan = await this.userPlanModel.findOneAndUpdate(
      { user: userId },
      { $inc: { premiumTrialCount: count } },
      { new: true, upsert: true }
    ).exec();
    return userPlan;
  }

  async decrementBalance(userId: ObjectIdType, count: number = 1): Promise<UserPlan> {
    const userPlan = await this.userPlanModel.findOne({ user: userId }).exec();
    if (!userPlan) {
      throw new NotFoundException('User plan not found');
    }

    if (userPlan.premiumTrialCount > 0) {
      const updated = await this.userPlanModel.findOneAndUpdate(
        { user: userId },
        { $inc: { premiumTrialCount: -count } },
        { new: true }
      ).exec();
      return updated;
    }

    if (userPlan.freeTrialCount > 0) {
      const updated = await this.userPlanModel.findOneAndUpdate(
        { user: userId },
        { $inc: { freeTrialCount: -count } },
        { new: true }
      ).exec();
      return updated;
    }

    throw new BadRequestException('User has no access to plan');
  }

  async getUserBalance(userId: ObjectIdType): Promise<UserPlan> {
    const userPlan = await this.userPlanModel.findOne({ user: userId }).exec();
    if (!userPlan) {
      throw new NotFoundException('User plan not found');
    }

    // In a real application, you would check for active paid orders here
    // const hasPaid = await this.orderService.hasActivePaidPlanOrder(userId);
    
    return { ...userPlan.toObject(), hasPaidPlan: false };
  }

  async hasUserAccess(userId: ObjectIdType): Promise<boolean> {
    const userPlan = await this.userPlanModel.findOne({ user: userId }).exec();
    if (!userPlan) {
      return false;
    }
    return userPlan.freeTrialCount > 0 || userPlan.premiumTrialCount > 0 || userPlan.hasPaidPlan;
  }
}
