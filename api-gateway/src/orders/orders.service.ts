/* eslint-disable */
import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { EncryptService } from 'src/encrypt/encrypt.service';
import { CreateOrderDto, UpdateOrderStatusDto, CreateOrderDtoRequest } from './dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @Inject('ORDER_SERVICE') private readonly productClient: ClientKafka,
    private readonly encryptService: EncryptService,
  ) { }

  async onModuleInit() {
    try {
      [
        'order.create',
        'order.getAll',
        'order.getAllByUserId',
        'order.getById',
        'order.updateStatusAdmin',
        'order.updateStatusUser',
      ].forEach((pattern) => this.productClient.subscribeToResponseOf(pattern));
      await this.productClient.connect();
      this.logger.log('Connected to Kafka successfully');
    } catch (error) {
      this.logger.error(`Failed to connect to Kafka: ${error.message}`);
      throw new Error(`Kafka connection failed: ${error.message}`);
    }
  }

  async createOrder(data: CreateOrderDtoRequest, userId: string) {
    this.logger.log('Creating order...');
    if (!data || !userId) {
      this.logger.error('Invalid data or userId provided');
      throw new BadRequestException('Invalid data or userId provided');
    }

    data.userId = userId; // Ensure userId is included in the data

    try {

      // Encrypt the data before sending
      const encryptData = await this.encryptService.Encrypt(data as CreateOrderDto);
      // Send the request to Kafka
      const encryptedResponse = await firstValueFrom(
        this.productClient.send('order.create', encryptData),
      );
      // Decrypt the response
      try {
        const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
        return decryptedResponse;
      }
      catch {
        this.logger.error('Failed to decrypt response');
        return encryptedResponse; // return encrypted response if decryption fails
      }
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);
      throw new BadRequestException(`Failed to create order: ${error.message}`);
    }
  }

  async getAllOrders() {
    this.logger.log('Fetching all orders...');
    try {
      const response = await firstValueFrom(
        this.productClient.send('order.getAll', {}),
      );

      // Decrypt the response
      const decryptedResponse = await this.encryptService.Decrypt(response);
      return decryptedResponse;

    } catch (error) {
      this.logger.error(`Failed to fetch orders: ${error.message}`);
      throw new BadRequestException(`Failed to fetch orders: ${error.message}`);
    }
  }

  async getAllOrdersByUserId(userId: string) {
    this.logger.log(`Fetching orders for user ${userId}...`);
    try {
      // encrypt data before sending
      const encryptData = await this.encryptService.Encrypt({ userId });

      const response = await firstValueFrom(
        this.productClient.send('order.getAllByUserId', encryptData),
      );

      // Decrypt the response
      const decryptedResponse = await this.encryptService.Decrypt(response);
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch orders for user ${userId}: ${error.message}`);
      throw new BadRequestException(`Failed to fetch orders for user ${userId}: ${error.message}`);
    }
  }

  async getOrderById(orderId: string, userId: string) {
    this.logger.log(`Fetching order with ID ${orderId}...`);
    try {
      const encryptData = await this.encryptService.Encrypt({ orderId: orderId, userId: userId });
      // Send the request to Kafka
      const response = await firstValueFrom(
        this.productClient.send('order.getById', encryptData),
      );
      // Decrypt the response
      const decryptedResponse = await this.encryptService.Decrypt(response);

      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch order with ID ${orderId}: ${error.message}`);
      throw new BadRequestException(`Failed to fetch order with ID ${orderId}: ${error.message}`);
    }
  }

  async updateStatusAdmin(id: string, status: string) {
    this.logger.log(`Updating order status for ID ${id} to ${status}...`);
    try {
      const encryptData = await this.encryptService.Encrypt({ orderId: id, status });
      const response = await firstValueFrom(
        this.productClient.send('order.updateStatusAdmin', encryptData),
      );
      // Decrypt the response
      const decryptedResponse = await this.encryptService.Decrypt(response);

      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to update order status for ID ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update order status for ID ${id}: ${error.message}`);
    }
  }

  async updateStatusUser(id: string, userId: string, status: string) {
    this.logger.log(`User ${userId} updating order status for ID ${id} to ${status}...`);
    try {
      const encryptData = await this.encryptService.Encrypt({ orderId: id, userId, status });
      const response = await firstValueFrom(
        this.productClient.send('order.updateStatusUser', encryptData),
      );
      // Decrypt the response
      try {
        const decryptedResponse = await this.encryptService.Decrypt(response);
        return decryptedResponse;
      }
      catch {
        this.logger.error('Failed to decrypt response');
        return response; // return encrypted response if decryption fails
      }
    } catch (error) {
      this.logger.error(`Failed to update order status for ID ${id} by user ${userId}: ${error.message}`);
      throw new BadRequestException(`Failed to update order status for ID ${id} by user ${userId}: ${error.message}`);
    }
  }

}
