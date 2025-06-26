import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { VaultModule } from 'src/vault/vault.module';

@Module({
  imports: [
    VaultModule,
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:29092'],
            sasl: {
              mechanism: 'plain',
              username: 'admin',
              password: 'admin-secret',
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