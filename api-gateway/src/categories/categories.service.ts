/* eslint-disable */
import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { EncryptService } from 'src/encrypt/encrypt.service';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @Inject('PRODUCT_SERVICE') private readonly categoriesClient: ClientKafka,
    private readonly encryptService: EncryptService,
  ) {}

  async onModuleInit() {
    try {
      [
        'categories.create',
        'categories.update',
        'categories.delete',
        'categories.getAll',
        'categories.getById',
      ].forEach((pattern) => this.categoriesClient.subscribeToResponseOf(pattern));
      await this.categoriesClient.connect();
      this.logger.log('Connected to Kafka successfully');
    } catch (error) {
      this.logger.error(`Failed to connect to Kafka: ${error.message}`);
      throw new Error(`Kafka connection failed: ${error.message}`);
    }
  }

  async createCategories(createCategoryDto: CreateCategoryDto) {
    this.logger.log('Creating category...');
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt(createCategoryDto);
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.categoriesClient.send('categories.create', encryptData),
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

  async getAllCategories() {
    this.logger.log('Fetching all categories...');
    try {
      // Mã hóa dữ liệu gửi đi (dữ liệu rỗng)
      const encryptData = await this.encryptService.Encrypt({});
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.categoriesClient.send('categories.getAll', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !Array.isArray(decryptedResponse.data)) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch categories: ${error.message}`);
      throw new BadRequestException(`Failed to fetch categories: ${error.message}`);
    }
  }

  async getCategoryById(id: string) {
    this.logger.log(`Fetching category with ID ${id}...`);
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt({ id });
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.categoriesClient.send('categories.getById', encryptData),
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

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto) {
    this.logger.log(`Updating category with ID ${id}...`);
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt({ ...updateCategoryDto, id });
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.categoriesClient.send('categories.update', encryptData),
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
        this.categoriesClient.send('categories.delete', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.id) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to delete category: ${error.message}`);
      throw new BadRequestException(`Failed to delete category: ${error.message}`);
    }
  }
}
