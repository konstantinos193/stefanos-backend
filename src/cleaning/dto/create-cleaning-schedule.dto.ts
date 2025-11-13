import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { CleaningFrequency } from '@prisma/client';

export class CreateCleaningScheduleDto {
  @IsString()
  propertyId: string;

  @IsEnum(CleaningFrequency)
  frequency: CleaningFrequency;

  @IsDateString()
  @IsOptional()
  lastCleaned?: string;

  @IsDateString()
  @IsOptional()
  nextCleaning?: string;

  @IsString()
  @IsOptional()
  assignedCleaner?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

