import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IELTSWritingSubmissionController } from "./ielts-writing-submission.controller";
import { IELTSAIController } from "./ielts-ai.controller";
import { IELTSWritingSubmissionService } from "./ielts-writing-submission.service";
import { GeminiService } from "./gemini.service";
import { UserPlanService } from "../../user-plan/user-plan.service";
import {
  IELTSWritingSubmission,
  IELTSWritingSubmissionSchema,
} from "./schemas/ielts-writing-submission.schema";
import {
  UserPlan,
  UserPlanSchema,
} from "../../user-plan/schemas/user-plan.schema";
import { Plan, PlanSchema } from "../../plan/schemas/plan.schema";
import { User, UserSchema } from "../../users/schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: IELTSWritingSubmission.name,
        schema: IELTSWritingSubmissionSchema,
      },
      {
        name: UserPlan.name,
        schema: UserPlanSchema,
      },
      {
        name: Plan.name,
        schema: PlanSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [IELTSWritingSubmissionController, IELTSAIController],
  providers: [IELTSWritingSubmissionService, GeminiService, UserPlanService],
  exports: [IELTSWritingSubmissionService, GeminiService],
})
export class IELTSWritingSubmissionModule {}
