import { BadGatewayException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
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
  private readonly logger = new Logger(PesapalClient.name);
  private cachedToken?: { value: string; expiresAt: number };
  private cachedIpnId?: string;

  constructor(private readonly config: ConfigService) {}

  private operation(path: string): string {
    if (path.startsWith('/Auth/')) return 'authentication';
    if (path.endsWith('/GetIpnList')) return 'notification URL lookup';
    if (path.endsWith('/RegisterIPN')) return 'notification URL registration';
    if (path.endsWith('/SubmitOrderRequest')) return 'order creation';
    return 'transaction status check';
  }

  private providerMessage(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    let message = value.slice(0, 220);
    for (const key of ['PESAPAL_CONSUMER_KEY', 'PESAPAL_CONSUMER_SECRET']) {
      const secret = this.config.get<string>(key);
      if (secret) message = message.replaceAll(secret, '[redacted]');
    }
    return message.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]')
      .replace(/\+?\d[\d\s-]{8,}\d/g, '[number]');
  }

  private rejected(path: string, status: number, body: unknown): never {
    const payload = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown> : {};
    const detail = payload.error && typeof payload.error === 'object' && !Array.isArray(payload.error)
      ? payload.error as Record<string, unknown> : {};
    const code = typeof detail.code === 'string' && /^[\w-]{1,40}$/.test(detail.code)
      ? detail.code : undefined;
    const type = typeof detail.error_type === 'string' && /^[\w-]{1,40}$/.test(detail.error_type)
      ? detail.error_type : undefined;
    const reason = this.providerMessage(detail.message ?? payload.message);
    const stage = this.operation(path);
    this.logger.warn(`Pesapal ${stage} rejected: HTTP ${status}, code ${code ?? 'none'}, type ${type ?? 'none'}, reason ${reason ?? 'not provided'}`);
    throw new BadGatewayException(`Pesapal ${stage} was rejected${code ? ` (${code})` : ` (HTTP ${status})`}. Check the backend payment logs for details`);
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${PESAPAL_API}${path}`, {
        ...init,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init.headers },
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new BadGatewayException(`Pesapal ${this.operation(path)} is not responding. Please try again shortly`);
    }
    let body: T & { error?: unknown };
    try {
      body = await response.json() as T & { error?: unknown };
    } catch {
      this.logger.warn(`Pesapal ${this.operation(path)} returned invalid JSON: HTTP ${response.status}`);
      throw new BadGatewayException('Pesapal returned an invalid response');
    }
    const providerError = body && !Array.isArray(body) ? body.error : undefined;
    const hasProviderError = typeof providerError === 'string' && providerError.trim().length > 0
      || Boolean(providerError && typeof providerError === 'object'
        && Object.values(providerError).some(value => value !== null && value !== undefined && value !== ''));
    const providerStatus = body && !Array.isArray(body) && 'status' in body
      ? String(body.status) : undefined;
    if (!response.ok || hasProviderError || providerStatus && providerStatus !== '200') {
      this.rejected(path, response.status, body);
    }
    return body;
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
