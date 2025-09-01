/* eslint-disable */
import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { EncryptService } from 'src/encrypt/encrypt.service';
import { CreateBrandDto, UpdateBrandDto, GetAllDto } from './dto';

@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);

  constructor(
    @Inject('PRODUCT_SERVICE') private readonly brandsClient: ClientKafka,
    private readonly encryptService: EncryptService,
  ) { }

  async onModuleInit() {
    try {
      [
        'brand.getAll',
        'brand.getAllBrands',
        'brand.getBrand',
        'brand.create',
        'brand.update',
        'brand.delete',
      ].forEach((pattern) => this.brandsClient.subscribeToResponseOf(pattern));
      await this.brandsClient.connect();
      this.logger.log('Connected to Kafka successfully');
    } catch (error) {
      this.logger.error(`Failed to connect to Kafka: ${error.message}`);
      throw new Error(`Kafka connection failed: ${error.message}`);
    }
  }

  async createBrands(createBrandDto: CreateBrandDto) {
    this.logger.log('Creating brand...');
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt(createBrandDto);
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.brandsClient.send('brand.create', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to create brand: ${error.message}`);
      throw new BadRequestException(`Failed to create brand: ${error.message}`);
    }

  }

  async getAll(getAllBrandDto: GetAllDto) {
    this.logger.log('Fetching all brands...');
    try {
      // Mã hóa dữ liệu gửi đi (dữ liệu rỗng)
      const encryptData = await this.encryptService.Encrypt(getAllBrandDto);
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.brandsClient.send('brand.getAll', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch brands: ${error.message}`);
      throw new BadRequestException(`Failed to fetch brands: ${error.message}`);
    }
  }

  async getAllBrands() {
    try {
      // Mã hóa dữ liệu gửi đi (dữ liệu rỗng)
      const encryptData = await this.encryptService.Encrypt({});
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.brandsClient.send('brand.getAllBrands', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch brands: ${error.message}`);
      throw new BadRequestException(`Failed to fetch brands: ${error.message}`);
    }
  }

  async getBrand(id: string) {
    this.logger.log(`Fetching brand with ID ${id}...`);
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt({ id });
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.brandsClient.send('brand.getBrand', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch brand: ${error.message}`);
      throw new BadRequestException(`Failed to fetch brand: ${error.message}`);
    }
  }

  async updateBrand(updateBrandDto: UpdateBrandDto) {
    this.logger.log(`Updating brand...`);
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt(updateBrandDto);
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.brandsClient.send('brand.update', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to update brand: ${error.message}`);
      throw new BadRequestException(`Failed to update brand: ${error.message}`);
    }
  }

  async deleteBrand(id: string) {
    this.logger.log(`Deleting brand with ID ${id}...`);
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt({ id });
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.brandsClient.send('brand.delete', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response - Delete chỉ cần kiểm tra message
      if (!decryptedResponse.message) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to delete brand: ${error.message}`);
      throw new BadRequestException(`Failed to delete brand: ${error.message}`);
    }
  }

}
