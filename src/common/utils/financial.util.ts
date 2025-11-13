import { CancellationPolicy } from '../../database/types';

export interface PriceBreakdown {
  basePrice: number;
  nights: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  discounts: number;
  totalPrice: number;
  currency: string;
}

export interface RefundCalculation {
  refundAmount: number;
  refundPercentage: number;
  processingFee: number;
  netRefund: number;
}

export class FinancialUtil {
  /**
   * Calculate total price for a booking (stay-only payment model)
   */
  static calculateTotalPrice(
    basePrice: number,
    nights: number,
    guests: number,
    cleaningFee: number = 0,
    serviceFeePercentage: number = 10,
    taxRate: number = 24, // Greece VAT
    discounts: number = 0,
    currency: string = 'EUR',
  ): PriceBreakdown {
    const subtotal = basePrice * nights;
    const serviceFee = subtotal * (serviceFeePercentage / 100);
    const taxes = (subtotal + cleaningFee + serviceFee) * (taxRate / 100);
    const totalPrice = subtotal + cleaningFee + serviceFee + taxes - discounts;

    return {
      basePrice,
      nights,
      subtotal,
      cleaningFee,
      serviceFee,
      taxes,
      discounts,
      totalPrice: Math.round(totalPrice * 100) / 100, // Round to 2 decimals
      currency,
    };
  }

  /**
   * Calculate refund based on cancellation policy
   */
  static calculateRefund(
    bookingTotal: number,
    cancellationDate: Date,
    checkInDate: Date,
    policy: CancellationPolicy,
  ): RefundCalculation {
    const daysUntilCheckIn = Math.floor(
      (checkInDate.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    let refundPercentage = 0;
    const processingFee = bookingTotal * 0.03; // 3% processing fee

    switch (policy) {
      case CancellationPolicy.FLEXIBLE:
        // Full refund if cancelled 24h before check-in
        refundPercentage = daysUntilCheckIn >= 1 ? 100 : 0;
        break;

      case CancellationPolicy.MODERATE:
        // Full refund if cancelled 5 days before check-in
        refundPercentage = daysUntilCheckIn >= 5 ? 100 : 0;
        break;

      case CancellationPolicy.STRICT:
        // 50% refund if cancelled 7 days before check-in
        refundPercentage = daysUntilCheckIn >= 7 ? 50 : 0;
        break;

      case CancellationPolicy.SUPER_STRICT:
        // No refund
        refundPercentage = 0;
        break;
    }

    const refundAmount = (bookingTotal * refundPercentage) / 100;
    const netRefund = Math.max(0, refundAmount - processingFee);

    return {
      refundAmount: Math.round(refundAmount * 100) / 100,
      refundPercentage,
      processingFee: Math.round(processingFee * 100) / 100,
      netRefund: Math.round(netRefund * 100) / 100,
    };
  }

  /**
   * Calculate owner revenue after platform fees
   */
  static calculateOwnerRevenue(
    totalPrice: number,
    serviceFeePercentage: number = 10,
  ): { ownerRevenue: number; platformFee: number } {
    const platformFee = totalPrice * (serviceFeePercentage / 100);
    const ownerRevenue = totalPrice - platformFee;

    return {
      ownerRevenue: Math.round(ownerRevenue * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
    };
  }

  /**
   * Calculate profit margin
   */
  static calculateProfitMargin(
    revenue: number,
    costs: number,
  ): { profitMargin: number; netProfit: number } {
    const netProfit = revenue - costs;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      netProfit: Math.round(netProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100,
    };
  }

  /**
   * Convert currency (placeholder - integrate with exchange rate API)
   */
  static async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    // TODO: Integrate with exchange rate API (e.g., exchangerate-api.com)
    // For now, return same amount if same currency
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Placeholder conversion rates (should be fetched from API)
    const rates: Record<string, number> = {
      EUR: 1.0,
      USD: 1.1,
      GBP: 0.85,
    };

    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;

    return Math.round((amount * (toRate / fromRate)) * 100) / 100;
  }

  /**
   * Calculate occupancy rate
   */
  static calculateOccupancyRate(
    bookedNights: number,
    totalAvailableNights: number,
  ): number {
    if (totalAvailableNights === 0) return 0;
    return Math.round((bookedNights / totalAvailableNights) * 100 * 100) / 100;
  }

  /**
   * Calculate average daily rate (ADR)
   */
  static calculateAverageDailyRate(
    totalRevenue: number,
    totalNights: number,
  ): number {
    if (totalNights === 0) return 0;
    return Math.round((totalRevenue / totalNights) * 100) / 100;
  }

  /**
   * Calculate revenue per available room (RevPAR)
   */
  static calculateRevPAR(
    totalRevenue: number,
    totalAvailableNights: number,
  ): number {
    if (totalAvailableNights === 0) return 0;
    return Math.round((totalRevenue / totalAvailableNights) * 100) / 100;
  }
}

