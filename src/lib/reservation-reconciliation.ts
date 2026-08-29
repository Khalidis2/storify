export type ReservationDecision = "finalize" | "release" | "wait";

export function getReservationDecision(
  status: string | null,
  paymentStatus: string
): ReservationDecision {
  if (paymentStatus === "paid") return "finalize";
  if (status === "expired") return "release";
  return "wait";
}
