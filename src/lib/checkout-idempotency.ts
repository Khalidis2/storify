export function checkoutIdempotencyKey(orderId: string) {
  return `checkout-session:${orderId}`;
}
