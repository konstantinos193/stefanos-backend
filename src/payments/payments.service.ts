import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import Stripe from 'stripe';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-10-29.clover',
    });
  }

  async processPayment(
    createPaymentDto: CreatePaymentDto,
    userId: string,
  ): Promise<PaymentResponseDto> {
    // Get booking details
    const booking = await this.prisma.booking.findUnique({
      where: { id: createPaymentDto.bookingId },
      include: { property: true, guest: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify booking belongs to user
    if (booking.guestId !== userId) {
      throw new BadRequestException('Unauthorized to pay for this booking');
    }

    // Verify booking is in pending payment status
    if (booking.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('Booking payment already processed');
    }

    // Verify amount matches booking total
    if (Math.abs(createPaymentDto.amount - booking.totalPrice) > 0.01) {
      throw new BadRequestException('Payment amount does not match booking total');
    }

    try {
      // Create Stripe Payment Intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(createPaymentDto.amount * 100), // Convert to cents
        currency: createPaymentDto.currency || 'eur',
        payment_method_types: this.getStripePaymentMethods(createPaymentDto.method),
        metadata: {
          bookingId: booking.id,
          propertyId: booking.propertyId,
          guestId: booking.guestId,
        },
      });

      // Create payment record
      const payment = await this.prisma.payment.create({
        data: {
          bookingId: booking.id,
          propertyId: booking.propertyId,
          amount: createPaymentDto.amount,
          currency: createPaymentDto.currency || 'EUR',
          status: PaymentStatus.PENDING,
          method: createPaymentDto.method,
          stripePaymentIntentId: paymentIntent.id,
        },
      });

      // Payment is automatically linked to booking via bookingId foreign key
      // No need to update booking since the relation is one-to-many

      return this.mapToResponseDto(payment);
    } catch (error) {
      throw new BadRequestException(`Payment processing failed: ${error.message}`);
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { 
        booking: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    try {
      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Update payment status
        const updatedPayment = await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            stripeChargeId: paymentIntent.latest_charge as string,
            processedAt: new Date(),
          },
        });

        // Update booking status
        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            paymentStatus: PaymentStatus.COMPLETED,
            status: 'CONFIRMED',
          },
        });

        // Calculate owner revenue (after platform fees)
        const property = await this.prisma.property.findUnique({
          where: { id: payment.propertyId },
          select: {
            serviceFeePercentage: true,
          },
        });
        const platformFee = payment.amount * (property?.serviceFeePercentage || 10) / 100;
        const ownerRevenue = payment.amount - platformFee;

        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            platformFee: platformFee,
            ownerRevenue: ownerRevenue,
          },
        });

        return this.mapToResponseDto(updatedPayment);
      }

      return this.mapToResponseDto(payment);
    } catch (error) {
      throw new BadRequestException(`Payment confirmation failed: ${error.message}`);
    }
  }

  async refundPayment(
    refundPaymentDto: RefundPaymentDto,
    userId: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: refundPaymentDto.paymentId },
      include: { booking: true, property: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Verify user has permission (owner or admin)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isOwner = payment.property.ownerId === userId;
    const isAdmin = user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new BadRequestException('Unauthorized to refund this payment');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    const refundAmount = refundPaymentDto.amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new BadRequestException('Refund amount cannot exceed payment amount');
    }

    try {
      // Process refund through Stripe
      let refund;
      if (payment.stripeChargeId) {
        refund = await this.stripe.refunds.create({
          charge: payment.stripeChargeId,
          amount: Math.round(refundAmount * 100), // Convert to cents
          reason: refundPaymentDto.reason ? 'requested_by_customer' : 'duplicate',
          metadata: {
            paymentId: payment.id,
            bookingId: payment.bookingId,
            reason: refundPaymentDto.reason || '',
          },
        });
      }

      // Update payment record
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          refundAmount,
          refundReason: refundPaymentDto.reason,
          refundedAt: new Date(),
          status:
            refundAmount === payment.amount
              ? PaymentStatus.REFUNDED
              : PaymentStatus.PARTIALLY_REFUNDED,
        },
      });

      // Update booking status if full refund
      if (refundAmount === payment.amount) {
        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            paymentStatus: PaymentStatus.REFUNDED,
            status: 'CANCELLED',
          },
        });
      }

      return this.mapToResponseDto(updatedPayment);
    } catch (error) {
      throw new BadRequestException(`Refund processing failed: ${error.message}`);
    }
  }

  async handleStripeWebhook(payload: any, signature: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      throw new BadRequestException(`Webhook signature verification failed: ${error.message}`);
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.confirmPayment(event.data.object.id);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object.id);
        break;

      case 'charge.refunded':
        // Refund handled separately via API
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentFailure(paymentIntentId: string): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });

      await this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus: PaymentStatus.FAILED },
      });
    }
  }

  async getPaymentById(paymentId: string, userId: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true, property: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Verify user has access
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isGuest = payment.booking.guestId === userId;
    const isOwner = payment.property.ownerId === userId;
    const isAdmin = user?.role === 'ADMIN';

    if (!isGuest && !isOwner && !isAdmin) {
      throw new BadRequestException('Unauthorized to view this payment');
    }

    return this.mapToResponseDto(payment);
  }

  async getOwnerPayouts(ownerId: string): Promise<any[]> {
    const payments = await this.prisma.payment.findMany({
      where: {
        property: { ownerId },
        status: PaymentStatus.COMPLETED,
      },
      include: {
        booking: true,
        property: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((payment) => ({
      id: payment.id,
      bookingId: payment.bookingId,
      propertyId: payment.propertyId,
      propertyTitle: payment.property.titleEn,
      amount: payment.amount,
      ownerRevenue: payment.booking.ownerRevenue,
      platformFee: payment.booking.platformFee,
      payoutStatus: payment.payoutStatus,
      payoutScheduledFor: payment.payoutScheduledFor,
      processedAt: payment.processedAt,
      createdAt: payment.createdAt,
    }));
  }

  private getStripePaymentMethods(method: PaymentMethod): string[] {
    switch (method) {
      case PaymentMethod.CREDIT_CARD:
      case PaymentMethod.DEBIT_CARD:
        return ['card'];
      case PaymentMethod.APPLE_PAY:
        return ['card', 'apple_pay'];
      case PaymentMethod.GOOGLE_PAY:
        return ['card', 'google_pay'];
      case PaymentMethod.PAYPAL:
        return ['paypal'];
      case PaymentMethod.STRIPE_LINK:
        return ['link'];
      default:
        return ['card'];
    }
  }

  private mapToResponseDto(payment: any): PaymentResponseDto {
    return {
      id: payment.id,
      bookingId: payment.bookingId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      transactionId: payment.transactionId,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      refundAmount: payment.refundAmount,
      processedAt: payment.processedAt,
      createdAt: payment.createdAt,
    };
  }
}

