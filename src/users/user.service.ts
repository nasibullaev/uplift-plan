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

export interface UserWithPlan extends User {
  userPlan?: {
    _id: string;
    plan: {
      _id: string;
      title: string;
      price: number;
      currency: string;
      features: string[];
    };
    status: string;
    subscriptionType: string;
    paymentStatus: string;
    submissionsUsed: number;
    submissionsLimit: number;
    hasPaidPlan: boolean;
    subscriptionEndDate?: Date;
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

  async findAll(
    queryDto: QueryUserDto
  ): Promise<PaginatedResult<UserWithPlan>> {
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
    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select("-verificationCode -verificationCodeExpires")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    // Get user plans for all users
    const usersWithPlans: UserWithPlan[] = await Promise.all(
      users.map(async (user) => {
        try {
          const userPlans = await this.userPlanService.findByUserId(
            user._id.toString()
          );
          const userPlan = userPlans.length > 0 ? userPlans[0] : null;

          return {
            ...user.toObject(),
            userPlan: userPlan
              ? {
                  _id: (userPlan as any)._id.toString(),
                  plan: {
                    _id: (userPlan.plan as any)._id.toString(),
                    title: (userPlan.plan as any).title,
                    price: (userPlan.plan as any).price,
                    currency: (userPlan.plan as any).currency,
                    features: (userPlan.plan as any).features || [],
                  },
                  status: userPlan.status,
                  subscriptionType: userPlan.subscriptionType,
                  paymentStatus: userPlan.paymentStatus,
                  submissionsUsed: userPlan.submissionsUsed,
                  submissionsLimit: userPlan.submissionsLimit,
                  hasPaidPlan: userPlan.hasPaidPlan,
                  subscriptionEndDate: userPlan.subscriptionEndDate,
                }
              : undefined,
          };
        } catch (error) {
          // If user plan fetch fails, return user without plan
          return {
            ...user.toObject(),
            userPlan: undefined,
          };
        }
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: usersWithPlans,
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

  async findOne(id: ObjectIdType): Promise<UserWithPlan> {
    const user = await this.userModel
      .findById(id)
      .select("-verificationCode -verificationCodeExpires")
      .exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Get user plan
    try {
      const userPlans = await this.userPlanService.findByUserId(id.toString());
      const userPlan = userPlans.length > 0 ? userPlans[0] : null;

      return {
        ...user.toObject(),
        userPlan: userPlan
          ? {
              _id: (userPlan as any)._id.toString(),
              plan: {
                _id: (userPlan.plan as any)._id.toString(),
                title: (userPlan.plan as any).title,
                price: (userPlan.plan as any).price,
                currency: (userPlan.plan as any).currency,
                features: (userPlan.plan as any).features || [],
              },
              status: userPlan.status,
              subscriptionType: userPlan.subscriptionType,
              paymentStatus: userPlan.paymentStatus,
              submissionsUsed: userPlan.submissionsUsed,
              submissionsLimit: userPlan.submissionsLimit,
              hasPaidPlan: userPlan.hasPaidPlan,
              subscriptionEndDate: userPlan.subscriptionEndDate,
            }
          : undefined,
      };
    } catch (error) {
      // If user plan fetch fails, return user without plan
      return {
        ...user.toObject(),
        userPlan: undefined,
      };
    }
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
