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
import { UserPlanService } from './user-plan.service';
import { CreateUserPlanDto, UpdateUserPlanDto, ObjectIdDto } from './dto/user-plan.dto';

@ApiTags('user-plans')
@Controller('user-plans')
export class UserPlanController {
  constructor(private readonly userPlanService: UserPlanService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user plan' })
  @ApiResponse({ status: 201, description: 'User plan created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createUserPlanDto: CreateUserPlanDto) {
    const userPlan = await this.userPlanService.create(createUserPlanDto);
    return {
      message: 'User plan created successfully',
      data: userPlan,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all user plans' })
  @ApiResponse({ status: 200, description: 'User plans retrieved successfully' })
  async findAll() {
    const userPlans = await this.userPlanService.findAll();
    return { data: userPlans };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user plan by ID' })
  @ApiResponse({ status: 200, description: 'User plan retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User plan not found' })
  async findOne(@Param() params: ObjectIdDto) {
    const userPlan = await this.userPlanService.findOne(params.id);
    return { data: userPlan };
  }

  @Get('user/:id/balance')
  @ApiOperation({ summary: 'Get user balance' })
  @ApiResponse({ status: 200, description: 'User balance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User plan not found' })
  async getUserBalance(@Param() params: ObjectIdDto) {
    const balance = await this.userPlanService.getUserBalance(params.id);
    return { data: balance };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user plan' })
  @ApiResponse({ status: 200, description: 'User plan updated successfully' })
  @ApiResponse({ status: 404, description: 'User plan not found' })
  async update(@Param() params: ObjectIdDto, @Body() updateUserPlanDto: UpdateUserPlanDto) {
    const userPlan = await this.userPlanService.update(params.id, updateUserPlanDto);
    return {
      message: 'User plan updated successfully',
      data: userPlan,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user plan' })
  @ApiResponse({ status: 200, description: 'User plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'User plan not found' })
  async remove(@Param() params: ObjectIdDto) {
    const userPlan = await this.userPlanService.remove(params.id);
    return {
      message: 'User plan deleted successfully',
      data: userPlan,
    };
  }
}
