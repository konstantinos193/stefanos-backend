import { IsString, IsBoolean, IsOptional, IsArray, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Διαχείριση Ακινήτων' })
  @IsString()
  @MinLength(1)
  titleGr: string;

  @ApiProperty({ example: 'Property Management' })
  @IsString()
  @MinLength(1)
  titleEn: string;

  @ApiPropertyOptional({ example: 'Αξιόπιστη διαχείριση' })
  @IsOptional()
  @IsString()
  descriptionGr?: string;

  @ApiPropertyOptional({ example: 'Reliable management' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ example: 'building' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ type: [String], example: ['24/7 Support', 'Maintenance'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ example: 'Από 200€/μήνα' })
  @IsOptional()
  @IsString()
  pricingGr?: string;

  @ApiPropertyOptional({ example: 'From €200/month' })
  @IsOptional()
  @IsString()
  pricingEn?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

