/* eslint-disable */
import { Controller, Post, Body, Logger, Get, Put, Delete, Query, Param, Patch, UseGuards, Req, NotFoundException, ForbiddenException } from '@nestjs/common';
import { OrderService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto, UpdateOrderReqDto, CreateOrderReqDto } from './dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RoleGuard } from '../jwt/role.guard';
import { RolesGuard } from '../jwt/roles.guard';

@Controller('order')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly ordersService: OrderService) { }

  @UseGuards(JwtAuthGuard, new RolesGuard(['admin']))
  @Get('get-all')
  getAll(@Req() request) {
    this.logger.log(`Fetching all orders...`);
    return this.ordersService.getAllOrders();
  }

  @Get('get-order/:id')
  @UseGuards(JwtAuthGuard, new RolesGuard(['admin', 'user']))
  getById(@Param('id') id: string, @Req() request) {
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Fetching order with ID ${id}...`);
    return this.ordersService.getOrder(id);
  }

  @Get('get-order-user/:id')
  @UseGuards(JwtAuthGuard, new RolesGuard(['admin', 'user']))
  getOrderByUser(@Param('id') id: string, @Req() request) {
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Fetching order with ID ${id}...`);
    return this.ordersService.getAllOrderByUser(request.user.userId);
  }

  @Post('create-order')
  @UseGuards(JwtAuthGuard, new RolesGuard(['admin', 'user']))
  async create(@Body() createOrderDto: CreateOrderReqDto, @Req() request) {
    this.logger.log('Creating order... by ', request.user.username);
    createOrderDto.user = request.user.userId;
    // ép kiểu sang CreateOrderDto

    return this.ordersService.createOrders(createOrderDto);
  }

  @Put('update-order/:id')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  update(@Param('id') id: string) {
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Updating order with ID ${id}...`);
    // return { message: `Update category with ID ${id}`, data: updateCategoryDto };
    return this.ordersService.updateOrder(id);
  }

  @Put('cancel-order/:id')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  cancel(@Param('id') id: string) {
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Updating order with ID ${id}...`);
    // return { message: `Update category with ID ${id}`, data: updateCategoryDto };
    return this.ordersService.cancelOrder(id);
  }

  @Delete('delete-order/:id')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  delete(@Param('id') id: string) {
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Deleting order with ID ${id}...`);
    return this.ordersService.deleteOrder(id);
  }
}
