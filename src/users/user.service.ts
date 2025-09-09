import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import {
  User,
  UserDocument,
  UserRole,
  UserStatus,
} from "./schemas/user.schema";
import { CreateUserDto, QueryUserDto } from "./dto/user.dto";
import { ObjectIdType } from "../types/object-id.type";
import { UserPlanService } from "../user-plan/user-plan.service";

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    @Inject(forwardRef(() => UserPlanService))
    private userPlanService: UserPlanService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      phone: createUserDto.phone,
    });
    if (existingUser) {
      throw new ConflictException("User with this phone number already exists");
    }

    const createdUser = new this.userModel(createUserDto);
    const savedUser = await createdUser.save();

    // Create free plan for new user - TEMPORARILY DISABLED FOR DEBUGGING
    // try {
    //   await this.userPlanService.createFreePlanForUser(
    //     savedUser._id.toString()
    //   );
    // } catch (error) {
    //   console.error("Failed to create free plan for user:", error);
    //   // Don't throw error here as user creation should succeed even if plan creation fails
    // }

    return savedUser;
  }

  async findAll(queryDto: QueryUserDto): Promise<PaginatedResult<User>> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = queryDto;

    // Build filter object
    const filter: any = {};

    if (search) {
      filter.$or = [{ phone: { $regex: search, $options: "i" } }];
    }

    if (role) filter.role = role;
    if (status) filter.status = status;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select("-verificationCode -verificationCodeExpires")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: ObjectIdType): Promise<User> {
    const user = await this.userModel
      .findById(id)
      .select("-verificationCode -verificationCodeExpires")
      .exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async findByPhone(phone: string): Promise<User> {
    const user = await this.userModel
      .findOne({ phone })
      .select("-verificationCode -verificationCodeExpires")
      .exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async findByPhoneWithVerification(phone: string): Promise<User> {
    const user = await this.userModel.findOne({ phone }).exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async updateVerificationCode(
    id: ObjectIdType,
    updateData: {
      verificationCode?: string | null;
      verificationCodeExpires?: Date | null;
      phoneVerified?: boolean;
    }
  ): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select("-verificationCode -verificationCodeExpires")
      .exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async remove(id: ObjectIdType): Promise<User> {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async loginWithPhone(
    phone: string
  ): Promise<{ user: User; accessToken: string }> {
    const user = await this.userModel
      .findOne({ phone })
      .select("-verificationCode -verificationCodeExpires")
      .exec();
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Account is not active");
    }

    if (!user.phoneVerified) {
      throw new UnauthorizedException("Phone number not verified");
    }

    // Update last login
    await this.userModel
      .findByIdAndUpdate(user._id, { lastLoginAt: new Date() })
      .exec();

    // Generate JWT token
    const payload = { sub: user._id, phone: user.phone, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      user,
      accessToken,
    };
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return this.userModel
      .find({ role })
      .select("-verificationCode -verificationCodeExpires")
      .exec();
  }

  async updateUserStatus(id: ObjectIdType, status: UserStatus): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .select("-verificationCode -verificationCodeExpires")
      .exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }
}
