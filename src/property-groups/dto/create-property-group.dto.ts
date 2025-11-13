import { IsString, IsOptional } from 'class-validator';

export class CreatePropertyGroupDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  nameGr?: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

