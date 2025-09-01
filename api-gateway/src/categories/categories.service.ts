/* eslint-disable */
import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { EncryptService } from 'src/encrypt/encrypt.service';
import { CreateCategoryDto, UpdateCategoryDto, GetAllDto } from './dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @Inject('PRODUCT_SERVICE') private readonly categoriesClient: ClientKafka,
    private readonly encryptService: EncryptService,
  ) { }

  async onModuleInit() {
    try {
      [
        'category.getAll',
        'category.getAllCategories',
        'category.getCategory',
        'category.create',
        'category.update',
        'category.delete',
      ].forEach((pattern) => this.categoriesClient.subscribeToResponseOf(pattern));
      await this.categoriesClient.connect();
      this.logger.log('Connected to Kafka successfully');
    } catch (error) {
      this.logger.error(`Failed to connect to Kafka: ${error.message}`);
      throw new Error(`Kafka connection failed: ${error.message}`);
    }
  }

  async createCategory(createCategoryDto: CreateCategoryDto) {
    this.logger.log('Creating category...');
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt(createCategoryDto);
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.categoriesClient.send('category.create', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to create category: ${error.message}`);
      throw new BadRequestException(`Failed to create category: ${error.message}`);
    }
  }

  async getAll(getAllCategoryDto: GetAllDto) {
    this.logger.log('Fetching all categorys...');
    try {
      // Mã hóa dữ liệu gửi đi (dữ liệu rỗng)
      const encryptData = await this.encryptService.Encrypt(getAllCategoryDto);
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.categoriesClient.send('category.getAll', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch categorys: ${error.message}`);
      throw new BadRequestException(`Failed to fetch categorys: ${error.message}`);
    }
  }

  async getAllCategory() {
    try {
      // Mã hóa dữ liệu gửi đi (dữ liệu rỗng)
      const encryptData = await this.encryptService.Encrypt({});
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.categoriesClient.send('category.getAllCategories', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch categories: ${error.message}`);
      throw new BadRequestException(`Failed to fetch categories: ${error.message}`);
    }
  }

  async getCategory(id: string) {
    this.logger.log(`Fetching category with ID ${id}...`);
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt({ id });
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.categoriesClient.send('category.getCategory', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch category: ${error.message}`);
      throw new BadRequestException(`Failed to fetch category: ${error.message}`);
    }
  }

  async updateCategory(updateCategoryDto: UpdateCategoryDto) {
    this.logger.log(`Updating category...`);
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt(updateCategoryDto);
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.categoriesClient.send('category.update', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to update category: ${error.message}`);
      throw new BadRequestException(`Failed to update category: ${error.message}`);
    }
  }

  async deleteCategory(id: string) {
    this.logger.log(`Deleting category with ID ${id}...`);
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt({ id });
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.categoriesClient.send('category.delete', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response - Delete chỉ cần kiểm tra message
      if (!decryptedResponse.message) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to delete category: ${error.message}`);
      throw new BadRequestException(`Failed to delete category: ${error.message}`);
    }
  }

}
