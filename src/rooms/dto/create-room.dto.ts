import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';
import { RoomType } from '../../database/types';

export class CreateRoomDto {
  @IsString()
  propertyId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  nameGr?: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsEnum(RoomType)
  type: RoomType;

  @IsNumber()
  @Min(1)
  capacity: number;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsBoolean()
  @IsOptional()
  isBookable?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  descriptionGr?: string;

  @IsString()
  @IsOptional()
  descriptionEn?: string;
}

