import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { PlanModule } from "./plan/plan.module";
import { UserPlanModule } from "./user-plan/user-plan.module";
import { IELTSModule } from "./ielts/ielts.module";
import { UserModule } from "./users/user.module";
import { AuthModule } from "./auth/auth.module";
import { PaymentModule } from "./payment/payment.module";
import { OrderModule } from "./orders/order.module";
import { TransactionModule } from "./transactions/transaction.module";

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
    UserModule,
    AuthModule,
    PaymentModule,
    OrderModule,
    TransactionModule,
  ],
})
export class AppModule {}
