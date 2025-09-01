/* eslint-disable */
import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { EncryptService } from 'src/encrypt/encrypt.service';
import { CreateOrderDto, UpdateOrderDto, CreateOrderReqDto } from './dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @Inject('ORDER_SERVICE') private readonly orderClient: ClientKafka,
    private readonly encryptService: EncryptService,
  ) { }

  async onModuleInit() {
    try {
      [
        'order.getAllOrders',
        'order.getOrder',
        'order.getAllOrderByUser',
        'order.create',
        'order.update',
        'order.cancel',
        'order.delete',
      ].forEach((pattern) => this.orderClient.subscribeToResponseOf(pattern));
      await this.orderClient.connect();
      this.logger.log('Connected to Kafka successfully');
    } catch (error) {
      this.logger.error(`Failed to connect to Kafka: ${error.message}`);
      throw new Error(`Kafka connection failed: ${error.message}`);
    }
  }

  async createOrders(createOrderDto: CreateOrderReqDto) {
    this.logger.log('Creating order...');
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt(createOrderDto);
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.orderClient.send('order.create', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.status || !decryptedResponse.message) {
        throw new BadRequestException('Invalid response structure from order service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);
      throw new BadRequestException(`Failed to create order: ${error.message}`);
    }

  }

  async getAllOrders() {
    try {
      // Mã hóa dữ liệu gửi đi (dữ liệu rỗng)
      const encryptData = await this.encryptService.Encrypt({});
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.orderClient.send('order.getAllOrders', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from order service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch orders: ${error.message}`);
      throw new BadRequestException(`Failed to fetch orders: ${error.message}`);
    }
  }

  async getAllOrderByUser(userId: string) {
    this.logger.log(`Fetching orders for user ID ${userId}...`);
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt({ userId });
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.orderClient.send('order.getAllOrderByUser', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from order service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch orders: ${error.message}`);
      throw new BadRequestException(`Failed to fetch orders: ${error.message}`);
    }
  }

  async getOrder(id: string) {
    this.logger.log(`Fetching order with ID ${id}...`);
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt({ id });
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.orderClient.send('order.getOrder', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.data) {
        throw new BadRequestException('Invalid response structure from order service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to fetch order: ${error.message}`);
      throw new BadRequestException(`Failed to fetch order: ${error.message}`);
    }
  }

  async updateOrder(orderId: string) {
    this.logger.log(`Updating order...`);
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt({ orderId });
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.orderClient.send('order.update', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.status) {
        throw new BadRequestException('Invalid response structure from order service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to update order: ${error.message}`);
      throw new BadRequestException(`Failed to update order: ${error.message}`);
    }
  }

  async cancelOrder(id: string) {
    this.logger.log(`Cancelling order...`);
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt({ id });
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.orderClient.send('order.cancel', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response
      if (!decryptedResponse.message || !decryptedResponse.status) {
        throw new BadRequestException('Invalid response structure from order service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to cancel order: ${error.message}`);
      throw new BadRequestException(`Failed to cancel order: ${error.message}`);
    }
  }

  async deleteOrder(id: string) {
    this.logger.log(`Deleting order with ID ${id}...`);
    try {
      // Mã hóa dữ liệu gửi đi
      const encryptData = await this.encryptService.Encrypt({ id });
      // Gửi yêu cầu tới Kafka
      const encryptedResponse = await firstValueFrom(
        this.orderClient.send('order.delete', encryptData),
      );
      // Giải mã dữ liệu nhận về
      const decryptedResponse = await this.encryptService.Decrypt(encryptedResponse);
      // Kiểm tra cấu trúc response - Delete chỉ cần kiểm tra message
      if (!decryptedResponse.message) {
        throw new BadRequestException('Invalid response structure from order service');
      }
      return decryptedResponse;
    } catch (error) {
      this.logger.error(`Failed to delete order: ${error.message}`);
      throw new BadRequestException(`Failed to delete order: ${error.message}`);
    }
  }
}
