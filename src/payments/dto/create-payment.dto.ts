import { IsEnum, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { PaymentMethod } from '../../../database/types';

export class CreatePaymentDto {
  @IsString()
  bookingId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;
}

