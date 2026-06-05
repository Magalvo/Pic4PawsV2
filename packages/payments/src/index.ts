import type { PaymentProvider } from '@pic4paws/domain';

export const primaryPaymentProvider: PaymentProvider = 'eupago';
export const paymentWebhookPath = '/webhooks/payments' as const;

export * from './donations';
export * from './webhooks';
