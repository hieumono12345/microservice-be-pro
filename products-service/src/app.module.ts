/* eslint-disable */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from './product/product.module';
import { Product } from './product/entities/products.entity';
import * as fs from 'fs';
import * as path from 'path';

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
          host: configService.get<string>('MYSQL_HOST', 'localhost'),
          port: configService.get<number>('MYSQL_PORT', 3306),
          username: configService.get<string>('MYSQL_USERNAME', 'offline_user'),
          password: configService.get<string>('MYSQL_PASSWORD', 'offline_password'),
          database: configService.get<string>('MYSQL_DATABASE', 'offline_db'),
          entities: [Product],
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
    ProductModule,
  ],
})
export class AppModule {}