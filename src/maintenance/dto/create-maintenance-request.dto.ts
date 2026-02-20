import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { MaintenancePriority } from '../../../prisma/generated/prisma';

export class CreateMaintenanceRequestDto {
  @IsUUID()
  propertyId: string;

  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(MaintenancePriority)
  priority: MaintenancePriority;

  @IsOptional()
  @IsString()
  assignedTo?: string;
}
