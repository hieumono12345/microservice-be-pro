/* eslint-disable */
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Vault from 'node-vault';

@Injectable()
export class VaultService implements OnModuleInit {
  private readonly roleId = '3a3f9b9f-d366-d8a7-fbf2-b1d8e0755906';
  private readonly secretId = '2ce60c8f-a3d3-4606-06ea-6ca5cd89f657';
  private tokenCreatedAt: number;
  private tokenTTL: number; // tính bằng giây

  private vaultClient = Vault({
    apiVersion: 'v1',
    endpoint: 'https://localhost:8200',
    requestOptions: {
      strictSSL: false, // Nếu dùng self-signed cert      
    },
  });

  async onModuleInit() {
    await this.loginWithAppRole();
  }

//   private async loginWithAppRole() {
//     const result = await this.vaultClient.approleLogin({
//       role_id: this.roleId,
//       secret_id: this.secretId,
//     });
//     this.vaultClient.token = result.auth.client_token;
//     console.log('[Vault] Logged in with AppRole');
//   }
  private async loginWithAppRole() {
    const result = await this.vaultClient.approleLogin({
        role_id: this.roleId,
        secret_id: this.secretId,
    });

    this.vaultClient.token = result.auth.client_token;
    this.tokenCreatedAt = Date.now();
    this.tokenTTL = result.auth.lease_duration; // lease_duration tính bằng giây

    console.log('[Vault] Logged in with AppRole');
  }

  private async maybeRenewToken() {
    const now = Date.now();
    const elapsed = (now - this.tokenCreatedAt) / 1000;

    const shouldRenew = this.tokenTTL && elapsed >= this.tokenTTL - 30;

    if (!shouldRenew) return;

    try {
      await this.vaultClient.tokenRenewSelf();
      this.tokenCreatedAt = Date.now();
      console.log('[Vault] Token renewed');
    } catch (err) {
      console.warn('[Vault] Token renew failed, re-login with AppRole');
      await this.loginWithAppRole();
    }
  }

  // Lấy AES Key dùng chung (KV v2)
  async getAesKey() {
    await this.maybeRenewToken();
    const secret = await this.vaultClient.read('secret-v2/data/aes-key');
    return secret.data.data.value; // value là tên bạn lưu khi put
  }

  // Lấy API Key riêng cho API Gateway (KV v2)
  async getGatewayApiKey() {
    await this.maybeRenewToken();
    const secret = await this.vaultClient.read('secret-v2/data/api-key-gateway');
    return secret.data.data.key;
  }
}

