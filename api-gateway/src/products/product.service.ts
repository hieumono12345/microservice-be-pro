/* eslint-disable */
import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { EncryptService } from 'src/encrypt/encrypt.service';
import { CreateProductDto, UpdateProductDto, DeleteProductDto } from './dto';


@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientKafka,
    private readonly encryptService: EncryptService,
  ) {}

  async onModuleInit() {
    try {
      [
        'products.create',
        'products.update',
        'products.delete',
        'products.getAll',
        'products.getById',
        'products.getByCategory',
      ].forEach((pattern) => this.productClient.subscribeToResponseOf(pattern));
      await this.productClient.connect();
      this.logger.log('Connected to Kafka successfully');
    } catch (error) {
      this.logger.error(`Failed to connect to Kafka: ${error.message}`);
      throw new Error(`Kafka connection failed: ${error.message}`);
    }
  }

  async createProduct(data: CreateProductDto) {
    this.logger.log('Creating product...');
    try {
      // Encrypt the data before sending
      const encryptData = await this.encryptService.Encrypt(data);
      // Send the request to Kafka
      const encryptedResponse = await firstValueFrom(
        this.productClient.send('products.create', encryptData),
      );
      // Decrypt the response
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to create product: ${error.message}`);
      throw new BadRequestException(`Failed to create product: ${error.message}`);
    }
  }

  async updateProduct(data: UpdateProductDto) {
    this.logger.log('Updating product...');
    try {
      // Encrypt the data before sending
      const encryptData = await this.encryptService.Encrypt(data);
      // Send the request to Kafka
      const encryptedResponse = await firstValueFrom(
        this.productClient.send('products.update', encryptData),
      );
      // Decrypt the response
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to update product: ${error.message}`);
      throw new BadRequestException(`Failed to update product: ${error.message}`);
    } 
  }

  async deleteProduct(data: DeleteProductDto) {
    this.logger.log('Deleting product...');
    try {
      // Encrypt the data before sending
      const encryptData = await this.encryptService.Encrypt(data);
      // Send the request to Kafka
      const encryptedResponse = await firstValueFrom(
        this.productClient.send('products.delete', encryptData),
      );
      // Decrypt the response
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to delete product: ${error.message}`);
      throw new BadRequestException(`Failed to delete product: ${error.message}`);
    }
  }

  async getAllProducts() {
    this.logger.log('Fetching all products...');
    try {
      // Encrypt the request data (empty object)
      const encryptData = await this.encryptService.Encrypt({});
      // Send the request to Kafka
      const encryptedResponse = await firstValueFrom(
        this.productClient.send('products.getAll', encryptData),
      );
      // Decrypt the response
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch products: ${error.message}`);
      throw new BadRequestException(`Failed to fetch products: ${error.message}`);
    }
  }

  async getProductById(id: string) {
    this.logger.log(`Fetching product with ID ${id}...`);
    try {
      // Encrypt the request data
      const encryptData = await this.encryptService.Encrypt({ id });
      // Send the request to Kafka
      const encryptedResponse = await firstValueFrom(
        this.productClient.send('products.getById', encryptData),
      );
      // Decrypt the response
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch product: ${error.message}`);
      throw new BadRequestException(`Failed to fetch product: ${error.message}`);
    }
  }

  // get product by category
  async getProductsByCategory(categoryId: string) {
    this.logger.log(`Fetching products for category ID ${categoryId}...`);
    try {
      // Encrypt the request data
      const encryptData = await this.encryptService.Encrypt({ categoryId });
      // Send the request to Kafka
      const encryptedResponse = await firstValueFrom(
        this.productClient.send('products.getByCategory', encryptData),
      );
      // Decrypt the response
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch products by category: ${error.message}`);
      throw new BadRequestException(`Failed to fetch products by category: ${error.message}`);
    }
  }
}
