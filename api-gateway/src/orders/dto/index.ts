import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
  IsPositive,
  IsIn,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

// ----- Create Order DTO -----
export class CreateOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDtoRequest {
  @IsUUID()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString()
  @IsNotEmpty()
  receiverName: string;

  @Length(10, 15)
  receiverPhoneNumber: string;

  @IsString()
  @IsNotEmpty()
  receiverAddress: string;
}

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString()
  @IsNotEmpty()
  receiverName: string;

  @Length(10, 15)
  receiverPhoneNumber: string;

  @IsString()
  @IsNotEmpty()
  receiverAddress: string;
}

// ----- Update Order Status DTO -----
export class UpdateOrderStatusDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
  status: string;

  @IsOptional()
  @IsString()
  note?: string;
}
