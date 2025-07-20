import { Module } from '@nestjs/common';
import { VaultService } from './vault.service';

@Module({
  providers: [VaultService],
  exports: [VaultService], // 👈 export để nơi khác dùng được
})
export class VaultModule {}
