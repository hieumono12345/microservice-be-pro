/* eslint-disable */
import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

// dto/create-category.dto.ts
export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

// dto/update-category.dto.ts
export class UpdateBrandDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class DeleteBrandDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class GetAllDto {
  @IsInt()
  @Transform(({ value }) => value || 1)
  page: number = 1;

  @IsInt()
  @Transform(({ value }) => value || 100)
  pageSize: number = 100;

  @IsString()
  @Transform(({ value }) => value || '')
  filterName: string = '';

  @IsString()
  @Transform(({ value }) => value || 'name')
  sortBy: string = 'name';

  @IsString()
  @Transform(({ value }) => value || 'DESC')
  sortOrder: 'ASC' | 'DESC' = 'DESC';
}
