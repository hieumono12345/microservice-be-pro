/* eslint-disable */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { VaultService } from './vault/vault.service';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Setup global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  const vaultService = app.get(VaultService);
  await vaultService.onModuleInit(); // Login
  app.use(cookieParser());
  const { key, cert } = await vaultService.getTlsCert();

  const httpsOptions = {
    key: key,
    cert: cert,
  };

  // const httpsOptions = {
  //   key: fs.readFileSync(path.join(__dirname, '../../certs/api-gateway/server.key')),
  //   cert: fs.readFileSync(path.join(__dirname, '../../certs/api-gateway/server.crt')),
  // };

  await app.listen(3000, '0.0.0.0', () => {
    const server = https.createServer(httpsOptions, app.getHttpAdapter().getInstance());
    server.listen(3443);
    console.log('API Gateway is running on HTTPS port 3443');
  });

}
bootstrap();

