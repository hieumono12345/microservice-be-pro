import { IsUUID, IsInt, IsNumber, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  productId: string; // Kafka gửi từ Product Service

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number; // snapshot giá tại thời điểm đặt hàng
}
