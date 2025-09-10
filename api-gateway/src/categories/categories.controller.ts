/* eslint-disable */
import { Controller, Post, Body, Logger, Get, Put, Delete, UseGuards, Req, Param, Query } from '@nestjs/common';
import { CategoryService } from './categories.service';
import { CreateCategoryDto, GetAllDto, UpdateCategoryDto } from './dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RoleGuard } from '../jwt/role.guard';


// @UseGuards(JwtAuthGuard)
@Controller('category')
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);
  constructor(private readonly categoriesService: CategoryService) { }

  @Get('get-all-category')
  getAll(@Query() getAllCategoryDto: GetAllDto) {
    this.logger.log('Fetching all categories ...');
    // kiểm tra page, pageSize, sortBy, sortOrder
    return this.categoriesService.getAll(getAllCategoryDto);
  }

  @Get('get-all')
  getAllCategory() {
    this.logger.log('Fetching all categories...');
    return this.categoriesService.getAllCategory();
  }

  @Get('get-category/:id')
  getById(@Param('id') id: string) {
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Fetching category with ID ${id}...`);
    return this.categoriesService.getCategory(id);
  }

  @Post('create-category')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  async create(@Body() createCategoryDto: CreateCategoryDto, @Req() request) {
    this.logger.log('Creating category... by ', request.user.username);
    return this.categoriesService.createCategory(createCategoryDto);
  }

  @Put('update-category/:id')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  update(@Param('id') id: string, @Body() UpdateCategoryDto: any) {
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Updating category with ID ${id}...`);
    this.logger.log(`UpdateCategoryDto: ${JSON.stringify(UpdateCategoryDto)}`);
    // UpdateCategoryDto.id = id;
    return { message: `Update category with ID ${id}`, data: UpdateCategoryDto };
    // return this.categoriesService.updateCategory(UpdateCategoryDto);
  }

  @Delete('delete-category/:id')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  delete(@Param('id') id: string) {
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Deleting category with ID ${id}...`);
    return this.categoriesService.deleteCategory(id);
  }
}
