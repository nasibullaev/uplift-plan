import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IELTSWritingSubmissionController } from "./ielts-writing-submission.controller";
import { IELTSAIController } from "./ielts-ai.controller";
import { IELTSWritingSubmissionService } from "./ielts-writing-submission.service";
import { GeminiService } from "./gemini.service";
import {
  IELTSWritingSubmission,
  IELTSWritingSubmissionSchema,
} from "./schemas/ielts-writing-submission.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: IELTSWritingSubmission.name,
        schema: IELTSWritingSubmissionSchema,
      },
    ]),
  ],
  controllers: [IELTSWritingSubmissionController, IELTSAIController],
  providers: [IELTSWritingSubmissionService, GeminiService],
  exports: [IELTSWritingSubmissionService, GeminiService],
})
export class IELTSWritingSubmissionModule {}
