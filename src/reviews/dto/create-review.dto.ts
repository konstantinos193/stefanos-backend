import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 'property-id-123' })
  @IsString()
  propertyId: string;

  @ApiProperty({ example: 'booking-id-123' })
  @IsString()
  bookingId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5, description: 'Cleanliness rating (required)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  cleanlinessRating: number;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  accuracyRating?: number;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  communicationRating?: number;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  locationRating?: number;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  valueRating?: number;

  @ApiPropertyOptional({ example: 'Great stay!' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'We had a wonderful time. The property was very clean.' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

