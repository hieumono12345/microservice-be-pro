import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/entities/user.entity';
import { UserSession } from './auth/entities/user-session.entity';
import { EmailOtpCode } from './auth/entities/email-otp-code.entity';
import * as fs from 'fs';
import * as path from 'path';
import { RevokedToken } from './auth/entities/revoked-token.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const certsPath = path.join(__dirname, '..', '..', 'certs', 'mysql');
        return {
          type: 'mysql',
          // host: configService.get<string>('MYSQL_HOST', 'localhost'),
          // port: configService.get<number>('MYSQL_PORT', 3306),
          // username: configService.get<string>('MYSQL_USERNAME', 'auth_user'),
          // password: configService.get<string>('MYSQL_PASSWORD', 'auth_password'),
          // database: configService.get<string>('MYSQL_DATABASE', 'auth_db'),
          host: 'localhost',
          port: 3306,
          username: 'auth_user',
          password: 'auth_password',
          database: 'auth_db',
          // autoLoadEntities: true,
          entities: [User, UserSession, EmailOtpCode, RevokedToken],
          synchronize: configService.get<string>('NODE_ENV', 'development') === 'development',
          ssl: {
            ca: fs.readFileSync(path.join(certsPath, 'ca.crt')),
            cert: fs.readFileSync(path.join(certsPath, 'client.crt')),
            key: fs.readFileSync(path.join(certsPath, 'client.key')),
          },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
  ],
})
export class AppModule {}
