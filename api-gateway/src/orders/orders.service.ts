/* eslint-disable */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @Inject('ORDER_SERVICE') private readonly productClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.productClient.subscribeToResponseOf('order.create');
    await this.productClient.connect();
  }

  async createOrder(data: any) {
    const response = await firstValueFrom(
      this.productClient.send('order.create', data),
    );
    return response;
  }

}
