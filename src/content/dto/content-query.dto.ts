import { IsString, IsOptional, IsInt, IsBoolean, IsEnum } from 'class-validator';
import { ContentType } from '../../database/types';

export class ContentQueryDto {
  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  section?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsEnum(ContentType)
  @IsOptional()
  type?: ContentType;

  @IsInt()
  @IsOptional()
  skip?: number;

  @IsInt()
  @IsOptional()
  take?: number;
}
