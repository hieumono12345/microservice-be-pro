/* eslint-disable */
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProductService } from './product.service';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern('product.create')
  async handleCreate(data: any) {
    Logger.debug('Received data:', data);
    return this.productService.create(data);
  }
}
