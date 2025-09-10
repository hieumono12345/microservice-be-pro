/* eslint-disable */
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsBoolean, IsInt, Min, IsUUID, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Product name must not exceed 500 characters' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(65535, { message: 'Product description must not exceed 65535 characters' })
  description?: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  price: number;

  @IsInt()
  @Min(0)
  stock: number;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  brand: string;
}

export class UpdateProductDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Product name must not exceed 500 characters' })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(65535, { message: 'Product description must not exceed 65535 characters' })
  description?: string;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  price?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  stock?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  sold?: number;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  category?: string; // Cập nhật category nếu cần

  @IsString()
  @IsOptional()
  brand?: string;
}

export class DeleteProductDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string;
}

export class GetProductDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string;
}

export class GetAllDto {
  @IsInt()
  @Min(0)
  @Transform(({ value }) => value || 1)
  page: number = 1;

  @IsInt()
  @Transform(({ value }) => value || 100)
  pageSize: number = 100;

  @IsString()
  @Transform(({ value }) => value || '')
  filterName: string = '';

  @IsString()
  @Transform(({ value }) => value || '')
  filterCategory?: string = '';

  @IsString()
  @Transform(({ value }) => value || '')
  filterBrand?: string = '';

  // const filterPriceMin = parseFloat(req.query.filterPriceMin) || 0
  @IsInt()
  @Min(0)
  @Transform(({ value }) => value || 0)
  filterPriceMin?: number = 0;

  @IsInt()
  @Min(0)
  @Transform(({ value }) => value || Infinity)
  filterPriceMax?: number = Infinity;

  @IsString()
  sortBy?: string; // e.g., 'price', 'name'

  @IsString()
  sortOrder?: 'ASC' | 'DESC'; // 'ASC' or 'DESC'
}
