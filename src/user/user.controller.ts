import {
  Body,
  Controller,
  Post,
  BadRequestException,
  Res,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './services/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { Request } from 'express';
import { TokenService } from './services/token.service';
import { MoreThanOrEqual } from 'typeorm';

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private tokenService: TokenService,
  ) {}

  @Get()
  async user(@Req() request: Request) {
    try {
      const accessToken = request.headers['authorization'].split(' ')[1];

      const { id } = await this.jwtService.verifyAsync(accessToken);

      const { password, ...result } = await this.userService.findOne({
        where: { id: id },
      });

      return result;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('register')
  async register(@Body() body: any) {
    if (body.password !== body.password_confirmation) {
      throw new BadRequestException('Password do not match!');
    }

    if (!body.first_name || !body.last_name || !body.email || !body.password) {
      throw new BadRequestException('Missing required parameters!');
    }

    let newUser = {
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      password: body.password,
    };

    newUser.password = await bcrypt.hash(newUser.password, 12);

    return this.userService.save(newUser);
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.userService.findOne({ where: { email: email } });

    if (!email || !(await bcrypt.compare(password, user.password)))
      throw new BadRequestException('Invalid Credentials');

    const accessToken = await this.jwtService.signAsync(
      { id: user.id },
      {
        expiresIn: '30s',
      },
    );

    const refreshToken = await this.jwtService.signAsync({ id: user.id });

    const expired_at: Date = new Date();
    expired_at.setDate(expired_at.getDate() + 7);

    await this.tokenService.save({
      user_id: user.id,
      token: refreshToken,
      expired_at: expired_at,
    });

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    });

    response.status(200);
    return { token: accessToken };
  }

  @Post('refresh')
  async refresh(
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    try {
      const refreshToken = request.cookies['refresh_token'];

      const { id } = await this.jwtService.verifyAsync(refreshToken);

      const tokenEntity = await this.tokenService.findOne({
        where: { user_id: id, expired_at: MoreThanOrEqual(new Date()) },
      });

      if (!tokenEntity) {
        throw new UnauthorizedException('Invalid token');
      }

      const accessToken = await this.jwtService.signAsync(
        { id },
        {
          expiresIn: '30s',
        },
      );

      response.status(200);
      return {
        token: accessToken,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('logout')
  async logout(
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    try {
      const refreshToken = request.cookies['refresh_token'];

      await this.tokenService.delete({ token: refreshToken });

      response.clearCookie('refresh_token');
      response.status(200);
      return { message: 'Success' };
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
