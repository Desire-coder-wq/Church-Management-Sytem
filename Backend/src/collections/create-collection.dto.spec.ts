import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateCollectionDto } from './create-collection.dto';
import { PaymentMethod } from '@prisma/client';

describe('CreateCollectionDto validation', () => {
  it('should pass for valid collection data', async () => {
    const dto = plainToInstance(CreateCollectionDto, {
      pledgeId: 'pledge-1',
      amount: 50000,
      paymentDate: '2025-06-15',
      method: PaymentMethod.CASH,
      referenceNumber: 'TXN-001',
      idempotencyKey: crypto.randomUUID(),
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when pledgeId is undefined', async () => {
    const dto = plainToInstance(CreateCollectionDto, {
      pledgeId: undefined,
      amount: 50000,
      paymentDate: '2025-06-15',
      method: PaymentMethod.CASH,
      idempotencyKey: crypto.randomUUID(),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('pledgeId');
  });

  it('should fail when amount is zero', async () => {
    const dto = plainToInstance(CreateCollectionDto, {
      pledgeId: 'pledge-1',
      amount: 0,
      paymentDate: '2025-06-15',
      method: PaymentMethod.CASH,
      idempotencyKey: crypto.randomUUID(),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('amount');
  });

  it('should fail when method is invalid', async () => {
    const dto = plainToInstance(CreateCollectionDto, {
      pledgeId: 'pledge-1',
      amount: 50000,
      paymentDate: '2025-06-15',
      method: 'INVALID' as any,
      idempotencyKey: crypto.randomUUID(),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when idempotencyKey is missing', async () => {
    const dto = plainToInstance(CreateCollectionDto, {
      pledgeId: 'pledge-1',
      amount: 50000,
      paymentDate: '2025-06-15',
      method: PaymentMethod.CASH,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('idempotencyKey');
  });

  it('should accept all payment methods', async () => {
    for (const method of Object.values(PaymentMethod)) {
      const dto = plainToInstance(CreateCollectionDto, {
        pledgeId: 'pledge-1',
        amount: 50000,
        paymentDate: '2025-06-15',
        method,
        idempotencyKey: crypto.randomUUID(),
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });
});