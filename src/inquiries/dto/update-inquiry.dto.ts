import { IsString, IsOptional } from 'class-validator';

export class UpdateInquiryDto {
  @IsString()
  @IsOptional()
  status?: 'NEW' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED' | 'SPAM';

  @IsString()
  @IsOptional()
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @IsString()
  @IsOptional()
  response?: string;

  @IsString()
  @IsOptional()
  adminNotes?: string;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsString()
  @IsOptional()
  respondedBy?: string;
}
