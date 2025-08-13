/* eslint-disable */
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProductService } from './product.service';

@Controller()
export class ProductController {
  constructor(private readonly productsService: ProductService) {}

  @MessagePattern('products.create')
  async handleCreate(encryptData: any) {
    Logger.debug('Received create product data:', encryptData);
    return this.productsService.create(encryptData);
  }

  @MessagePattern('products.update')
  async handleUpdate(encryptData: any) {
    Logger.debug('Received update product data:', encryptData);
    return this.productsService.update(encryptData);
  }

  @MessagePattern('products.delete')
  async handleDelete(encryptData: any) {
    Logger.debug('Received delete product data:', encryptData);
    return this.productsService.delete(encryptData);
  }

  @MessagePattern('products.getAll')
  async handleGetAll() {
    Logger.debug('Fetching all products');
    return this.productsService.getAll();
  }

  @MessagePattern('products.getById')
  async handleGetById(encryptData: any) {
    Logger.debug('Fetching product by id:', encryptData);
    return this.productsService.getById(encryptData);
  }

  @MessagePattern('products.getByCategory')
  async handleGetByCategory(encryptData: any) {
    Logger.debug('Fetching products by category:', encryptData);
    return this.productsService.getByCategory(encryptData);
  }
}