import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const PESAPAL_API = 'https://pay.pesapal.com/v3/api';

type TokenResponse = { token?: string; expiryDate?: string };
type IpnRecord = { url?: string; ipn_id?: string };
export type PesapalOrder = {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
};
export type PesapalStatus = {
  status_code: number;
  merchant_reference: string;
  amount: number;
  currency: string;
  payment_method?: string;
  confirmation_code?: string;
  created_date?: string;
};

@Injectable()
export class PesapalClient {
  private cachedToken?: { value: string; expiresAt: number };
  private cachedIpnId?: string;

  constructor(private readonly config: ConfigService) {}

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${PESAPAL_API}${path}`, {
        ...init,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init.headers },
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new BadGatewayException('Pesapal is not responding. Please try again shortly');
    }
    if (!response.ok) throw new BadGatewayException('Pesapal could not process this request');
    try {
      const body = await response.json() as T & { error?: unknown };
      if (body && !Array.isArray(body) && body.error) {
        throw new BadGatewayException('Pesapal rejected this request');
      }
      return body;
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      throw new BadGatewayException('Pesapal returned an invalid response');
    }
  }

  private async token(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 15_000) return this.cachedToken.value;
    const consumer_key = this.config.get<string>('PESAPAL_CONSUMER_KEY');
    const consumer_secret = this.config.get<string>('PESAPAL_CONSUMER_SECRET');
    if (!consumer_key || !consumer_secret) {
      throw new ServiceUnavailableException('Pesapal is not configured for live payments');
    }
    const data = await this.request<TokenResponse>('/Auth/RequestToken', {
      method: 'POST', body: JSON.stringify({ consumer_key, consumer_secret }),
    });
    if (!data.token) throw new BadGatewayException('Pesapal authentication failed');
    const expiration = Date.parse(data.expiryDate ?? '');
    this.cachedToken = {
      value: data.token,
      expiresAt: Number.isFinite(expiration) ? expiration : Date.now() + 4 * 60_000,
    };
    return data.token;
  }

  private async authorized<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.token();
    return this.request<T>(path, {
      ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers },
    });
  }

  async notificationId(ipnUrl: string): Promise<string> {
    const configured = this.config.get<string>('PESAPAL_IPN_ID');
    if (configured) return configured;
    if (this.cachedIpnId) return this.cachedIpnId;
    const existing = await this.authorized<IpnRecord[]>('/URLSetup/GetIpnList');
    const match = Array.isArray(existing) ? existing.find(row => row.url === ipnUrl && row.ipn_id) : undefined;
    if (match?.ipn_id) return this.cachedIpnId = match.ipn_id;
    const created = await this.authorized<IpnRecord>('/URLSetup/RegisterIPN', {
      method: 'POST', body: JSON.stringify({ url: ipnUrl, ipn_notification_type: 'GET' }),
    });
    if (!created.ipn_id) throw new BadGatewayException('Pesapal could not register the payment notification URL');
    return this.cachedIpnId = created.ipn_id;
  }

  async submitOrder(input: {
    reference: string; amount: number; description: string; phone: string;
    firstName: string; lastName: string; callbackUrl: string; ipnUrl: string;
  }): Promise<PesapalOrder> {
    const notification_id = await this.notificationId(input.ipnUrl);
    const order = await this.authorized<PesapalOrder>('/Transactions/SubmitOrderRequest', {
      method: 'POST',
      body: JSON.stringify({
        id: input.reference, currency: 'UGX', amount: input.amount,
        description: input.description.slice(0, 100), callback_url: input.callbackUrl,
        notification_id,
        billing_address: {
          phone_number: input.phone, country_code: 'UG',
          first_name: input.firstName, last_name: input.lastName,
        },
      }),
    });
    if (!order.order_tracking_id || order.merchant_reference !== input.reference || !order.redirect_url) {
      throw new BadGatewayException('Pesapal did not return a valid checkout link');
    }
    const checkout = new URL(order.redirect_url);
    if (checkout.protocol !== 'https:' || !(checkout.hostname === 'pesapal.com' || checkout.hostname.endsWith('.pesapal.com'))) {
      throw new BadGatewayException('Pesapal returned an unexpected checkout address');
    }
    return order;
  }

  getStatus(trackingId: string): Promise<PesapalStatus> {
    return this.authorized<PesapalStatus>(`/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(trackingId)}`);
  }
}
