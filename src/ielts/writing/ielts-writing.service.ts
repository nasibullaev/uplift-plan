import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  IELTSWriting,
  IELTSWritingDocument,
} from "./schemas/ielts-writing.schema";
import {
  CreateIELTSWritingDto,
  UpdateIELTSWritingDto,
} from "./dto/ielts-writing.dto";
import { ObjectIdType } from "../../types/object-id.type";

@Injectable()
export class IELTSWritingService {
  constructor(
    @InjectModel(IELTSWriting.name)
    private ieltsWritingModel: Model<IELTSWritingDocument>
  ) {}

  async create(
    createIELTSWritingDto: CreateIELTSWritingDto
  ): Promise<IELTSWriting> {
    const createdIELTSWriting = new this.ieltsWritingModel(
      createIELTSWritingDto
    );
    return createdIELTSWriting.save();
  }

  async findAll(): Promise<IELTSWriting[]> {
    return this.ieltsWritingModel.find().exec();
  }

  async findOne(id: ObjectIdType): Promise<IELTSWriting> {
    const ieltsWriting = await this.ieltsWritingModel.findById(id).exec();
    if (!ieltsWriting) {
      throw new NotFoundException("IELTS Writing task not found");
    }
    return ieltsWriting;
  }

  async update(
    id: ObjectIdType,
    updateIELTSWritingDto: UpdateIELTSWritingDto
  ): Promise<IELTSWriting> {
    const ieltsWriting = await this.ieltsWritingModel
      .findByIdAndUpdate(id, updateIELTSWritingDto, { new: true })
      .exec();
    if (!ieltsWriting) {
      throw new NotFoundException("IELTS Writing task not found");
    }
    return ieltsWriting;
  }

  async remove(id: ObjectIdType): Promise<IELTSWriting> {
    const ieltsWriting = await this.ieltsWritingModel
      .findByIdAndDelete(id)
      .exec();
    if (!ieltsWriting) {
      throw new NotFoundException("IELTS Writing task not found");
    }
    return ieltsWriting;
  }
}
