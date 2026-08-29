import assert from "node:assert/strict";
import test from "node:test";
import { getReservationDecision } from "@/lib/reservation-reconciliation";

test("finalizes paid sessions even before Stripe closes them", () => {
  assert.equal(getReservationDecision("open", "paid"), "finalize");
  assert.equal(getReservationDecision("complete", "paid"), "finalize");
});

test("releases only expired unpaid sessions", () => {
  assert.equal(getReservationDecision("expired", "unpaid"), "release");
});

test("waits for open or incomplete unpaid sessions", () => {
  assert.equal(getReservationDecision("open", "unpaid"), "wait");
  assert.equal(getReservationDecision(null, "unpaid"), "wait");
});
