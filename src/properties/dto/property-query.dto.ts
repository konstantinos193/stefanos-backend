import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PropertyType } from './create-property.dto';

export class PropertyQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'Athens' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '2024-06-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  checkIn?: string;

  @ApiPropertyOptional({ example: '2024-06-10T00:00:00Z' })
  @IsOptional()
  @IsString()
  checkOut?: string;

  @ApiPropertyOptional({ example: 2, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  guests?: number;

  @ApiPropertyOptional({ enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @ApiPropertyOptional({ example: 50, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ example: 500, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ example: 'wifi,parking' })
  @IsOptional()
  @IsString()
  amenities?: string;
}

