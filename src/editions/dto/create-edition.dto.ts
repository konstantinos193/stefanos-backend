import { IsString, IsBoolean, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateEditionDto {
  @ApiProperty({ example: 'real-estate' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'Κατοικίες' })
  @IsString()
  titleGr: string;

  @ApiProperty({ example: 'Residential Properties' })
  @IsString()
  titleEn: string;

  @ApiPropertyOptional({ example: 'Σύγχρονα διαμερίσματα' })
  @IsOptional()
  @IsString()
  descriptionGr?: string;

  @ApiPropertyOptional({ example: 'Modern apartments' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentGr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentEn?: string;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.DRAFT })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;
}

