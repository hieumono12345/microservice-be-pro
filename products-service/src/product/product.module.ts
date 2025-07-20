/* eslint-disable */
import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/products.entity';
import { VaultModule } from 'src/vault/vault.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    VaultModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}

