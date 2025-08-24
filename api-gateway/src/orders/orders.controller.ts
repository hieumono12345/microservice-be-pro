/* eslint-disable */
import { Controller, Post, Body, Logger, Get, Put, Delete, Query, Param, Patch, UseGuards, Req, NotFoundException, ForbiddenException } from '@nestjs/common';
import { OrderService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, CreateOrderDtoRequest } from './dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RoleGuard } from '../jwt/role.guard';
import { RolesGuard } from '../jwt/roles.guard';
import { OrderStatus } from '../enums/order-status.enum';
@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly ordersService: OrderService) { }

  @Post()
  @UseGuards(JwtAuthGuard, new RoleGuard('user'))
  async create(@Body() dto: CreateOrderDtoRequest, @Req() req) {
    return this.ordersService.createOrder(dto, req.user.userId);
    return 'oke';
  }

  @Get()
  @UseGuards(JwtAuthGuard, new RolesGuard(['admin']))
  async getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, new RolesGuard(['user']))
  async getAllOrdersByUser(@Req() req) {
    return this.ordersService.getAllOrdersByUserId(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, new RolesGuard(['user']))
  async getOrderDetail(@Param('id') id: string, @Req() req) {
    const order = await this.ordersService.getOrderById(id, req.user.userId);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  // --- ADMIN UPDATE ---
  @Patch(':id/admin-status')
  @UseGuards(JwtAuthGuard, new RolesGuard(['admin']))
  async updateStatusAdmin(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.ordersService.updateStatusAdmin(id, status);
  }

  // --- USER UPDATE ---
  @Patch(':id/user-status')
  @UseGuards(JwtAuthGuard, new RolesGuard(['user']))
  async updateStatusUser(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Req() req,
  ) {
    return this.ordersService.updateStatusUser(id, req.user.userId, status);
  }
}
