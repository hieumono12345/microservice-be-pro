import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { OrderModule } from './orders/orders.module';
import { BrandsModule } from './brands/brands.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    ProductModule,
    CategoriesModule,
    OrderModule,
    BrandsModule,
  ],
})
export class AppModule { }
