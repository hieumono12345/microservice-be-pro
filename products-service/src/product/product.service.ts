/* eslint-disable */
import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/entities/products.entity';
import { Category } from '../product/entities/category.entity';
import { CreateProductDto, UpdateProductDto, DeleteProductDto } from './dto';
import { EncryptService } from 'src/encrypt/encrypt.service';
import { Brand } from './entities/brand.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Brand)
    private readonly brandsRepository: Repository<Brand>,
    private readonly encryptService: EncryptService,
  ) { }

  async create(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu
      const dto: CreateProductDto = await this.encryptService.Decrypt(encryptData);

      // kiểm tra xem category và brand có tồn tại không
      const category = await this.categoriesRepository.findOne({ where: { id: dto.category } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }

      const brand = await this.brandsRepository.findOne({ where: { id: dto.brand } });
      if (!brand) {
        throw new NotFoundException('Brand not found');
      }

      // kiểm tra xem sản phẩm đã tồn tại chưa
      const existingProduct = await this.productsRepository.findOne({
        where: { name: dto.name },
      });
      if (existingProduct) {
        throw new BadRequestException('Product already exists');
      }

      // Tạo mới sản phẩm
      const product = this.productsRepository.create({
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        category: category,
        brand: brand,
      });

      // Tiến hành tạo sản phẩm
      await this.productsRepository.save(product);

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'SUCCESS',
        data: product,
      });
    } catch (error) {
      throw new BadRequestException('Invalid data');
    }
  }

  async update(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu
      const dto: UpdateProductDto = await this.encryptService.Decrypt(encryptData);
      // Tìm sản phẩm theo id
      const product = await this.productsRepository.findOne({ where: { id: dto.id } });
      if (!product) {
        return this.encryptService.Encrypt({
          status: 'ERR',
          message: 'The product is not defined',
        });
      }
      // Cập nhật thông tin sản phẩm
      if (dto.name) product.name = dto.name;
      if (dto.description) product.description = dto.description;
      if (dto.price) product.price = dto.price;
      await this.productsRepository.save(product);
      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'SUCCESS',
        data: product,
      });
    } catch (error) {
      throw new BadRequestException('Invalid data');
    }
  }
  // Xóa sản phẩm
  async delete(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu
      const dto: DeleteProductDto = await this.encryptService.Decrypt(encryptData);
      // Tìm sản phẩm theo id
      const product = await this.productsRepository.findOne({ where: { id: dto.id } });
      if (!product) {
        return this.encryptService.Encrypt({
          status: 'ERR',
          message: 'The product is not defined',
        });
      }
      await this.productsRepository.remove(product);
      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'SUCCESS',
      });
    } catch (error) {
      throw new BadRequestException('Invalid data');
    }
  }

  // Lấy tất cả sản phẩm với phân trang và lọc
  async getAll(encryptData: any): Promise<any> {
    try {
      const dto = await this.encryptService.Decrypt(encryptData);
      const page = dto.page || 1;
      const limit = dto.pageSize || 10;
      const skip = (page - 1) * limit;
      const orderBy = dto.order || 'name';



      const [products, total] = await this.productsRepository.findAndCount({
        skip,
        take: limit,
        where: {
          ...(dto.category && { category: { id: dto.category } }),
          ...(dto.brand && { brand: { id: dto.brand } }),
        },
      });

      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'SUCCESS',
        data: {
          products,
          total,
          page,
          last_page: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      throw new BadRequestException('Invalid data');
    }

  }
  // Lấy tất cả sản phẩm không phân trang
  async getAllProduct(): Promise<any> {
    try {
      const products = await this.productsRepository.find();
      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'SUCCESS',
        data: products,
      });
    } catch (error) {
      throw new BadRequestException('Invalid data');
    }
  }

  // Lấy sản phẩm theo id
  async getProduct(encryptData: any): Promise<any> {
    try {
      const dto = await this.encryptService.Decrypt(encryptData);
      const product = await this.productsRepository.findOne({ where: { id: dto.id } });
      if (!product) {
        return this.encryptService.Encrypt({
          status: 'ERR',
          message: 'The product is not defined',
        });
      }
      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'SUCCESS',
        data: product,
      });
    } catch (error) {
      throw new BadRequestException('Invalid data');
    }
  }
}