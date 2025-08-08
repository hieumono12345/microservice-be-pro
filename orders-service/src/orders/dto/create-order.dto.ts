import {
  IsUUID,
  IsEnum,
  IsNumber,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';
import { OrderStatus } from '../entities/order.entity';

export class CreateOrderDto {
  @IsUUID()
  userId: string; // Kafka gửi từ Auth Service

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalPrice: number;

  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @ArrayMinSize(1)
  items: CreateOrderItemDto[];
}
