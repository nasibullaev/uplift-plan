import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserPlanController } from "./user-plan.controller";
import { UserPlanService } from "./user-plan.service";
import { UserPlan, UserPlanSchema } from "./schemas/user-plan.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserPlan.name, schema: UserPlanSchema },
    ]),
  ],
  controllers: [UserPlanController],
  providers: [UserPlanService],
  exports: [UserPlanService],
})
export class UserPlanModule {}
