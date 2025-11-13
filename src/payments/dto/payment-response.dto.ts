import { PaymentStatus, PaymentMethod } from '@prisma/client';

export class PaymentResponseDto {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  stripePaymentIntentId?: string;
  refundAmount?: number;
  processedAt?: Date;
  createdAt: Date;
}

