/* eslint-disable */
import { Controller, Post, Body, Logger, Get, Put, Delete, UseGuards, Query, Param, Req } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto, DeleteProductDto, GetAllDto, UpdateProductReqDto } from './dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RoleGuard } from '../jwt/role.guard';


@Controller('product')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);
  constructor(private readonly productsService: ProductService) { }

  @Get('get-all-product')
  getAll(@Query() getAllProductDto: GetAllDto) {
    this.logger.log('Fetching all products...');
    return this.productsService.getAll(getAllProductDto);
  }
  
  @Get('get-all')
  getAllProduct() {
    this.logger.log('Fetching all products...');
    return this.productsService.getAllProducts();
  }

  @Get('get-product/:id')
  getById(@Param('id') id: string) {
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Fetching product with ID ${id}...`);
    return this.productsService.getProduct(id);
  }

  @Post('create-product')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  async create(@Body() createProductDto: CreateProductDto, @Req() request) {
    this.logger.log('Creating product... by ', request.user.username);
    this.logger.debug('CreateProductDto:', createProductDto);
    return this.productsService.createProducts(createProductDto);
  }

  @Put('update-product/:id')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  update(@Param('id') id: string, @Body() UpdateProductDto: UpdateProductReqDto) {
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Updating product with ID ${id}...`);
    UpdateProductDto.id = id;
    // return { message: `Update category with ID ${id}`, data: updateProductDto };
    return this.productsService.updateProduct(UpdateProductDto);
  }

  @Delete('delete-product/:id')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  delete(@Param('id') id: string) {
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Deleting product with ID ${id}...`);
    return this.productsService.deleteProduct(id);
  }
}
