/* eslint-disable */
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
// import { ProductService } from './product.service';
// import { ProductController } from './product.controller';
import { OrderService } from './orders.service';
import { OrderController } from './orders.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ORDER_SERVICE',
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
            groupId: 'api-gateway-order-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
