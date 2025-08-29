/* eslint-disable */
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CategoriesService } from './categories.service';

@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @MessagePattern('category.create')
  async handleCreate(encryptData: any) {
    Logger.debug('Received data:', encryptData);
    return this.categoriesService.create(encryptData);
  }

  @MessagePattern('category.update')
  async handleUpdate(encryptData: any) {
    Logger.debug('Received update data:', encryptData);
    return this.categoriesService.update(encryptData);
  }

  @MessagePattern('category.delete')
  async handleDelete(encryptData: any) {
    Logger.debug('Received delete data:', encryptData);
    return this.categoriesService.delete(encryptData);
  }

  @MessagePattern('category.getAll')
  async handleGetAll(encryptData: any) {
    Logger.debug('Fetching all categories');
    return this.categoriesService.getAll(encryptData);
  }

  @MessagePattern('category.getAllCategories')
  async handleGetAllCategories() {
    Logger.debug('Fetching all categories');
    return this.categoriesService.getAllCategory();
  }

  @MessagePattern('category.getCategory')
  async handleGetById(encryptData: any) {
    Logger.debug('Fetching category by id:', encryptData);
    return this.categoriesService.getCategory(encryptData);
  }
}
