/* eslint-disable */
import { Controller, Post, Body, Logger, Get, Put, Delete, UseGuards, Req, Param, Query } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto, GetAllDto, UpdateBrandDto } from './dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RoleGuard } from '../jwt/role.guard';


// @UseGuards(JwtAuthGuard)
@Controller('brand')
export class BrandsController {
  private readonly logger = new Logger(BrandsController.name);
  constructor(private readonly brandsService: BrandsService) { }

  @Get('get-all')
  getAll(@Query() getAllBrandDto: GetAllDto) {
    this.logger.log('Fetching all brands...');
    return this.brandsService.getAll(getAllBrandDto);
  }

  @Get('get-all-brand')
  getAllBrand() {
    this.logger.log('Fetching all brands...');
    return this.brandsService.getAllBrands();
  }

  @Get('get-brand/:id')
  getById(@Param('id') id: string) {
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Fetching brand with ID ${id}...`);
    return this.brandsService.getBrand(id);
  }

  @Post('create-brand')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  async create(@Body() createBrandDto: CreateBrandDto, @Req() request) {
    this.logger.log('Creating brand... by ', request.user.username);
    return this.brandsService.createBrands(createBrandDto);
  }

  @Put('update-brand/:id')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  update(@Param('id') id: string, @Body() UpdateBrandDto: UpdateBrandDto) {
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Updating brand with ID ${id}...`);
    UpdateBrandDto.id = id;
    // return { message: `Update category with ID ${id}`, data: updateCategoryDto };
    return this.brandsService.updateBrand(UpdateBrandDto);
  }

  @Delete('delete-brand/:id')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  delete(@Param('id') id: string) {
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Deleting brand with ID ${id}...`);
    return this.brandsService.deleteBrand(id);
  }
}
