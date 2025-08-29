/* eslint-disable */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/product/entities/category.entity';
import { VaultModule } from 'src/vault/vault.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { EncryptModule } from 'src/encrypt/encrypt.module'; // Assuming EncryptModule is defined and imported correctly

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    VaultModule,
    EncryptModule, // Assuming EncryptModule is defined and imported correctly
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule { }
