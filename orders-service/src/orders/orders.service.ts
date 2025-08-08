/* eslint-disable */
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderService {
  create(data: any) {
    // Giả lập lưu sản phẩm
    // return { message: 'Product created successfully', data };
    return {
      message: 'order created successfully'
    };
  }
}
