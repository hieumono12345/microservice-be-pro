/* eslint-disable */
import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() data: any) {
    return this.productService.createProduct(data);
  }
}
