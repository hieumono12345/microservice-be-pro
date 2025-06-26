import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { VaultModule } from 'src/vault/vault.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), VaultModule],
  controllers: [AuthController],
  providers: [AuthService, JwtService],
})
export class AuthModule {}