export enum StatusCode {
  Ok = 200,
  Created = 201,
  BadRequest = 400,
  NotFound = 404,
  InternalServerError = 500,
}

export enum SuccessCode {
  PlanCreated = "Plan created successfully",
  PlanUpdated = "Plan updated successfully",
  PlanDeleted = "Plan deleted successfully",
}

export enum ErrorCode {
  PlanNotFound = "Plan not found",
  UserPlanNotFound = "User plan not found",
  UserPlanNoAccess = "User has no access to plan",
}
