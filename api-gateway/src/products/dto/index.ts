/* eslint-disable prettier/prettier */
import { IsString, IsNotEmpty,IsNumber  } from 'class-validator';

// dto/create-product.dto.ts
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsNumber()
  stock: number;

  @IsString()
  imageUrl?: string;

  @IsNotEmpty()
  @IsString()
  categoryId: string;
}

// dto/update-product.dto.ts
export class UpdateProductDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description?: string;

  @IsString()
  imageUrl?: string;
  
  @IsNumber()
  price?: number;

  @IsNumber()
  stock?: number;

  @IsString()
  categoryId?: string;
}
