import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PaymeService } from "./payme.service";
import { PaymeTestService } from "./payme-test.service";
import { PaymentController } from "./payment.controller";
import { UserPlanModule } from "../user-plan/user-plan.module";
import { PlanModule } from "../plan/plan.module";

@Module({
  imports: [ConfigModule, UserPlanModule, PlanModule],
  providers: [PaymeService, PaymeTestService],
  controllers: [PaymentController],
  exports: [PaymeService, PaymeTestService],
})
export class PaymentModule {}
