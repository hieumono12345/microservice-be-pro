/* eslint-disable */
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { OrderService } from './orders.service';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern('order.create')
  async handleCreate(data: any) {
    return this.orderService.createOrder(data);
  }

  @MessagePattern('order.getAll')
  async handleGetAll() {
    return this.orderService.getAllOrders();
  }

  @MessagePattern('order.getAllByUserId')
  async handleGetAllByUserId(data: any) {
    return this.orderService.getAllOrdersByUserId(data);
  }

  @MessagePattern('order.getById')
  async handleGetById(data: any) {
    return this.orderService.getOrderById(data); 
  }

  @MessagePattern('order.updateStatusAdmin')
  async handleUpdateStatusAdmin(data: any) {
    return this.orderService.updateStatusAdmin(data);
  }

  @MessagePattern('order.updateStatusUser')
  async handleUpdateStatusUser(data: any) {
    return this.orderService.updateStatusUser(data);
  }
}
