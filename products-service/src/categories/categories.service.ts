/* eslint-disable */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../product/entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto, DeleteCategoryDto } from './dto';
import { EncryptService } from 'src/encrypt/encrypt.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    private readonly encryptService: EncryptService,
  ) {}

  async create(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu
      const dto: CreateCategoryDto = await this.encryptService.Decrypt(encryptData);

      // Kiểm tra DTO (class-validator sẽ tự động validate, nhưng thêm kiểm tra dự phòng)
      if (!dto.name) {
        throw new BadRequestException('Category name is required');
      }

      // Kiểm tra xem danh mục đã tồn tại chưa
      const existingCategory = await this.categoriesRepository.findOne({
        where: { name: dto.name },
      });
      if (existingCategory) {
        throw new BadRequestException('Category with this name already exists');
      }

      // Tạo mới danh mục
      const category = this.categoriesRepository.create({
        name: dto.name,
        description: dto.description,
      });

      // Lưu vào database
      const savedCategory = await this.categoriesRepository.save(category);

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Category created successfully',
        data: {
          id: savedCategory.id,
          name: savedCategory.name,
          description: savedCategory.description,
          createdAt: savedCategory.createdAt,
          updatedAt: savedCategory.updatedAt,
        },
      });
      
    } catch (error) {
      throw new BadRequestException(`Failed to create category: ${error.message}`);
    }
  }

  async update(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu
      const dto: UpdateCategoryDto = await this.encryptService.Decrypt(encryptData);

      // Kiểm tra DTO
      if (!dto.id || !dto.name) {
        throw new BadRequestException('Category ID and name are required');
      }

      // Tìm danh mục theo ID
      const category = await this.categoriesRepository.findOne({
        where: { id: dto.id },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${dto.id} not found`);
      }

      // Kiểm tra tên danh mục nếu thay đổi
      if (dto.name !== category.name) {
        const existingCategory = await this.categoriesRepository.findOne({
          where: { name: dto.name },
        });
        if (existingCategory) {
          throw new BadRequestException('Category with this name already exists');
        }
      }

      // Cập nhật thông tin danh mục
      const updatedCategory = await this.categoriesRepository.save({
        ...category,
        name: dto.name,
        description: dto.description || category.description,
      });

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Category updated successfully',
        data: {
          id: updatedCategory.id,
          name: updatedCategory.name,
          description: updatedCategory.description,
          createdAt: updatedCategory.createdAt,
          updatedAt: updatedCategory.updatedAt,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to update category: ${error.message}`);
    }
  }

  async delete(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu
      const dto: DeleteCategoryDto = await this.encryptService.Decrypt(encryptData);

      // Kiểm tra DTO
      if (!dto.id) {
        throw new BadRequestException('Category ID is required');
      }

      // Tìm danh mục theo ID, bao gồm quan hệ products
      const category = await this.categoriesRepository.findOne({
        where: { id: dto.id },
        relations: ['products'],
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${dto.id} not found`);
      }

      // Kiểm tra xem danh mục có sản phẩm liên quan không
      if (category.products && category.products.length > 0) {
        throw new BadRequestException(
          'Cannot delete category with associated products',
        );
      }

      // Xóa danh mục
      await this.categoriesRepository.delete(dto.id);

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Category deleted successfully',
        id: dto.id,
      });
    } catch (error) {
      throw new BadRequestException(`Failed to delete category: ${error.message}`);
    }
  }

  async getAll(): Promise<any> {
    try {
      // Lấy tất cả danh mục
      const categories = await this.categoriesRepository.find({
        order: { createdAt: 'DESC' },
        select: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
      });

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Fetched all categories successfully',
        data: categories.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        })),
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch categories: ${error.message}`);
    }
  }

  async getById(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu
      const dto: DeleteCategoryDto = await this.encryptService.Decrypt(encryptData);

      // Kiểm tra DTO
      if (!dto.id) {
        throw new BadRequestException('Category ID is required');
      }

      // Tìm danh mục theo ID
      const category = await this.categoriesRepository.findOne({
        where: { id: dto.id },
        select: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${dto.id} not found`);
      }

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Fetched category successfully',
        data: {
          id: category.id,
          name: category.name,
          description: category.description,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch category: ${error.message}`);
    }
  }

}

