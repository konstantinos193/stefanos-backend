export class CreatePricingRuleDto {
  startDate: string;
  endDate: string;
  priceOverride?: number;
  isAvailable?: boolean;
  reason?: string;
  minStayOverride?: number;
}

export class UpdatePricingRuleDto {
  startDate?: string;
  endDate?: string;
  priceOverride?: number;
  isAvailable?: boolean;
  reason?: string;
  minStayOverride?: number;
}