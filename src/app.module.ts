import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { PlanModule } from "./plan/plan.module";
import { UserPlanModule } from "./user-plan/user-plan.module";
import { IELTSModule } from "./ielts/ielts.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || "mongodb://localhost:27017/uplift-plan"
    ),
    PlanModule,
    UserPlanModule,
    IELTSModule,
  ],
})
export class AppModule {}
