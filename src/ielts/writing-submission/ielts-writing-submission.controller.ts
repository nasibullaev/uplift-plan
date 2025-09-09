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
  ApiBody,
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
  @ApiOperation({
    summary: "Create a new IELTS writing submission",
    description:
      "Submit an IELTS writing task for AI analysis. Choose between GENERATED (use existing writing task) or CUSTOM (provide your own question). The submission will be analyzed based on your target score.",
  })
  @ApiBody({
    type: CreateIELTSWritingSubmissionDto,
    description: "IELTS writing submission data",
    examples: {
      "Generated Task": {
        summary: "Submit using existing writing task",
        description: "Use an existing writing task from the database",
        value: {
          writing: "68beebafa02d9604a4cadcd9",
          body: "In today's rapidly evolving world, technology has become an integral part of our daily lives. While some argue that technological advancements have complicated our existence, others maintain that these innovations have streamlined and simplified our routines. This essay will explore both perspectives and provide a balanced view on this contentious issue.\n\nOn one hand, critics of technology argue that it has introduced unnecessary complexity into our lives. The constant influx of new devices, applications, and digital platforms requires continuous learning and adaptation. Many people find themselves overwhelmed by the sheer volume of information available online, leading to decision fatigue and increased stress levels. Furthermore, the expectation to be constantly connected and responsive has blurred the boundaries between work and personal life, creating additional pressure and anxiety.\n\nOn the other hand, proponents of technology highlight its numerous benefits in simplifying daily tasks. Smartphones, for instance, have consolidated multiple functions into a single device, eliminating the need for separate cameras, calculators, maps, and communication tools. Online banking and shopping have reduced the time spent on errands, while digital calendars and reminder systems help organize our schedules more efficiently. Additionally, technology has made information more accessible, allowing people to learn new skills, access healthcare services, and connect with others regardless of geographical barriers.\n\nIn conclusion, while technology has indeed introduced certain complexities, its overall impact has been largely positive in simplifying our daily routines. The key lies in finding a balance and using technology mindfully to enhance rather than complicate our lives.",
          topic: "GENERATED",
          targetScore: "BAND_SEVEN",
        },
      },
      "Custom Task": {
        summary: "Submit with custom question",
        description: "Provide your own writing question",
        value: {
          customWritingQuestion:
            "Some people believe that technology has made our lives more complicated, while others argue that it has simplified our daily routines. Discuss both views and give your opinion.",
          body: "In today's rapidly evolving world, technology has become an integral part of our daily lives. While some argue that technological advancements have complicated our existence, others maintain that these innovations have streamlined and simplified our routines. This essay will explore both perspectives and provide a balanced view on this contentious issue.\n\nOn one hand, critics of technology argue that it has introduced unnecessary complexity into our lives. The constant influx of new devices, applications, and digital platforms requires continuous learning and adaptation. Many people find themselves overwhelmed by the sheer volume of information available online, leading to decision fatigue and increased stress levels. Furthermore, the expectation to be constantly connected and responsive has blurred the boundaries between work and personal life, creating additional pressure and anxiety.\n\nOn the other hand, proponents of technology highlight its numerous benefits in simplifying daily tasks. Smartphones, for instance, have consolidated multiple functions into a single device, eliminating the need for separate cameras, calculators, maps, and communication tools. Online banking and shopping have reduced the time spent on errands, while digital calendars and reminder systems help organize our schedules more efficiently. Additionally, technology has made information more accessible, allowing people to learn new skills, access healthcare services, and connect with others regardless of geographical barriers.\n\nIn conclusion, while technology has indeed introduced certain complexities, its overall impact has been largely positive in simplifying our daily routines. The key lies in finding a balance and using technology mindfully to enhance rather than complicate our lives.",
          topic: "CUSTOM",
          targetScore: "BAND_EIGHT",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "IELTS writing submission created successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "IELTS writing submission created successfully",
        },
        data: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "68c1234567890abcdef12345",
            },
            user: {
              type: "string",
              example: "68c05c0ca6a55767b83c9701",
            },
            writing: {
              type: "string",
              example: "68beebafa02d9604a4cadcd9",
            },
            body: {
              type: "string",
              example: "In today's rapidly evolving world...",
            },
            status: {
              type: "string",
              enum: ["IDLE", "IN_PROGRESS", "ANALYZED", "FAILED_TO_CHECK"],
              example: "IDLE",
            },
            topic: {
              type: "string",
              enum: ["GENERATED", "CUSTOM"],
              example: "GENERATED",
            },
            targetScore: {
              type: "string",
              enum: ["BAND_SEVEN", "BAND_EIGHT", "BAND_NINE"],
              example: "BAND_SEVEN",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2025-09-09T17:30:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2025-09-09T17:30:00.000Z",
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      "Bad request - Invalid input data or submission limit exceeded",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  async create(
    @Body() createIELTSWritingSubmissionDto: CreateIELTSWritingSubmissionDto,
    @Request() req
  ) {
    const ieltsWritingSubmission =
      await this.ieltsWritingSubmissionService.create(
        createIELTSWritingSubmissionDto,
        req.user.sub
      );
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

  @Get("submission-limit")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Check current user's submission limit and remaining submissions",
  })
  @ApiResponse({
    status: 200,
    description: "Submission limit information retrieved successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Submission limit information retrieved successfully",
        },
        data: {
          type: "object",
          properties: {
            canSubmit: {
              type: "boolean",
              example: true,
            },
            remainingSubmissions: {
              type: "number",
              example: 3,
            },
            limit: {
              type: "number",
              example: 10,
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  async getSubmissionLimit(@Request() req) {
    const submissionLimit =
      await this.ieltsWritingSubmissionService.checkSubmissionLimit(
        req.user.sub
      );
    return {
      message: "Submission limit information retrieved successfully",
      data: submissionLimit,
    };
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get IELTS writing submission by ID" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing submission retrieved successfully",
  })
  @ApiResponse({
    status: 404,
    description: "IELTS writing submission not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  async findOne(@Param() params: ObjectIdDto) {
    const ieltsWritingSubmission =
      await this.ieltsWritingSubmissionService.findOne(params.id);
    return { data: ieltsWritingSubmission };
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update IELTS writing submission" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing submission updated successfully",
  })
  @ApiResponse({
    status: 404,
    description: "IELTS writing submission not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update IELTS writing submission status" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing submission status updated successfully",
  })
  @ApiResponse({
    status: 404,
    description: "IELTS writing submission not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
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
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
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
