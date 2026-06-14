import { describe, expect, it } from 'vitest';
import { processPaymentWebhookEventRpcSql } from '../../packages/database/src/index';

describe('payment webhook RPC SQL', () => {
  it('defines an atomic service-role-only payment webhook transition', () => {
    expect(processPaymentWebhookEventRpcSql).toContain(
      'create or replace function public.process_payment_webhook_event',
    );
    expect(processPaymentWebhookEventRpcSql).toContain('security definer');
    expect(processPaymentWebhookEventRpcSql).toContain('to service_role');
    expect(processPaymentWebhookEventRpcSql).toContain('from public, anon, authenticated');
  });

  it('updates financial timestamps, processed_at and raw provider event ids', () => {
    expect(processPaymentWebhookEventRpcSql).toContain('raw_provider_event_ids = v_updated_event_ids');
    expect(processPaymentWebhookEventRpcSql).toContain("paid_at = case when p_new_status = 'paid'");
    expect(processPaymentWebhookEventRpcSql).toContain("refunded_at = case when p_new_status = 'refunded'");
    expect(processPaymentWebhookEventRpcSql).toContain('processed_at = p_received_at');
    expect(processPaymentWebhookEventRpcSql).toContain('updated_at = p_received_at');
    expect(processPaymentWebhookEventRpcSql).not.toContain('updated_at = p_provider_event_id');
  });
});
