import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserPlanController } from "./user-plan.controller";
import { UserPlanService } from "./user-plan.service";
import { UserPlan, UserPlanSchema } from "./schemas/user-plan.schema";
import { Plan, PlanSchema } from "../plan/schemas/plan.schema";
import {
  IELTSWritingSubmission,
  IELTSWritingSubmissionSchema,
} from "../ielts/writing-submission/schemas/ielts-writing-submission.schema";
import { User, UserSchema } from "../users/schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserPlan.name, schema: UserPlanSchema },
      { name: Plan.name, schema: PlanSchema },
      {
        name: IELTSWritingSubmission.name,
        schema: IELTSWritingSubmissionSchema,
      },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [UserPlanController],
  providers: [UserPlanService],
  exports: [UserPlanService],
})
export class UserPlanModule {}
