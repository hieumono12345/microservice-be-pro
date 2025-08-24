/* eslint-disable */
import { Module } from '@nestjs/common';
import { OrderController } from './orders.controller';
import { OrderService } from './orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { VaultModule } from 'src/vault/vault.module';
import { EncryptModule } from 'src/encrypt/encrypt.module';
import { Product } from './entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderStatusHistory, Product]),
    VaultModule,
    EncryptModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule { }
