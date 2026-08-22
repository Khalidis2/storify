export const ORDER_FULFILLMENT_STATUSES = [
  "UNFULFILLED",
  "PROCESSING",
  "FULFILLED",
] as const;

export type OrderFulfillmentStatus =
  (typeof ORDER_FULFILLMENT_STATUSES)[number];

export function isOrderFulfillmentStatus(
  value: string
): value is OrderFulfillmentStatus {
  return ORDER_FULFILLMENT_STATUSES.includes(
    value as OrderFulfillmentStatus
  );
}
