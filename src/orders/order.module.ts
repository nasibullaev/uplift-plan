import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrderService } from "./order.service";
import { Order, OrderSchema } from "./schemas/order.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
