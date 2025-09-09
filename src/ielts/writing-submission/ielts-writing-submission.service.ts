import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  IELTSWritingSubmission,
  IELTSWritingSubmissionDocument,
} from "./schemas/ielts-writing-submission.schema";
import {
  CreateIELTSWritingSubmissionDto,
  UpdateIELTSWritingSubmissionDto,
} from "./dto/ielts-writing-submission.dto";
import { ObjectIdType } from "../../types/object-id.type";
import { UserPlanService } from "../../user-plan/user-plan.service";

@Injectable()
export class IELTSWritingSubmissionService {
  constructor(
    @InjectModel(IELTSWritingSubmission.name)
    private ieltsWritingSubmissionModel: Model<IELTSWritingSubmissionDocument>,
    private userPlanService: UserPlanService
  ) {}

  async create(
    createIELTSWritingSubmissionDto: CreateIELTSWritingSubmissionDto,
    userId: ObjectIdType
  ): Promise<IELTSWritingSubmission> {
    // Check submission limit before creating
    const submissionLimit =
      await this.userPlanService.checkSubmissionLimit(userId);

    if (!submissionLimit.canSubmit) {
      throw new BadRequestException(
        `You have reached your submission limit of ${submissionLimit.limit}. You have ${submissionLimit.remainingSubmissions} submissions remaining.`
      );
    }

    const submissionData = {
      ...createIELTSWritingSubmissionDto,
      user: userId,
    };

    const createdIELTSWritingSubmission = new this.ieltsWritingSubmissionModel(
      submissionData
    );

    const savedSubmission = await createdIELTSWritingSubmission.save();

    // Increment submission count after successful creation
    await this.userPlanService.incrementSubmissionCount(userId);

    return savedSubmission;
  }

  async findAll(): Promise<IELTSWritingSubmission[]> {
    return this.ieltsWritingSubmissionModel
      .find()
      .populate("user", "firstName lastName email role")
      .exec();
  }

  async findOne(id: ObjectIdType): Promise<IELTSWritingSubmission> {
    const ieltsWritingSubmission = await this.ieltsWritingSubmissionModel
      .findById(id)
      .populate("user", "firstName lastName email role")
      .exec();
    if (!ieltsWritingSubmission) {
      throw new NotFoundException("IELTS Writing submission not found");
    }
    return ieltsWritingSubmission;
  }

  async findByUserId(userId: ObjectIdType): Promise<IELTSWritingSubmission[]> {
    return this.ieltsWritingSubmissionModel.find({ user: userId }).exec();
  }

  async update(
    id: ObjectIdType,
    updateIELTSWritingSubmissionDto: UpdateIELTSWritingSubmissionDto
  ): Promise<IELTSWritingSubmission> {
    const ieltsWritingSubmission = await this.ieltsWritingSubmissionModel
      .findByIdAndUpdate(id, updateIELTSWritingSubmissionDto, { new: true })
      .exec();
    if (!ieltsWritingSubmission) {
      throw new NotFoundException("IELTS Writing submission not found");
    }
    return ieltsWritingSubmission;
  }

  async remove(id: ObjectIdType): Promise<IELTSWritingSubmission> {
    const ieltsWritingSubmission = await this.ieltsWritingSubmissionModel
      .findByIdAndDelete(id)
      .exec();
    if (!ieltsWritingSubmission) {
      throw new NotFoundException("IELTS Writing submission not found");
    }
    return ieltsWritingSubmission;
  }

  async updateStatus(
    id: ObjectIdType,
    status: string
  ): Promise<IELTSWritingSubmission> {
    const ieltsWritingSubmission = await this.ieltsWritingSubmissionModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
    if (!ieltsWritingSubmission) {
      throw new NotFoundException("IELTS Writing submission not found");
    }
    return ieltsWritingSubmission;
  }

  async checkSubmissionLimit(userId: ObjectIdType): Promise<{
    canSubmit: boolean;
    remainingSubmissions: number;
    limit: number;
  }> {
    return this.userPlanService.checkSubmissionLimit(userId);
  }
}
