/* eslint-disable */
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { EncryptModule } from 'src/encrypt/encrypt.module';
import { JwtModule } from 'src/jwt/jwt.module';

@Module({
  imports: [
    EncryptModule,
    JwtModule,
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
            groupId: 'api-gateway-brands-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule { }
