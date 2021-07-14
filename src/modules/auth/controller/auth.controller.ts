import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { User } from '../../user/schema/user.schema';
import { UserService } from '../../user/service/user.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthService } from '../service/auth.service';
import { JwtAuthGuard, Token } from '../guard/jwt-auth.guard';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validate(body.username, body.password);

    return this.authService.login(user);
  }

  @Post('refresh-token')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    try {
      const decoded = this.jwtService.decode(refreshToken) as Token;

      if (!decoded) {
        throw new Error();
      }

      const user = await this.userService.validateUser(decoded.sub);

      await this.jwtService.verifyAsync<Token>(
        refreshToken,
        this.authService.getRefreshTokenOptions(user),
      );

      return this.authService.login(user);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    if (await this.userService.getUserByName(body.username)) {
      throw new BadRequestException('Username already exists');
    }

    if (await this.userService.getUserByEmail(body.email)) {
      throw new BadRequestException('Email already exists');
    }

    const user = await this.userService.create(body);

    return this.authService.login(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return this.userService.filterUser(user);
  }
}
