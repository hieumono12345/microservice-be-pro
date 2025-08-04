/* eslint-disable */
import { Controller, Post, Body, Logger, Get, Put, Delete } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto';

@Controller('categories')
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    this.logger.log('Creating category...');
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
    this.logger.log(`Fetching category with ID ${id}...`);
    // Simulate fetching category by ID
    // return { message: `Category with ID ${id}` };
    return this.categoriesService.getCategoryById(id);
  }

  @Put(':id')
  update(@Body('id') id: string, @Body() updateCategoryDto: any) {
    this.logger.log(`Updating category with ID ${id}...`);
    // return { message: `Update category with ID ${id}`, data: updateCategoryDto };
    return this.categoriesService.updateCategory(id, updateCategoryDto);
  }

  @Delete(':id')
  delete(@Body('id') id: string) {
    this.logger.log(`Deleting category with ID ${id}...`);
    // Simulate deleting category by ID
    // return { message: `Category with ID ${id} deleted` };
    return this.categoriesService.deleteCategory(id);
  }
}
