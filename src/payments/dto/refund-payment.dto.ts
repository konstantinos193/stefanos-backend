import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class RefundPaymentDto {
  @IsString()
  paymentId: string;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number; // If not provided, full refund

  @IsString()
  @IsOptional()
  reason?: string;
}

