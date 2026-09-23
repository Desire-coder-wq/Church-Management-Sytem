import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PaymentsService } from './payments.service';

describe('PaymentsService merchant isolation', () => {
  it('does not create a payment link for a church outside the configured merchant account', async () => {
    const db = { $transaction: jest.fn() };
    const config = { get: (key: string) => ({ PESAPAL_CHURCH_ID: 'church-a', PESAPAL_CONSUMER_KEY: 'key', PESAPAL_CONSUMER_SECRET: 'secret' })[key] };
    const service = new PaymentsService(db as never, config as ConfigService, {} as never, {} as never);
    await expect(service.createLink({ sub: 'admin-b', churchId: 'church-b', role: 'ADMIN' }, 'pledge-b', 1000)).rejects.toThrow('not connected for this church');
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

describe('PaymentsService verified reconciliation', () => {
  function setup(amountFromProvider = 50000) {
    const collections: any[] = [];
    const request = {
      id: 'payment-1', churchId: 'church-a', pledgeId: 'pledge-1', createdById: 'admin-a',
      merchantReference: 'CPM-123', trackingId: 'tracking-1', amount: new Prisma.Decimal(50000), status: 'CHECKOUT',
    };
    const pledge = { id: 'pledge-1', amount: new Prisma.Decimal(100000), dueDate: new Date(Date.now() + 86400000), collections };
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'pledge-1' }]),
      paymentRequest: {
        findUniqueOrThrow: jest.fn(async () => request),
        update: jest.fn(async ({ data }: any) => Object.assign(request, data)),
      },
      collection: {
        findMany: jest.fn(async () => collections.filter((row) => !row.reversedAt)),
        findUnique: jest.fn(async ({ where }: any) => collections.find((row) => row.gatewayTrackingId === where.gatewayTrackingId) ?? null),
        create: jest.fn(async ({ data }: any) => { const row = { ...data, id: 'collection-1', reversedAt: null }; collections.push(row); return row; }),
        update: jest.fn(async ({ data }: any) => Object.assign(collections[0], data)),
      },
      pledge: {
        findUniqueOrThrow: jest.fn(async () => pledge),
        update: jest.fn(),
      },
    };
    const db = {
      paymentRequest: { findUnique: jest.fn(async () => request) },
      pledge: { findUniqueOrThrow: jest.fn(async () => ({ member: { id: 'member-1', phone: '+256700000000' }, campaign: { name: 'Building fund' } })) },
      $transaction: jest.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    const config = { get: (key: string) => ({ PESAPAL_CHURCH_ID: 'church-a', PESAPAL_CONSUMER_KEY: 'key', PESAPAL_CONSUMER_SECRET: 'secret' })[key] };
    const pesapal = { getStatus: jest.fn(async () => ({ merchant_reference: 'CPM-123', currency: 'UGX', amount: amountFromProvider, status_code: 1, payment_method: 'MTN Mobile Money', confirmation_code: 'CONF-123' })) };
    const notifications = { sendPaymentReceivedNotification: jest.fn().mockResolvedValue(undefined), sendFullyPaidNotification: jest.fn().mockResolvedValue(undefined) };
    const service = new PaymentsService(db as never, config as ConfigService, pesapal as never, notifications as never);
    return { service, db, tx, pesapal, notifications, collections };
  }

  it('records a confirmed payment once and preserves the method returned by Pesapal', async () => {
    const { service, tx, notifications, collections } = setup();
    await expect(service.reconcile('CPM-123', 'tracking-1')).resolves.toEqual({ status: 'COMPLETED' });
    await expect(service.reconcile('CPM-123', 'tracking-1')).resolves.toEqual({ status: 'COMPLETED' });
    expect(tx.collection.create).toHaveBeenCalledTimes(1);
    expect(collections[0].method).toBe('MOBILE_MONEY');
    expect(collections[0].gatewayMethod).toBe('MTN Mobile Money');
    expect(notifications.sendPaymentReceivedNotification).toHaveBeenCalledTimes(1);
  });

  it('does not write a collection if Pesapal reports a different amount', async () => {
    const { service, db, tx } = setup(1000);
    await expect(service.reconcile('CPM-123', 'tracking-1')).rejects.toThrow('does not match');
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(tx.collection.create).not.toHaveBeenCalled();
  });
});
