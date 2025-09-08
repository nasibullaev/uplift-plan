import { Injectable } from "@nestjs/common";
import { UserService } from "../users/user.service";
import { CreateUserDto, LoginDto } from "../users/dto/user.dto";

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async register(createUserDto: CreateUserDto) {
    // Create the user
    const user = await this.userService.create(createUserDto);

    // Automatically login the user after registration
    const loginResult = await this.userService.login({
      email: createUserDto.email,
      password: createUserDto.password,
    });

    return loginResult;
  }

  async login(loginDto: LoginDto) {
    return this.userService.login(loginDto);
  }
}
