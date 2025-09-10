import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserModule } from "../users/user.module";
import { UserPlanModule } from "../user-plan/user-plan.module";
import { PlanModule } from "../plan/plan.module";

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET") || "your-secret-key",
        signOptions: { expiresIn: "24h" },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    UserPlanModule,
    PlanModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule, JwtStrategy, AuthService],
})
export class AuthModule {}
