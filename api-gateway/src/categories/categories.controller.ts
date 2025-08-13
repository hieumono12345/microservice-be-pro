/* eslint-disable */
import { Controller, Post, Body, Logger, Get, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RoleGuard } from '../jwt/role.guard';


@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(new RoleGuard('admin'))
  async create(@Body() createCategoryDto: CreateCategoryDto, @Req() request) {
    this.logger.log('Creating category... by ', request.user.username);
    return this.categoriesService.createCategories(createCategoryDto);
  }

  @Get()
  getAll() {
    this.logger.log('Fetching all categories...');
    // Simulate fetching all categories
    return this.categoriesService.getAllCategories();
  }

  @Get(':id')
  getById(@Body('id') id: string) {    
    if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Fetching category with ID ${id}...`);
    return this.categoriesService.getCategoryById(id);
  }

  @Put(':id')
  update(@Body('id') id: string, @Body() updateCategoryDto: any) {
     if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Updating category with ID ${id}...`);
    // return { message: `Update category with ID ${id}`, data: updateCategoryDto };
    return this.categoriesService.updateCategory(id, updateCategoryDto);
  }

  @Delete(':id')
  delete(@Body('id') id: string) {
     if (id == undefined || id == "") {
      this.logger.error(`ID undefined`);
      return { message: `ID undefined` };
    }
    this.logger.log(`Deleting category with ID ${id}...`);
    return this.categoriesService.deleteCategory(id);
  }
}
