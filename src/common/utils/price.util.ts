export const formatPrice = (price: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price);
};

export const calculateTotalPrice = (
  basePrice: number,
  cleaningFee: number = 0,
  serviceFee: number = 0,
  taxes: number = 0,
  nights: number = 1,
): number => {
  return basePrice * nights + cleaningFee + serviceFee + taxes;
};

