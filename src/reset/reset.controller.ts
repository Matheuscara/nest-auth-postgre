import {
  Controller,
  Post,
  Body,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { UserService } from 'src/user/services/user.service';
import * as bcrypt from 'bcrypt';
import { ResetService } from './services/reset.service';

@Controller()
export class ResetController {
  constructor(
    private readonly resetService: ResetService,
    private readonly mailerService: MailerService,
    private readonly userService: UserService,
  ) {}

  @Post('forgot')
  async forgot(@Body('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');

    const token = Math.random().toString(20).substring(2, 12);

    const user = await this.userService.findOne({
      where: {
        email: email,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.resetService.save({
      email: email,
      token: token,
      expired: false,
    });

    const url = 'http://localhost:3000/reset/' + token;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset your password',
      html: `<h1>Reset your password</h1><p>Click <a href="${url}">here</a> to reset your password</p>`,
    });

    return {
      message: 'Email sent, check your inbox',
    };
  }

  @Post('reset')
  async reset(
    @Body('token') token: string,
    @Body('password') password: string,
    @Body('password_confirm') password_confirm: string,
  ) {
    if (!token || !password || !password_confirm) {
      throw new BadRequestException('Token and password are required');
    }

    if (password !== password_confirm) {
      throw new BadRequestException('Password do not match!');
    }

    const reset = await this.resetService.findOne({
      where: {
        token: token,
      },
    });

    if (!reset) {
      throw new BadRequestException('Invalid token');
    }

    if (reset.expired) throw new BadRequestException('Token expired');

    await this.resetService.expireToken(reset.id, { expired: true });

    const user = await this.userService.findOne({
      where: {
        email: reset.email,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userService.update(user.id, {
      password: await bcrypt.hash(password, 12),
    });

    return {
      message: 'Password reset successful',
    };
  }
}
