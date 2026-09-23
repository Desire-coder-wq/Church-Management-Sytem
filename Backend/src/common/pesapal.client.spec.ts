import { ConfigService } from '@nestjs/config';
import { PesapalClient } from './pesapal.client';

describe('PesapalClient live API contract', () => {
  const originalFetch = global.fetch;
  const config = { get: (key: string) => ({ PESAPAL_CONSUMER_KEY: 'key', PESAPAL_CONSUMER_SECRET: 'secret', PESAPAL_IPN_ID: 'ipn-1' })[key] } as ConfigService;
  afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

  it('uses the live host and submits an order without putting credentials in its URL', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    global.fetch = jest.fn(async (url: string | URL | Request, init: RequestInit) => {
      calls.push({ url: String(url), init });
      const data = calls.length === 1 ? { token: 'access', expiryDate: new Date(Date.now() + 120000).toISOString() }
        : { order_tracking_id: 'tracking', merchant_reference: 'CPM-123', redirect_url: 'https://pay.pesapal.com/checkout/123' };
      return { ok: true, json: async () => data } as Response;
    }) as typeof fetch;
    const client = new PesapalClient(config);
    const order = await client.submitOrder({ reference: 'CPM-123', amount: 50000, description: 'Pledge', phone: '+256700000000', firstName: 'A', lastName: 'B', callbackUrl: 'https://example.com/api/payments/callback', ipnUrl: 'https://example.com/api/payments/ipn' });
    expect(order.order_tracking_id).toBe('tracking');
    expect(calls[0].url).toBe('https://pay.pesapal.com/v3/api/Auth/RequestToken');
    expect(calls[1].url).toBe('https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest');
    expect(JSON.parse(String(calls[1].init.body)).notification_id).toBe('ipn-1');
    expect(calls[1].url).not.toContain('secret');
  });

  it('rejects a checkout address outside Pesapal', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({
      token: 'access', order_tracking_id: 'tracking', merchant_reference: 'CPM-123', redirect_url: 'https://example.com/checkout',
    }) } as Response)) as typeof fetch;
    const client = new PesapalClient(config);
    await expect(client.submitOrder({ reference: 'CPM-123', amount: 1, description: 'Pledge', phone: '+256700000000', firstName: 'A', lastName: 'B', callbackUrl: 'https://example.com/callback', ipnUrl: 'https://example.com/ipn' })).rejects.toThrow('unexpected checkout address');
  });
});
