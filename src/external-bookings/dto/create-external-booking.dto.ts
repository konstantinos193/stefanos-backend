import { IsString, IsNumber, IsEmail, IsOptional, IsEnum, IsObject, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExternalBookingSource {
  BOOKING_COM = 'BOOKING_COM',
  AIRBNB = 'AIRBNB',
  VRBO = 'VRBO',
  EXPEDIA = 'EXPEDIA',
  MANUAL = 'MANUAL',
  OTHER = 'OTHER',
}

export class CreateExternalBookingDto {
  @ApiProperty({ example: 'property-id-123' })
  @IsString()
  propertyId: string;

  @ApiProperty({ enum: ExternalBookingSource, example: 'BOOKING_COM' })
  @IsEnum(ExternalBookingSource)
  source: ExternalBookingSource;

  @ApiProperty({ example: 'BKG-123456789', description: 'Booking ID from the external platform' })
  @IsString()
  externalId: string;

  @ApiPropertyOptional({ example: 'SomeOtherPlatform', description: 'Platform name when source is OTHER' })
  @IsOptional()
  @IsString()
  externalPlatform?: string;

  @ApiProperty({ example: '2024-06-01T00:00:00Z' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2024-06-10T00:00:00Z' })
  @IsDateString()
  checkOut: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  guests: number;

  // Pricing — external platforms provide their own totals
  @ApiProperty({ example: 850.00, description: 'Total price as shown on the external platform' })
  @IsNumber()
  totalPrice: number;

  @ApiPropertyOptional({ example: 750.00, description: 'Base price (nightly rate * nights)' })
  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @ApiPropertyOptional({ example: 50.00 })
  @IsOptional()
  @IsNumber()
  cleaningFee?: number;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  // Commission info
  @ApiPropertyOptional({ example: 15, description: 'Commission percentage charged by the platform (e.g. 15 for 15%)' })
  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @ApiPropertyOptional({ example: 127.50, description: 'Commission amount in currency' })
  @IsOptional()
  @IsNumber()
  commissionAmount?: number;

  // Guest info
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  guestName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  guestEmail: string;

  @ApiPropertyOptional({ example: '+30 210 123 4567' })
  @IsOptional()
  @IsString()
  guestPhone?: string;

  @ApiPropertyOptional({ example: 'GUEST-EXT-456', description: 'Guest ID on the external platform' })
  @IsOptional()
  @IsString()
  externalGuestId?: string;

  @ApiPropertyOptional({ example: 'Late check-in please' })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiPropertyOptional({ example: 'abc-ical-uid@booking.com', description: 'iCal UID for calendar sync' })
  @IsOptional()
  @IsString()
  iCalUid?: string;

  @ApiPropertyOptional({ description: 'Raw JSON data from the external platform for reference' })
  @IsOptional()
  @IsObject()
  externalData?: Record<string, any>;
}
