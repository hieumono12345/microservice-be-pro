import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
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
        return this.encryptService.Encrypt({
          status: 'ERR',
          message: 'ERROR',
        });
      }

      // Tạo mới thương hiệu
      const brand = this.brandsRepository.create({
        name: dto.name,
      });

      // Lưu vào database
      const savedBrand = await this.brandsRepository.save(brand);

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'SUCCESS',
        data: savedBrand,
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
        return this.encryptService.Encrypt({
          status: 'ERR',
          message: 'ERROR',
        });
      }

      // Cập nhật thông tin thương hiệu
      brand.name = dto.name;

      // Lưu vào database
      const updatedBrand = await this.brandsRepository.save(brand);

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'SUCCESS',
        data: brand,
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
        return this.encryptService.Encrypt({
          status: 'ERR',
          message: 'ERROR',
        });
      }

      // Xóa thương hiệu
      await this.brandsRepository.remove(brand);

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'SUCCESS',
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

      // Tạo filter object
      const whereCondition: any = {};
      if (dto.filterName && dto.filterName.trim() !== '') {
        whereCondition.name = Like(`%${dto.filterName}%`);
      }

      // Lấy danh sách thương hiệu với phân trang và lọc
      const [brands, total] = await this.brandsRepository.findAndCount({
        where: whereCondition,
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
        order: {
          name: dto.sortOrder === 'ASC' ? 'ASC' : 'DESC',
        },
      });

      // Tính tổng số trang
      const totalPage = Math.ceil(total / dto.pageSize);

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'SUCCESS',
        data: brands,
        total: total,
        totalPage: totalPage,
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
        status: 'OK',
        message: 'SUCCESS',
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
        status: 'OK',
        message: 'SUCCESS',
        data: brand,
      });

    } catch (error) {
      throw new BadRequestException(`Failed to retrieve brand: ${error.message}`);
    }
  }

}
