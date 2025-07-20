/* eslint-disable */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EmailOtpCode } from './entities/email-otp-code.entity';
import { VaultModule } from 'src/vault/vault.module';
import { EmailOtpService } from './email-otp.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { UserSession } from './entities/user-session.entity';
import { RevokedToken } from './entities/revoked-token.entity';

@Module({
  imports: [
    ConfigModule,

    TypeOrmModule.forFeature([User, EmailOtpCode, UserSession, RevokedToken]),
    VaultModule,

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: 'hieuscrt@gmail.com',
            pass: 'zvbt yxsq nkhx hoha',
          },
        },
        defaults: {
          from: 'hieuscrt@gmail.com',
        },
        template: {
          dir: join(__dirname, '../../src/templates/'), // phải chứa file verify.hbs ở đây
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtService, EmailOtpService],
})
export class AuthModule {}
