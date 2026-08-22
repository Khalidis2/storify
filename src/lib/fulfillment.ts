export const FULFILLMENT_MODES = ["PICKUP", "DELIVERY"] as const;
export type FulfillmentMode = (typeof FULFILLMENT_MODES)[number];

export function isFulfillmentMode(value: string): value is FulfillmentMode {
  return FULFILLMENT_MODES.includes(value as FulfillmentMode);
}

export function effectiveShippingFee(mode: FulfillmentMode, feeCents: number) {
  return mode === "DELIVERY" ? feeCents : 0;
}
