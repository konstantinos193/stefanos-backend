import { IsString, IsOptional, IsArray, IsNumber, MinLength, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKnowledgeArticleDto {
  @ApiProperty({ example: 'Οδηγός Επένδυσης' })
  @IsString()
  @MinLength(1)
  titleGr: string;

  @ApiProperty({ example: 'Investment Guide' })
  @IsString()
  @MinLength(1)
  titleEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentGr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentEn?: string;

  @ApiProperty({ example: 'investment' })
  @IsString()
  @MinLength(1)
  category: string;

  @ApiPropertyOptional({ type: [String], example: ['investment', 'guide'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: 'Real Estate Team' })
  @IsString()
  @MinLength(1)
  author: string;

  @ApiPropertyOptional({ example: 15, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  readTime?: number;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}

