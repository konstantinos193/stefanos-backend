import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateLogDto {
  @ApiProperty({ description: 'User ID who performed the action' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Action performed (CREATE, UPDATE, DELETE, LOGIN, etc.)', example: 'CREATE' })
  @IsString()
  action: string;

  @ApiProperty({ description: 'Entity type (Property, Booking, User, etc.)', example: 'Booking' })
  @IsString()
  entityType: string;

  @ApiPropertyOptional({ description: 'Entity ID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Before/after changes as JSON object' })
  @IsOptional()
  @IsObject()
  changes?: Record<string, any>;

  @ApiPropertyOptional({ description: 'IP address of the request' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent string' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON object' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
