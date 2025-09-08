import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import {
  User,
  UserDocument,
  UserRole,
  UserStatus,
} from "./schemas/user.schema";
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  LoginDto,
} from "./dto/user.dto";
import { ObjectIdType } from "../types/object-id.type";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select("-password").exec();
  }

  async findOne(id: ObjectIdType): Promise<User> {
    const user = await this.userModel.findById(id).select("-password").exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async update(id: ObjectIdType, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select("-password")
      .exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async remove(id: ObjectIdType): Promise<User> {
    const user = await this.userModel
      .findByIdAndDelete(id)
      .select("-password")
      .exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async changePassword(
    id: ObjectIdType,
    changePasswordDto: ChangePasswordDto
  ): Promise<void> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10
    );

    // Update password
    await this.userModel
      .findByIdAndUpdate(id, { password: hashedNewPassword })
      .exec();
  }

  async login(
    loginDto: LoginDto
  ): Promise<{ user: User; accessToken: string }> {
    const user = await this.userModel.findOne({ email: loginDto.email }).exec();
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Account is not active");
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Update last login
    await this.userModel
      .findByIdAndUpdate(user._id, { lastLoginAt: new Date() })
      .exec();

    // Generate JWT token
    const payload = { sub: user._id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Return user without password
    const userWithoutPassword = await this.userModel
      .findById(user._id)
      .select("-password")
      .exec();

    return {
      user: userWithoutPassword,
      accessToken,
    };
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return this.userModel.find({ role }).select("-password").exec();
  }

  async updateUserStatus(id: ObjectIdType, status: UserStatus): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .select("-password")
      .exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }
}
