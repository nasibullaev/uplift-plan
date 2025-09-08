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
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { IELTSWritingService } from "./ielts-writing.service";
import {
  CreateIELTSWritingDto,
  UpdateIELTSWritingDto,
  ObjectIdDto,
} from "./dto/ielts-writing.dto";

@ApiTags("ielts-writing")
@Controller("ielts-writing")
export class IELTSWritingController {
  constructor(private readonly ieltsWritingService: IELTSWritingService) {}

  @Post()
  @ApiOperation({ summary: "Create a new IELTS writing task" })
  @ApiResponse({
    status: 201,
    description: "IELTS writing task created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
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
  @ApiOperation({ summary: "Update IELTS writing task" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing task updated successfully",
  })
  @ApiResponse({ status: 404, description: "IELTS writing task not found" })
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete IELTS writing task" })
  @ApiResponse({
    status: 200,
    description: "IELTS writing task deleted successfully",
  })
  @ApiResponse({ status: 404, description: "IELTS writing task not found" })
  async remove(@Param() params: ObjectIdDto) {
    const ieltsWriting = await this.ieltsWritingService.remove(params.id);
    return {
      message: "IELTS writing task deleted successfully",
      data: ieltsWriting,
    };
  }
}
