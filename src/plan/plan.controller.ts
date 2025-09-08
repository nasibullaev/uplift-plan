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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlanService } from './plan.service';
import { CreatePlanDto, UpdatePlanDto, ObjectIdDto } from './dto/plan.dto';

@ApiTags('plans')
@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new plan' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createPlanDto: CreatePlanDto) {
    const plan = await this.planService.create(createPlanDto);
    return {
      message: 'Plan created successfully',
      data: plan,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all plans' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully' })
  async findAll() {
    const plans = await this.planService.findAll();
    return { data: plans };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID' })
  @ApiResponse({ status: 200, description: 'Plan retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async findOne(@Param() params: ObjectIdDto) {
    const plan = await this.planService.findOne(params.id);
    return { data: plan };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update plan' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async update(@Param() params: ObjectIdDto, @Body() updatePlanDto: UpdatePlanDto) {
    const plan = await this.planService.update(params.id, updatePlanDto);
    return {
      message: 'Plan updated successfully',
      data: plan,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete plan' })
  @ApiResponse({ status: 200, description: 'Plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async remove(@Param() params: ObjectIdDto) {
    const plan = await this.planService.remove(params.id);
    return {
      message: 'Plan deleted successfully',
      data: plan,
    };
  }
}
