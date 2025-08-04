import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['localhost:29092'],
        sasl: {
          mechanism: 'plain',
          username: 'auth-service',
          password: 'auth-secret',
        },
        ssl: false,
      },
      consumer: {
        groupId: 'auth-service-consumer',
      },
    },
  });

  await app.listen();
  logger.log(`Auth Service is running in ${process.env.NODE_ENV || 'development'} mode`);
}
bootstrap();

