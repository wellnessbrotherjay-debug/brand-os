"use client";

export type PosChargeRequest = {
  amount: number;
  currency: "usd" | "eur";
  description: string;
  venueId: string;
};

export type PosChargeResponse = {
  status: "succeeded" | "pending";
  receiptUrl: string;
};

export type PayoutSummary = {
  id: string;
  amount: number;
  currency: "usd" | "eur";
  status: "paid" | "pending";
  arrivalDate: string;
};

export async function createPosCharge(request: PosChargeRequest): Promise<PosChargeResponse> {
  console.info("Stripe POS placeholder charge", request);
  return {
    status: "succeeded",
    receiptUrl: "https://dashboard.stripe.com/test/charges/mock",
  };
}

export async function listVenuePayouts(venueId: string | null): Promise<PayoutSummary[]> {
  console.info("Stripe placeholder payouts for venue", venueId ?? "master");
  return [
    {
      id: "po_1",
      amount: 845000,
      currency: "usd",
      status: "paid",
      arrivalDate: new Date().toISOString(),
    },
    {
      id: "po_2",
      amount: 667000,
      currency: "usd",
      status: "paid",
      arrivalDate: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
  ];
}
