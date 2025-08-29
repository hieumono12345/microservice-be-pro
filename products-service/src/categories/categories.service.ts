import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../product/entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto, DeleteCategoryDto, GetAllDto } from './dto';
import { EncryptService } from 'src/encrypt/encrypt.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    private readonly encryptService: EncryptService,
  ) { }

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
      });

      // Lưu vào database
      const savedCategory = await this.categoriesRepository.save(category);

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Category created successfully',
        data: {
          id: savedCategory.id,
          name: savedCategory.name,
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

      // Kiểm tra DTO (class-validator sẽ tự động validate, nhưng thêm kiểm tra dự phòng)
      if (!dto.id || !dto.name) {
        throw new BadRequestException('Category id and name are required');
      }

      // Tìm danh mục theo id
      const category = await this.categoriesRepository.findOne({ where: { id: dto.id } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // Cập nhật thông tin danh mục
      category.name = dto.name;

      // Lưu vào database
      const updatedCategory = await this.categoriesRepository.save(category);

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Category updated successfully',
        data: {
          id: updatedCategory.id,
          name: updatedCategory.name,
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

      // Kiểm tra DTO (class-validator sẽ tự động validate, nhưng thêm kiểm tra dự phòng)
      if (!dto.id) {
        throw new BadRequestException('Category id is required');
      }

      // Tìm danh mục theo id
      const category = await this.categoriesRepository.findOne({ where: { id: dto.id } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // Xóa danh mục
      await this.categoriesRepository.remove(category);

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Category deleted successfully',
      });

    } catch (error) {
      throw new BadRequestException(`Failed to delete category: ${error.message}`);
    }
  }

  async getAll(encryptData: any): Promise<any> {
    try {
      const dto: GetAllDto = await this.encryptService.Decrypt(encryptData);

      // Kiểm tra DTO
      if (!dto) {
        throw new BadRequestException('Invalid data');
      }

      // Lấy danh sách danh mục với phân trang và lọc
      const [categories, total] = await this.categoriesRepository.findAndCount({
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
        where: {
          // name: Like(`%${dto.filterName}%`),
        },
        order: {
          createdAt: dto.sortBy === 'asc' ? 'ASC' : 'DESC',
        },
      });

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Categories retrieved successfully',
        data: categories,
      });

    } catch (error) {
      throw new BadRequestException(`Failed to retrieve categories: ${error.message}`);
    }
  }

  async getAllCategory(): Promise<any> {
    try {
      const categories = await this.categoriesRepository.find();

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Categories retrieved successfully',
        data: categories,
      });

    } catch (error) {
      throw new BadRequestException(`Failed to retrieve categories: ${error.message}`);
    }
  }

  async getCategory(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu
      const dto: DeleteCategoryDto = await this.encryptService.Decrypt(encryptData);

      // Kiểm tra DTO (class-validator sẽ tự động validate, nhưng thêm kiểm tra dự phòng)
      if (!dto.id) {
        throw new BadRequestException('Category id is required');
      }

      // Tìm danh mục theo id
      const category = await this.categoriesRepository.findOne({ where: { id: dto.id } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Category retrieved successfully',
        data: category,
      });

    } catch (error) {
      throw new BadRequestException(`Failed to retrieve category: ${error.message}`);
    }
  }

}
