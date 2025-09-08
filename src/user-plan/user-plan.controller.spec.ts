import { Test, TestingModule } from "@nestjs/testing";
import { UserPlanController } from "./user-plan.controller";
import { UserPlanService } from "./user-plan.service";

describe("UserPlanController", () => {
  let controller: UserPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPlanController],
      providers: [UserPlanService],
    }).compile();

    controller = module.get<UserPlanController>(UserPlanController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
