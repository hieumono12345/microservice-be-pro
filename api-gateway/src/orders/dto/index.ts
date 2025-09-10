import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsDateString, IsOptional, IsPositive } from 'class-validator';
import { Type, Transform } from 'class-transformer';

class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  product: string; // id sản phẩm (ObjectId)

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  image: string;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  quantity: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : value)
  price: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : value)
  totalPrice: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // COD, PayPal, Momo...

  @IsString()
  user: string; // userId

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems: CreateOrderItemDto[];

  // Các field optional mà client có thể gửi lên
  @Transform(({ value }) => {
    if (!value) return new Date().toISOString();

    // Thử parse date, nếu lỗi thì dùng current date
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  })
  @IsOptional()
  orderDate?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : 0)
  status?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : 0)
  totalPrice?: number;

  @IsString()
  @IsOptional()
  email?: string;
}

export class CreateOrderReqDto {
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // COD, PayPal, Momo...

  @IsString()
  @IsOptional()
  user: string; // userId

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems: CreateOrderItemDto[];

  // Các field optional mà client có thể gửi lên
  @Transform(({ value }) => {
    if (!value) return new Date().toISOString();

    // Thử parse date, nếu lỗi thì dùng current date
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  })
  @IsOptional()
  orderDate?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : 0)
  status?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : 0)
  totalPrice?: number;

  @IsString()
  @IsOptional()
  email?: string;
}


export class UpdateOrderDto {
  @IsString()
  @IsNotEmpty()
  id: string; // orderId

  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @IsString()
  @IsOptional()
  recipient?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string; // COD, PayPal, Momo...

  @IsNumber()
  @IsOptional()
  status?: number; // pending, paid, shipped...

  @IsNumber()
  @IsOptional()
  totalPrice?: number;
}

export class UpdateOrderReqDto {
  @IsString()
  @IsOptional()
  id: string; // orderId

  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @IsString()
  @IsOptional()
  recipient?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string; // COD, PayPal, Momo...

  @IsNumber()
  @IsOptional()
  status?: number; // pending, paid, shipped...

  @IsNumber()
  @IsOptional()
  totalPrice?: number;
}