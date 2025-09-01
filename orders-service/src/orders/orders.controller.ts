/* eslint-disable */
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { OrderService } from './orders.service';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @MessagePattern('order.create')
  async handleCreate(encryptData: any) {
    Logger.debug('Received data:', encryptData);
    return this.orderService.createOrder(encryptData);
  }

  @MessagePattern('order.getAllOrders')
  async handleGetAllOrders() {
    Logger.debug('Fetching all orders...');
    return this.orderService.getAllOrders();
  }
  @MessagePattern('order.getOrder')
  async handleGetOrder(encryptData: any) {
    Logger.debug('Fetching order by id:', encryptData);
    return this.orderService.getOrder(encryptData);
  }

  @MessagePattern('order.getAllOrderByUser')
  async handleGetAllOrderByUser(encryptData: any) {
    Logger.debug('Fetching all orders by user id:', encryptData);
    return this.orderService.getAllOrdersByUserId(encryptData);
  }

  @MessagePattern('order.update')
  async handleUpdate(encryptData: any) {
    Logger.debug('Received update data:', encryptData);
    return this.orderService.updateOrder(encryptData);
  }

  @MessagePattern('order.cancel')
  async handleCancel(encryptData: any) {
    Logger.debug('Received cancel data:', encryptData);
    return this.orderService.cancelOrder(encryptData);
  }

  @MessagePattern('order.delete')
  async handleDelete(encryptData: any) {
    Logger.debug('Received delete data:', encryptData);
    return this.orderService.deleteOrder(encryptData);
  }
}
