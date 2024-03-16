import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entitys/user.entity';
import { UserController } from './user.controller';
import { UserService } from './services/user.service';
import { JwtModule } from '@nestjs/jwt';
import { Token } from './entitys/token.entity';
import { TokenService } from './services/token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Token]),
    JwtModule.register({
      secret: 'secret',
      signOptions: { expiresIn: '1w' },
    }),
  ],
  controllers: [UserController],
  providers: [UserService, TokenService],
  exports: [UserService],
})
export class UserModule {}
