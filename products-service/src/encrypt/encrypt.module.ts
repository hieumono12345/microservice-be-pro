/* eslint-disable */
import { Module } from "@nestjs/common";
import { EncryptService } from "./encrypt.service";
import { VaultModule } from "src/vault/vault.module";

@Module({
  imports: [VaultModule],
  providers: [EncryptService],
  exports: [EncryptService],
})
export class EncryptModule {}
