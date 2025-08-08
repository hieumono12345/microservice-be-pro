/* eslint-disable */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { VaultModule } from 'src/vault/vault.module';
import { EncryptModule } from 'src/encrypt/encrypt.module';
import { JwtModule } from 'src/jwt/jwt.module';

@Module({
  imports: [
    VaultModule,
    EncryptModule,
    JwtModule,
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
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
            groupId: 'api-gateway-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}

