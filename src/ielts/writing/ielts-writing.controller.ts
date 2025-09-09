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
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { IELTSWritingService } from "./ielts-writing.service";
import {
  CreateIELTSWritingDto,
  UpdateIELTSWritingDto,
  ObjectIdDto,
} from "./dto/ielts-writing.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../users/schemas/user.schema";

@ApiTags("ielts-writing")
@Controller("ielts-writing")
export class IELTSWritingController {
  constructor(private readonly ieltsWritingService: IELTSWritingService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create a new IELTS writing task (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "IELTS writing task created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async create(@Body() createIELTSWritingDto: CreateIELTSWritingDto) {
    const ieltsWriting = await this.ieltsWritingService.create(
      createIELTSWritingDto
    );
    return {
      message: "IELTS writing task created successfully",
      data: ieltsWriting,
    };
  }

  @Get()
  @ApiOperation({ summary: "Get all IELTS writing tasks" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing tasks retrieved successfully",
  })
  async findAll() {
    const ieltsWritings = await this.ieltsWritingService.findAll();
    return { data: ieltsWritings };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get IELTS writing task by ID" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing task retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "IELTS writing task not found" })
  async findOne(@Param() params: ObjectIdDto) {
    const ieltsWriting = await this.ieltsWritingService.findOne(params.id);
    return { data: ieltsWriting };
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update IELTS writing task (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing task updated successfully",
  })
  @ApiResponse({ status: 404, description: "IELTS writing task not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async update(
    @Param() params: ObjectIdDto,
    @Body() updateIELTSWritingDto: UpdateIELTSWritingDto
  ) {
    const ieltsWriting = await this.ieltsWritingService.update(
      params.id,
      updateIELTSWritingDto
    );
    return {
      message: "IELTS writing task updated successfully",
      data: ieltsWriting,
    };
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete IELTS writing task (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing task deleted successfully",
  })
  @ApiResponse({ status: 404, description: "IELTS writing task not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async remove(@Param() params: ObjectIdDto) {
    const ieltsWriting = await this.ieltsWritingService.remove(params.id);
    return {
      message: "IELTS writing task deleted successfully",
      data: ieltsWriting,
    };
  }
}
