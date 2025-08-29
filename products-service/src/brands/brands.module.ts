/* eslint-disable */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VaultModule } from 'src/vault/vault.module';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { EncryptModule } from 'src/encrypt/encrypt.module'; // Assuming EncryptModule is defined and imported correctly
import { Brand } from 'src/product/entities/brand.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brand]),
    VaultModule,
    EncryptModule, // Assuming EncryptModule is defined and imported correctly
  ],
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule { }
