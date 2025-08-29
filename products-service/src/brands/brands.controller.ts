/* eslint-disable */
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { BrandsService } from './brands.service';

@Controller()
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) { }

  @MessagePattern('brand.create')
  async handleCreate(encryptData: any) {
    Logger.debug('Received data:', encryptData);
    return this.brandsService.create(encryptData);
  }

  @MessagePattern('brand.update')
  async handleUpdate(encryptData: any) {
    Logger.debug('Received update data:', encryptData);
    return this.brandsService.update(encryptData);
  }

  @MessagePattern('brand.delete')
  async handleDelete(encryptData: any) {
    Logger.debug('Received delete data:', encryptData);
    return this.brandsService.delete(encryptData);
  }

  @MessagePattern('brand.getAll')
  async handleGetAll(encryptData: any) {
    Logger.debug('Fetching all brands');
    return this.brandsService.getAll(encryptData);
  }

  @MessagePattern('brand.getAllBrands')
  async handleGetAllBrand() {
    Logger.debug('Fetching all brands');
    return this.brandsService.getAllBrand();
  }

  @MessagePattern('brand.getBrand')
  async handleGetById(encryptData: any) {
    Logger.debug('Fetching brand by id:', encryptData);
    return this.brandsService.getBrand(encryptData);
  }
}
