/* eslint-disable */
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:29092'],
            sasl: {
              mechanism: 'plain',
              username: 'api-gateway',
              password: 'api-secret',
            },
            ssl: false,
          },
          consumer: {
            groupId: 'api-gateway-product-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
