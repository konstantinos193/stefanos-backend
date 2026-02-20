import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class CreateInquiryDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(10)
  message: string;

  @IsString()
  propertyId: string;

  @IsString()
  @IsOptional()
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
}
