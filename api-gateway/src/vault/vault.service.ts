/* eslint-disable */
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Vault from 'node-vault';

import * as https from 'https';

@Injectable()
export class VaultService implements OnModuleInit {
  private readonly roleId = '427e752d-18c9-cb5a-e10e-c61fbaa87e15';
  private readonly secretId = 'e120099a-8fdc-4dcf-4fa1-cbd5a09419cf';
  private tokenCreatedAt: number;
  private tokenTTL: number; // tính bằng giây

  private vaultClient = Vault({
    apiVersion: 'v1',
    endpoint: 'https://localhost:8200',
    requestOptions: {
      strictSSL: false, // Nếu dùng self-signed cert
      // agent: new https.Agent({
      //   rejectUnauthorized: false,
      // }),
    },
  });

  async onModuleInit() {
    await this.loginWithAppRole();
  }
  
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

  async getTlsCert(): Promise<{ key: Buffer; cert: Buffer }> {
    const secret = await this.vaultClient.read('secret-v2/data/api-gateway-tls');
    const key = secret.data.data.key;
    const cert = secret.data.data.cert;
  

    return {
      key: Buffer.from(key),
      cert: Buffer.from(cert),
    };
  }
}



