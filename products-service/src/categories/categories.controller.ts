/* eslint-disable */
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto';
import { UpdateCategoryDto } from './dto';

@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @MessagePattern('categories.create')
  async handleCreate(encryptData: any) {
    Logger.debug('Received data:', encryptData);
    return this.categoriesService.create(encryptData);
  }

  @MessagePattern('categories.update')
  async handleUpdate(encryptData: any) {
    Logger.debug('Received update data:', encryptData);
    return this.categoriesService.update(encryptData);
  }

  @MessagePattern('categories.delete')
  async handleDelete(encryptData: any) {
    Logger.debug('Received delete data:', encryptData);
    return this.categoriesService.delete(encryptData);
  }

  @MessagePattern('categories.getAll')
  async handleGetAll() {
    Logger.debug('Fetching all categories');
    return this.categoriesService.getAll();
  }

  @MessagePattern('categories.getById')
  async handleGetById(encryptData: any) {
    Logger.debug('Fetching category by id:', encryptData);
    return this.categoriesService.getById(encryptData);
  }
}
