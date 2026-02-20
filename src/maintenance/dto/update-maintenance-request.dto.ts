import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { MaintenancePriority, MaintenanceStatus } from '../../../prisma/generated/prisma';

export class UpdateMaintenanceRequestDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}
