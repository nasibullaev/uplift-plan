import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { IELTSWritingSubmissionService } from "./ielts-writing-submission.service";
import {
  CreateIELTSWritingSubmissionDto,
  UpdateIELTSWritingSubmissionDto,
  ObjectIdDto,
} from "./dto/ielts-writing-submission.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../users/schemas/user.schema";

@ApiTags("ielts-writing-submission")
@Controller("ielts-writing-submission")
export class IELTSWritingSubmissionController {
  constructor(
    private readonly ieltsWritingSubmissionService: IELTSWritingSubmissionService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create a new IELTS writing submission" })
  @ApiResponse({
    status: 201,
    description: "IELTS writing submission created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async create(
    @Body() createIELTSWritingSubmissionDto: CreateIELTSWritingSubmissionDto,
    @Request() req
  ) {
    // Add user ID to the submission
    const submissionData = {
      ...createIELTSWritingSubmissionDto,
      user: req.user.sub,
    };

    const ieltsWritingSubmission =
      await this.ieltsWritingSubmissionService.create(submissionData);
    return {
      message: "IELTS writing submission created successfully",
      data: ieltsWritingSubmission,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get all IELTS writing submissions (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing submissions retrieved successfully",
  })
  async findAll() {
    const ieltsWritingSubmissions =
      await this.ieltsWritingSubmissionService.findAll();
    return { data: ieltsWritingSubmissions };
  }

  @Get("my-submissions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get current user's IELTS writing submissions" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing submissions retrieved successfully",
  })
  async getMySubmissions(@Request() req) {
    const ieltsWritingSubmissions =
      await this.ieltsWritingSubmissionService.findByUserId(req.user.sub);
    return { data: ieltsWritingSubmissions };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get IELTS writing submission by ID" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing submission retrieved successfully",
  })
  @ApiResponse({
    status: 404,
    description: "IELTS writing submission not found",
  })
  async findOne(@Param() params: ObjectIdDto) {
    const ieltsWritingSubmission =
      await this.ieltsWritingSubmissionService.findOne(params.id);
    return { data: ieltsWritingSubmission };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update IELTS writing submission" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing submission updated successfully",
  })
  @ApiResponse({
    status: 404,
    description: "IELTS writing submission not found",
  })
  async update(
    @Param() params: ObjectIdDto,
    @Body() updateIELTSWritingSubmissionDto: UpdateIELTSWritingSubmissionDto
  ) {
    const ieltsWritingSubmission =
      await this.ieltsWritingSubmissionService.update(
        params.id,
        updateIELTSWritingSubmissionDto
      );
    return {
      message: "IELTS writing submission updated successfully",
      data: ieltsWritingSubmission,
    };
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update IELTS writing submission status" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing submission status updated successfully",
  })
  @ApiResponse({
    status: 404,
    description: "IELTS writing submission not found",
  })
  @ApiQuery({ name: "status", description: "New status", required: true })
  async updateStatus(
    @Param() params: ObjectIdDto,
    @Query("status") status: string
  ) {
    const ieltsWritingSubmission =
      await this.ieltsWritingSubmissionService.updateStatus(params.id, status);
    return {
      message: "IELTS writing submission status updated successfully",
      data: ieltsWritingSubmission,
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete IELTS writing submission" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing submission deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "IELTS writing submission not found",
  })
  async remove(@Param() params: ObjectIdDto) {
    const ieltsWritingSubmission =
      await this.ieltsWritingSubmissionService.remove(params.id);
    return {
      message: "IELTS writing submission deleted successfully",
      data: ieltsWritingSubmission,
    };
  }
}
