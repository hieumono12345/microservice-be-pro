/* eslint-disable */
import { Controller, Post, Body, Logger, Get, Put, Delete } from '@nestjs/common';
import { OrderService } from './orders.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // thiếu DTO
  @Post()
  create(@Body() data: any) {
    return this.orderService.createOrder(data);
  }

  // Get all products
  @Get()
  getAll() {
    // Giả lập lấy danh sách sản phẩm
    return { message: 'List of products' };
  }

  // Get product by ID
  @Get(':id')
  getById(@Body('id') id: string) {
    // Giả lập lấy sản phẩm theo ID
    return { message: `Product with ID ${id}` };
  }

  // Update product by ID
  @Put(':id')
  update(@Body('id') id: string, @Body() data: any) {
    return { message: `Update product with ID ${id}`, data };
  }

  // Delete product by ID
  @Delete(':id')
  delete(@Body('id') id: string) {
    // Giả lập xóa sản phẩm theo ID
    return { message: `Product with ID ${id} deleted` };
  }
}
