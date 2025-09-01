/* eslint-disable */
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsBoolean, IsInt, Min, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
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
  name?: string;

  @IsString()
  @IsOptional()
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

export class UpdateProductReqDto {
  @IsString()
  @IsOptional()
  @IsUUID()
  id: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  price?: number;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
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
  brand?: string; // Cập nhật brand nếu cần
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
  @Transform(({ value }) => value || 999999999)
  filterPriceMax?: number = 999999999;

  @IsString()
  @Transform(({ value }) => value || '')
  sortBy?: string = 'name'; // e.g., 'price', 'name'

  @IsString()
  @Transform(({ value }) => value || 'DESC')
  sortOrder?: 'ASC' | 'DESC' = 'DESC'; // 'ASC' or 'DESC'
}
