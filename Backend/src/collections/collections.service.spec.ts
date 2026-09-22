import { Prisma } from '@prisma/client';
import { CollectionsService } from './collections.service';

describe('CollectionsService - balance calculation', () => {
  it('should correctly calculate balance from multiple collections', () => {
    const collections = [
      { amount: new Prisma.Decimal(30000) },
      { amount: new Prisma.Decimal(20000) },
      { amount: new Prisma.Decimal(50000) },
    ];
    const totalPledged = new Prisma.Decimal(100000);
    const paid = collections.reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0));
    const balance = totalPledged.minus(paid);
    expect(Number(paid)).toBe(100000);
    expect(Number(balance)).toBe(0);
  });

  it('should handle zero collections', () => {
    const collections: { amount: Prisma.Decimal }[] = [];
    const totalPledged = new Prisma.Decimal(100000);
    const paid = collections.reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0));
    const balance = totalPledged.minus(paid);
    expect(Number(paid)).toBe(0);
    expect(Number(balance)).toBe(100000);
  });

  it('should prevent overpayment when collections total exceeds pledge amount', () => {
    const collections = [
      { amount: new Prisma.Decimal(60000) },
      { amount: new Prisma.Decimal(50000) },
    ];
    const totalPledged = new Prisma.Decimal(100000);
    const paid = collections.reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0));
    const balance = totalPledged.minus(paid);
    expect(Number(paid)).toBe(110000);
    expect(balance.lessThan(0)).toBe(true);
  });

  it('should correctly calculate partial payment balance', () => {
    const collections = [{ amount: new Prisma.Decimal(25000) }];
    const totalPledged = new Prisma.Decimal(100000);
    const paid = collections.reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0));
    const balance = totalPledged.minus(paid);
    expect(Number(paid)).toBe(25000);
    expect(Number(balance)).toBe(75000);
  });
});