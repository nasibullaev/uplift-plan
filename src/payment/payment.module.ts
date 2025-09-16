import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PaymeService } from "./payme.service";
import { PaymentController } from "./payment.controller";
import { UserPlanModule } from "../user-plan/user-plan.module";
import { PlanModule } from "../plan/plan.module";
import { OrderModule } from "../orders/order.module";
import { TransactionModule } from "../transactions/transaction.module";

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => UserPlanModule),
    PlanModule,
    OrderModule,
    TransactionModule,
  ],
  providers: [PaymeService],
  controllers: [PaymentController],
  exports: [PaymeService],
})
export class PaymentModule {}
