export const PROFIT_MARGIN = 10; // TIMES 10 - your request
export const MIN_PROFIT = 0;

export function applyProfit(costPriceNaira: number): number {
  // Round to nice numbers like 2400, 2500
  const raw = costPriceNaira * PROFIT_MARGIN;
  return Math.ceil(raw / 100) * 100; // round up to nearest ₦100
}

// Example:
// 5sim ₦240 x 10 = ₦2400 -> sells ₦2400
// 5sim ₦180 x 10 = ₦1800 -> sells ₦1800
// 5sim ₦350 x 10 = ₦3500 -> sells ₦3500
