/* eslint-disable */
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { OrderService } from './orders.service';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern('order.create')
  async handleCreate(data: any) {
    Logger.debug('Received data:', data);
    return this.orderService.create(data);
  }
}
