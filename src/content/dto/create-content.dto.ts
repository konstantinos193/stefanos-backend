import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  IsJSON,
} from 'class-validator';
import { ContentType } from '../../database/types';

export class CreateContentDto {
  @IsString()
  page: string;

  @IsString()
  section: string;

  @IsString()
  key: string;

  @IsString()
  @IsOptional()
  contentGr?: string;

  @IsString()
  @IsOptional()
  contentEn?: string;

  @IsEnum(ContentType)
  @IsOptional()
  type?: ContentType;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsOptional()
  metadata?: any;

  // SEO fields
  @IsString()
  @IsOptional()
  metaTitleGr?: string;

  @IsString()
  @IsOptional()
  metaTitleEn?: string;

  @IsString()
  @IsOptional()
  metaDescriptionGr?: string;

  @IsString()
  @IsOptional()
  metaDescriptionEn?: string;

  @IsOptional()
  keywords?: string[];
}
