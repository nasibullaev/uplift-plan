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
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { IELTSWritingSubmissionService } from "./ielts-writing-submission.service";
import {
  CreateIELTSWritingSubmissionDto,
  UpdateIELTSWritingSubmissionDto,
  ObjectIdDto,
} from "./dto/ielts-writing-submission.dto";

@ApiTags("ielts-writing-submission")
@Controller("ielts-writing-submission")
export class IELTSWritingSubmissionController {
  constructor(
    private readonly ieltsWritingSubmissionService: IELTSWritingSubmissionService
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new IELTS writing submission" })
  @ApiResponse({
    status: 201,
    description: "IELTS writing submission created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async create(
    @Body() createIELTSWritingSubmissionDto: CreateIELTSWritingSubmissionDto
  ) {
    const ieltsWritingSubmission =
      await this.ieltsWritingSubmissionService.create(
        createIELTSWritingSubmissionDto
      );
    return {
      message: "IELTS writing submission created successfully",
      data: ieltsWritingSubmission,
    };
  }

  @Get()
  @ApiOperation({ summary: "Get all IELTS writing submissions" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing submissions retrieved successfully",
  })
  async findAll() {
    const ieltsWritingSubmissions =
      await this.ieltsWritingSubmissionService.findAll();
    return { data: ieltsWritingSubmissions };
  }

  @Get("user/:userId")
  @ApiOperation({ summary: "Get IELTS writing submissions by user ID" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing submissions retrieved successfully",
  })
  async findByUserId(@Param("userId") userId: string) {
    const ieltsWritingSubmissions =
      await this.ieltsWritingSubmissionService.findByUserId(userId);
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
