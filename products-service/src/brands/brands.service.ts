import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../product/entities/brand.entity';
import { CreateBrandDto, UpdateBrandDto, DeleteBrandDto, GetAllDto } from './dto';
import { EncryptService } from 'src/encrypt/encrypt.service';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandsRepository: Repository<Brand>,
    private readonly encryptService: EncryptService,
  ) { }

  async create(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu
      const dto: CreateBrandDto = await this.encryptService.Decrypt(encryptData);

      // Kiểm tra DTO (class-validator sẽ tự động validate, nhưng thêm kiểm tra dự phòng)
      if (!dto.name) {
        throw new BadRequestException('Brand name is required');
      }

      // Kiểm tra xem thương hiệu đã tồn tại chưa
      const existingBrand = await this.brandsRepository.findOne({
        where: { name: dto.name },
      });
      if (existingBrand) {
        throw new BadRequestException('Brand with this name already exists');
      }

      // Tạo mới thương hiệu
      const brand = this.brandsRepository.create({
        name: dto.name,
      });

      // Lưu vào database
      const savedBrand = await this.brandsRepository.save(brand);

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Brand created successfully',
        data: {
          id: savedBrand.id,
          name: savedBrand.name,
          createdAt: savedBrand.createdAt,
          updatedAt: savedBrand.updatedAt,
        },
      });

    } catch (error) {
      throw new BadRequestException(`Failed to create brand: ${error.message}`);
    }
  }

  async update(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu
      const dto: UpdateBrandDto = await this.encryptService.Decrypt(encryptData);

      // Kiểm tra DTO (class-validator sẽ tự động validate, nhưng thêm kiểm tra dự phòng)
      if (!dto.id || !dto.name) {
        throw new BadRequestException('Brand id and name are required');
      }

      // Tìm thương hiệu theo id
      const brand = await this.brandsRepository.findOne({ where: { id: dto.id } });
      if (!brand) {
        throw new NotFoundException('Brand not found');
      }

      // Cập nhật thông tin thương hiệu
      brand.name = dto.name;

      // Lưu vào database
      const updatedBrand = await this.brandsRepository.save(brand);

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Brand updated successfully',
        data: {
          id: updatedBrand.id,
          name: updatedBrand.name,
          updatedAt: updatedBrand.updatedAt,
        },
      });

    } catch (error) {
      throw new BadRequestException(`Failed to update brand: ${error.message}`);
    }
  }

  async delete(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu
      const dto: DeleteBrandDto = await this.encryptService.Decrypt(encryptData);

      // Kiểm tra DTO (class-validator sẽ tự động validate, nhưng thêm kiểm tra dự phòng)
      if (!dto.id) {
        throw new BadRequestException('Brand id is required');
      }

      // Tìm thương hiệu theo id
      const brand = await this.brandsRepository.findOne({ where: { id: dto.id } });
      if (!brand) {
        throw new NotFoundException('Brand not found');
      }

      // Xóa thương hiệu
      await this.brandsRepository.remove(brand);

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Brand deleted successfully',
      });

    } catch (error) {
      throw new BadRequestException(`Failed to delete brand: ${error.message}`);
    }
  }

  async getAll(encryptData: any): Promise<any> {
    try {
      const dto: GetAllDto = await this.encryptService.Decrypt(encryptData);

      // Kiểm tra DTO
      if (!dto) {
        throw new BadRequestException('Invalid data');
      }

      // Lấy danh sách thương hiệu với phân trang và lọc
      const [brands, total] = await this.brandsRepository.findAndCount({
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
        message: 'Brands retrieved successfully',
        data: brands,
      });

    } catch (error) {
      throw new BadRequestException(`Failed to retrieve brands: ${error.message}`);
    }
  }

  async getAllBrand(): Promise<any> {
    try {
      const brands = await this.brandsRepository.find();

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Brands retrieved successfully',
        data: brands,
      });

    } catch (error) {
      throw new BadRequestException(`Failed to retrieve brands: ${error.message}`);
    }
  }

  async getBrand(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu
      const dto: DeleteBrandDto = await this.encryptService.Decrypt(encryptData);

      // Kiểm tra DTO (class-validator sẽ tự động validate, nhưng thêm kiểm tra dự phòng)
      if (!dto.id) {
        throw new BadRequestException('Brand id is required');
      }

      // Tìm thương hiệu theo id
      const brand = await this.brandsRepository.findOne({ where: { id: dto.id } });
      if (!brand) {
        throw new NotFoundException('Brand not found');
      }

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Brand retrieved successfully',
        data: brand,
      });

    } catch (error) {
      throw new BadRequestException(`Failed to retrieve brand: ${error.message}`);
    }
  }

}
