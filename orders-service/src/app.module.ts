/* eslint-disable */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { ProductModule } from './product/product.module';
// import { CategoriesModule } from './categories/categories.module'; // Assuming CategoryModule is defined and imported correctly
// import { Product } from './product/entities/products.entity';
// import { Category } from './product/entities/category.entity';
import { OrderModule } from './orders/orders.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
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
          host: 'localhost',
          port: 3306,
          username: 'offline_user',
          password: 'offline_password',
          database: 'offline_db',
          entities: [Order, OrderItem],
          autoLoadEntities: true,
          synchronize: false,
          ssl: {
            ca: fs.readFileSync(path.join(certsPath, 'ca.crt')),
            cert: fs.readFileSync(path.join(certsPath, 'client.crt')),
            key: fs.readFileSync(path.join(certsPath, 'client.key')),
          },
        };
      },
      inject: [ConfigService],
    }),
    OrderModule,
  ],
})
export class AppModule { }