/* eslint-disable */
import { Controller, Post, Body, Logger, Get, Put, Delete, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto, DeleteProductDto } from './dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RoleGuard } from '../jwt/role.guard';
import { RolesGuard } from '../jwt/roles.guard';

// @UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);
  constructor(private readonly productService: ProductService) {}

  // thiếu DTO
  @Post()
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  create(@Body() createProduct: CreateProductDto) {
    return this.productService.createProduct(createProduct);
  }

  // Get all products
  @Get()
  getAll() {
    return this.productService.getAllProducts();
  }

  // Get product by ID
  @Get(':id')
  getById(@Body('id') id: string) {
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Fetching product with ID ${id}...`);
    return this.productService.getProductById(id);
  }

  // Update product by ID
  @Put(':id')
  @UseGuards(JwtAuthGuard, new RolesGuard(['admin']))
  update(@Body('id') id: string, @Body() updateProduct: UpdateProductDto) {
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Updating product with ID ${id}...`);
    return this.productService.updateProduct(updateProduct);
  }

  // Delete product by ID
  @Delete(':id')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  delete(@Body('id') id: DeleteProductDto) {
    this.logger.log(`Deleting product with ID ${id}...`);
    return this.productService.deleteProduct(id);
  }

  // Get products by category
  @Get('category/:categoryId')
  getByCategory(@Body('categoryId') categoryId: string) {
    if (categoryId == undefined || categoryId == "") {
      this.logger.error(`Category ID undefined`);
      return { message: `Category ID undefined` };
    }
    this.logger.log(`Fetching products for category ID ${categoryId}...`);
    return this.productService.getProductsByCategory(categoryId);
  }
}
