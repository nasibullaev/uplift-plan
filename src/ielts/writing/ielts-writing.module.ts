import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IELTSWritingController } from "./ielts-writing.controller";
import { IELTSWritingService } from "./ielts-writing.service";
import {
  IELTSWriting,
  IELTSWritingSchema,
} from "./schemas/ielts-writing.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IELTSWriting.name, schema: IELTSWritingSchema },
    ]),
  ],
  controllers: [IELTSWritingController],
  providers: [IELTSWritingService],
  exports: [IELTSWritingService],
})
export class IELTSWritingModule {}
