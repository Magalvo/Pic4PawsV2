export type PaymentReferenceInput = {
  donationId: string;
  amountCents: number;
  currency: 'EUR';
  shelterId: string;
  orderId: string;
  paymentMethod: 'mb_way' | 'multibanco';
  mbWayPhone?: string | null;
};

export type PaymentReference =
  | { method: 'mb_way'; phone: string; expiresAt: string | null }
  | { method: 'multibanco'; entity: string; reference: string; expiresAt: string | null }
  | { method: 'bank_transfer'; iban: string };

export type PaymentReferenceResult =
  | { ok: true; reference: PaymentReference; providerPaymentId: string }
  | { ok: false; reason: 'psp_error' | 'psp_timeout' | 'invalid_response' };

export type PaymentReferenceFactory = {
  createReference(input: PaymentReferenceInput): Promise<PaymentReferenceResult>;
};
