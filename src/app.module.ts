import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist';
import { UserModule } from './user/user.module';
import { TokenService } from './user/services/token.service';
import { ResetModule } from './reset/reset.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'dias',
      password: 'dias',
      database: 'nest_auth',
      autoLoadEntities: true,
      synchronize: true,
    }),
    UserModule,
    ResetModule,
  ],
  controllers: [],
})
export class AppModule {}
