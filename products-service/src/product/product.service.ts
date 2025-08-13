/* eslint-disable */
import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/entities/products.entity';
import { Category } from '../product/entities/category.entity';
import { CreateProductDto, UpdateProductDto, DeleteProductDto } from './dto';
import { EncryptService } from 'src/encrypt/encrypt.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    private readonly encryptService: EncryptService,
  ) {}

  async create(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu đầu vào
      const dto: CreateProductDto = await this.encryptService.Decrypt(encryptData);

      // Kiểm tra validation thủ công (bổ sung cho class-validator)
      if (!dto.name) {
        throw new BadRequestException('Product name is required');
      }
      if (dto.price <= 0) {
        throw new BadRequestException('Price must be positive');
      }
      if (dto.stock < 0) {
        throw new BadRequestException('Stock cannot be negative');
      }

      // Kiểm tra sản phẩm đã tồn tại theo name (tùy chọn, để tránh trùng lặp)
      const existingProduct = await this.productsRepository.findOne({ where: { name: dto.name } });
      if (existingProduct) {
        throw new BadRequestException('Product with this name already exists');
      }

      // Kiểm tra category nếu được cung cấp
      let category: Category | undefined;
      if (dto.categoryId) {
        const foundCategory = await this.categoriesRepository.findOne({ where: { id: dto.categoryId } });
        category = foundCategory || undefined; // Chuyển null thành undefined để khớp với Product entity
        if (!category) {
          throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
        }
      }

      // Tạo entity Product
      const product = this.productsRepository.create({
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        category: category,
      });

      // Lưu vào database
      const savedProduct = await this.productsRepository.save(product);

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Product created successfully',
        data: {
          id: savedProduct.id,
          name: savedProduct.name,
          description: savedProduct.description,
          price: savedProduct.price,
          stock: savedProduct.stock,
          imageUrl: savedProduct.imageUrl,
          isActive: savedProduct.isActive,
          categoryId: savedProduct.category ? savedProduct.category.id : null,
          createdAt: savedProduct.createdAt,
          updatedAt: savedProduct.updatedAt,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create product: ${error.message}`);
    }
  }

  async update(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu đầu vào
      const dto: UpdateProductDto = await this.encryptService.Decrypt(encryptData);

      // Kiểm tra ID bắt buộc
      if (!dto.id) {
        throw new BadRequestException('Product ID is required');
      }

      // Tìm sản phẩm theo ID
      const product = await this.productsRepository.findOne({
        where: { id: dto.id },
        relations: ['category'],
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${dto.id} not found`);
      }

      // Kiểm tra category nếu được cập nhật
      let category: Category | undefined = product.category;
      if (dto.categoryId !== undefined) {
        if (dto.categoryId === null) {
          category = undefined; // Xóa liên kết category
        } else {
          const foundCategory = await this.categoriesRepository.findOne({ where: { id: dto.categoryId } });
          category = foundCategory || undefined; // Chuyển null thành undefined
          if (!category) {
            throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
          }
        }
      }

      // Cập nhật các trường
      const updatedProduct = await this.productsRepository.save({
        ...product,
        name: dto.name || product.name,
        description: dto.description !== undefined ? dto.description : product.description,
        price: dto.price || product.price,
        stock: dto.stock !== undefined ? dto.stock : product.stock,
        imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : product.imageUrl,
        isActive: dto.isActive !== undefined ? dto.isActive : product.isActive,
        category: category,
      });

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Product updated successfully',
        data: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: updatedProduct.price,
          stock: updatedProduct.stock,
          imageUrl: updatedProduct.imageUrl,
          isActive: updatedProduct.isActive,
          categoryId: updatedProduct.category ? updatedProduct.category.id : null,
          createdAt: updatedProduct.createdAt,
          updatedAt: updatedProduct.updatedAt,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to update product: ${error.message}`);
    }
  }

  async delete(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu đầu vào
      const dto: DeleteProductDto = await this.encryptService.Decrypt(encryptData);

      // Kiểm tra ID bắt buộc
      if (!dto.id) {
        throw new BadRequestException('Product ID is required');
      }

      // Tìm sản phẩm theo ID
      const product = await this.productsRepository.findOne({ where: { id: dto.id } });
      if (!product) {
        throw new NotFoundException(`Product with ID ${dto.id} not found`);
      }

      // Xóa sản phẩm
      await this.productsRepository.delete(dto.id);

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Product deleted successfully',
        id: dto.id,
      });
    } catch (error) {
      throw new BadRequestException(`Failed to delete product: ${error.message}`);
    }
  }

  async getAll(): Promise<any> {
    try {
      // Lấy tất cả sản phẩm
      const products = await this.productsRepository.find({
        relations: ['category'],
        order: { createdAt: 'DESC' },
        select: ['id', 'name', 'description', 'price', 'stock', 'imageUrl', 'isActive', 'createdAt', 'updatedAt', 'category'],
      });

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Fetched all products successfully',
        data: products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          imageUrl: product.imageUrl,
          isActive: product.isActive,
          categoryId: product.category ? product.category.id : null,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        })),
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch products: ${error.message}`);
    }
  }

  async getById(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu đầu vào
      const dto: { id: string } = await this.encryptService.Decrypt(encryptData);

      // Kiểm tra ID bắt buộc
      if (!dto.id) {
        throw new BadRequestException('Product ID is required');
      }

      // Tìm sản phẩm theo ID
      const product = await this.productsRepository.findOne({
        where: { id: dto.id },
        relations: ['category'],
        select: ['id', 'name', 'description', 'price', 'stock', 'imageUrl', 'isActive', 'createdAt', 'updatedAt', 'category'],
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${dto.id} not found`);
      }

      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Fetched product successfully',
        data: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          imageUrl: product.imageUrl,
          isActive: product.isActive,
          categoryId: product.category ? product.category.id : null,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch product: ${error.message}`);
    }
  }

  async getByCategory(encryptData: any): Promise<any> {
    try {
      // Giải mã dữ liệu đầu vào
      const dto: { categoryId: string } = await this.encryptService.Decrypt(encryptData);
      // Kiểm tra categoryId bắt buộc
      if (!dto.categoryId) {
        throw new BadRequestException('Category ID is required');
      } 
      // Tìm sản phẩm theo categoryId
      const products = await this.productsRepository.find({
        where: { category: { id: dto.categoryId } },
        relations: ['category'],
        order: { createdAt: 'DESC' },
        select: ['id', 'name', 'description', 'price', 'stock', 'imageUrl', 'isActive', 'createdAt', 'updatedAt', 'category'],
      });
      if (products.length === 0) {
        throw new NotFoundException(`No products found for category ID ${dto.categoryId}`);
      }
      // Mã hóa dữ liệu trả về
      return this.encryptService.Encrypt({
        message: 'Fetched products by category successfully',
        data: products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          imageUrl: product.imageUrl,
          isActive: product.isActive,
          categoryId: product.category ? product.category.id : null,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        })),
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch products by category: ${error.message}`);
    }
  }
}