/* eslint-disable */
import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/entities/products.entity';
import { Category } from '../product/entities/category.entity';
import { CreateProductDto, UpdateProductDto, DeleteProductDto } from './dto';
import { EncryptService } from 'src/encrypt/encrypt.service';
import { Brand } from './entities/brand.entity';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

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
    this.logger.log('Starting product creation process...');

    try {
      this.logger.log('Decrypting received data...');
      // Giải mã dữ liệu
      const dto: CreateProductDto = await this.encryptService.Decrypt(encryptData);
      this.logger.log(`Decrypted DTO: ${JSON.stringify(dto)}`);
      this.logger.log(`Product name length: ${dto.name ? dto.name.length : 'undefined'} characters`);
      this.logger.log(`Product name: "${dto.name}"`);

      if (dto.description) {
        this.logger.log(`Product description length: ${dto.description.length} characters`);
      }

      // Validate DTO fields
      if (!dto.name || !dto.category || !dto.brand || !dto.price) {
        this.logger.error('Missing required fields in DTO');
        throw new BadRequestException('Missing required fields: name, category, brand, price');
      }

      // Validate name length (database column is VARCHAR(500))
      if (dto.name.length > 500) {
        this.logger.error(`Product name too long: ${dto.name.length} characters (max: 500)`);
        this.logger.error(`Product name: "${dto.name}"`);
        throw new BadRequestException(`Product name too long. Maximum 500 characters allowed, received ${dto.name.length} characters`);
      }

      // Validate description length if exists
      if (dto.description && dto.description.length > 65535) { // LONGTEXT limit
        this.logger.error(`Product description too long: ${dto.description.length} characters`);
        throw new BadRequestException('Product description too long');
      }

      this.logger.log(`Looking for category with ID: ${dto.category}`);
      // kiểm tra xem category và brand có tồn tại không
      const category = await this.categoriesRepository.findOne({ where: { id: dto.category } });
      if (!category) {
        this.logger.error(`Category not found with ID: ${dto.category}`);
        throw new NotFoundException('Category not found');
      }
      this.logger.log(`Category found: ${category.name}`);

      this.logger.log(`Looking for brand with ID: ${dto.brand}`);
      const brand = await this.brandsRepository.findOne({ where: { id: dto.brand } });
      if (!brand) {
        this.logger.error(`Brand not found with ID: ${dto.brand}`);
        throw new NotFoundException('Brand not found');
      }
      this.logger.log(`Brand found: ${brand.name}`);

      this.logger.log(`Checking if product exists with name: ${dto.name}`);
      // kiểm tra xem sản phẩm đã tồn tại chưa
      const existingProduct = await this.productsRepository.findOne({
        where: { name: dto.name },
      });
      if (existingProduct) {
        this.logger.error(`Product already exists with name: ${dto.name}`);
        throw new BadRequestException('Product already exists');
      }

      this.logger.log('Creating new product entity...');
      // Tạo mới sản phẩm - sanitize data
      const sanitizedName = dto.name.trim().substring(0, 500); // Ensure max 500 chars
      const sanitizedDescription = dto.description ? dto.description.trim().substring(0, 65535) : '';

      const productData = {
        name: sanitizedName,
        description: sanitizedDescription,
        price: Number(dto.price),
        stock: Number(dto.stock) || 0,
        category: category,
        brand: brand,
        image: dto.image || '',
      };

      this.logger.log(`Product data to create: ${JSON.stringify({
        ...productData,
        description: productData.description.length > 100 ?
          productData.description.substring(0, 100) + '...' :
          productData.description
      })}`);
      this.logger.log(`Final name length: ${productData.name.length}`);

      const product = this.productsRepository.create(productData);

      this.logger.log('Saving product to database...');
      // Tiến hành tạo sản phẩm
      const savedProduct = await this.productsRepository.save(product);
      this.logger.log(`Product saved successfully with ID: ${savedProduct.id}`);

      // Mã hóa dữ liệu trả về
      const response = {
        status: 'OK',
        message: 'SUCCESS',
        data: savedProduct,
      };

      this.logger.log('Encrypting response...');
      return await this.encryptService.Encrypt(response);

    } catch (error) {
      this.logger.error(`Error in create method: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);

      // Return encrypted error response instead of throwing
      const errorResponse = {
        status: 'ERR',
        message: error.message || 'Invalid data',
        error: error.name || 'BadRequestException'
      };

      return await this.encryptService.Encrypt(errorResponse);
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
        relations: ['category', 'brand'],
        skip,
        take: limit,
        where: {
          ...(dto.category && { category: { id: dto.category } }),
          ...(dto.brand && { brand: { id: dto.brand } }),
        },
      });

      // Transform data để phù hợp với format mong muốn
      const transformedProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        sold: product.sold || 0,
        category: product.category?.id,
        brand: product.brand?.id,
        image: product.image || '',
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));

      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'SUCCESS',
        data: {
          products: transformedProducts,
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
      const products = await this.productsRepository.find({
        relations: ['category', 'brand']
      });

      // Transform data để phù hợp với format mong muốn
      const transformedProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        sold: product.sold || 0, // Thêm field sold nếu có
        category: product.category?.id,
        brand: product.brand?.id,
        image: product.image || '', // Thêm field image nếu có
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));

      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'SUCCESS',
        data: transformedProducts,
      });
    } catch (error) {
      throw new BadRequestException('Invalid data');
    }
  }

  // Lấy sản phẩm theo id
  async getProduct(encryptData: any): Promise<any> {
    try {
      const dto = await this.encryptService.Decrypt(encryptData);
      const product = await this.productsRepository.findOne({
        where: { id: dto.id },
        relations: ['category', 'brand']
      });

      if (!product) {
        return this.encryptService.Encrypt({
          status: 'ERR',
          message: 'The product is not defined',
        });
      }

      // Transform data để phù hợp với format mong muốn
      const transformedProduct = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        sold: product.sold || 0,
        category: product.category?.id,
        brand: product.brand?.id,
        image: product.image || '',
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };

      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'SUCCESS',
        data: transformedProduct,
      });
    } catch (error) {
      throw new BadRequestException('Invalid data');
    }
  }
}