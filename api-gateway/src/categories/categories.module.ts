/* eslint-disable */
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { EncryptModule } from 'src/encrypt/encrypt.module';

@Module({
  imports: [
    EncryptModule,
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
            groupId: 'api-gateway-categories-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
