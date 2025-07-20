/* eslint-disable */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.productClient.subscribeToResponseOf('product.create');
    await this.productClient.connect();
  }

  async createProduct(data: any) {
    const response = await firstValueFrom(
      this.productClient.send('product.create', data),
    );
    return response;
  }

}
