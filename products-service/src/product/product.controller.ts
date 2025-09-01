/* eslint-disable */
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProductService } from './product.service';

@Controller()
export class ProductController {
  constructor(private readonly productsService: ProductService) { }

  @MessagePattern('product.create')
  async handleCreate(encryptData: any) {
    Logger.debug('Received data:', encryptData);
    return this.productsService.create(encryptData);
  }

  @MessagePattern('product.update')
  async handleUpdate(encryptData: any) {
    Logger.debug('Received update data:', encryptData);
    return this.productsService.update(encryptData);
  }

  @MessagePattern('product.delete')
  async handleDelete(encryptData: any) {
    Logger.debug('Received delete data:', encryptData);
    return this.productsService.delete(encryptData);
  }

  @MessagePattern('product.getAll')
  async handleGetAll(encryptData: any) {
    Logger.debug('Fetching all products');
    return this.productsService.getAll(encryptData);
  }

  @MessagePattern('product.getAllProducts')
  async handleGetAllProduct() {
    Logger.debug('Fetching all products');
    return this.productsService.getAllProduct();
  }

  @MessagePattern('product.getProduct')
  async handleGetById(encryptData: any) {
    Logger.debug('Fetching product by id:', encryptData);
    return this.productsService.getProduct(encryptData);
  }
}