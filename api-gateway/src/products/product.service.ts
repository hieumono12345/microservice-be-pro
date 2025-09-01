/* eslint-disable */
import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { EncryptService } from 'src/encrypt/encrypt.service';
import { CreateProductDto, UpdateProductDto, GetAllDto } from './dto';


@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientKafka,
    private readonly encryptService: EncryptService,
  ) { }

  async onModuleInit() {
    try {
      [
        'product.create',
        'product.update',
        'product.delete',
        'product.getAll',
        'product.getProduct',
        'product.getAllProducts',
      ].forEach((pattern) => this.productClient.subscribeToResponseOf(pattern));
      await this.productClient.connect();
      this.logger.log('Connected to Kafka successfully');
    } catch (error) {
      this.logger.error(`Failed to connect to Kafka: ${error.message}`);
      throw new Error(`Kafka connection failed: ${error.message}`);
    }
  }

  async createProducts(createProductDto: CreateProductDto) {
    this.logger.log('Creating product...');
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt(createProductDto);
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.productClient.send('product.create', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to create product: ${error.message}`);
      throw new BadRequestException(`Failed to create product: ${error.message}`);
    }

  }

  async getAll(getAllProductDto: GetAllDto) {
    this.logger.log('Fetching all products...');
    try {
      // Mã hóa dữ liệu gửi đi (dữ liệu rỗng)
      const encryptData = await this.encryptService.Encrypt(getAllProductDto);
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.productClient.send('product.getAll', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch products: ${error.message}`);
      throw new BadRequestException(`Failed to fetch products: ${error.message}`);
    }
  }

  async getAllProducts() {
    try {
      // Mã hóa dữ liệu gửi đi (dữ liệu rỗng)
      const encryptData = await this.encryptService.Encrypt({});
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.productClient.send('product.getAllProducts', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch products: ${error.message}`);
      throw new BadRequestException(`Failed to fetch products: ${error.message}`);
    }
  }

  async getProduct(id: string) {
    this.logger.log(`Fetching product with ID ${id}...`);
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt({ id });
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.productClient.send('product.getProduct', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch product: ${error.message}`);
      throw new BadRequestException(`Failed to fetch product: ${error.message}`);
    }
  }

  async updateProduct(updateProductDto: UpdateProductDto) {
    this.logger.log(`Updating product...`);
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt(updateProductDto);
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.productClient.send('product.update', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to update product: ${error.message}`);
      throw new BadRequestException(`Failed to update product: ${error.message}`);
    }
  }

  async deleteProduct(id: string) {
    this.logger.log(`Deleting product with ID ${id}...`);
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt({ id });
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.productClient.send('product.delete', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response - Delete chỉ cần kiểm tra message
      if (!decryptedResponse.message) {
        throw new BadRequestException('Invalid response structure from product service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to delete product: ${error.message}`);
      throw new BadRequestException(`Failed to delete product: ${error.message}`);
    }
  }
}
