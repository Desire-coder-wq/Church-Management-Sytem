import { Prisma } from '@prisma/client';
import { summarizePledge, PledgeRecord } from './pledges.service';

function makePledge(overrides: Partial<PledgeRecord> = {}): PledgeRecord {
  const base = {
    id: 'pledge-1',
    memberId: 'member-1',
    campaignId: 'campaign-1',
    amount: new Prisma.Decimal(100000),
    dueDate: new Date('2026-01-01'),
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    member: {
      id: 'member-1',
      churchId: 'church-1',
      fullName: 'John Doe',
      phone: '+256700000000',
      groupId: 'group-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      group: { id: 'group-1', churchId: 'church-1', name: 'Group A', description: null, createdAt: new Date(), updatedAt: new Date() },
    },
    campaign: {
      id: 'campaign-1',
      churchId: 'church-1',
      name: 'Building Fund',
      description: 'Church building project',
      targetAmount: new Prisma.Decimal(500000000),
      startDate: new Date('2025-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    collections: [],
  };
  return { ...base, ...overrides };
}

describe('summarizePledge', () => {
  it('should return PAID status when fully paid', () => {
    const pledge = makePledge({
      amount: new Prisma.Decimal(100000),
      collections: [{ amount: new Prisma.Decimal(50000) } as any, { amount: new Prisma.Decimal(50000) } as any],
    });
    const result = summarizePledge(pledge);
    expect(result.paid).toBe(100000);
    expect(result.balance).toBe(0);
    expect(result.status).toBe('PAID');
  });

  it('should return PARTIALLY_PAID status when partially paid and due date is in future', () => {
    const pledge = makePledge({
      amount: new Prisma.Decimal(100000),
      dueDate: new Date('2099-01-01'),
      collections: [{ amount: new Prisma.Decimal(30000) } as any],
    });
    const result = summarizePledge(pledge);
    expect(result.paid).toBe(30000);
    expect(result.balance).toBe(70000);
    expect(result.status).toBe('PARTIALLY_PAID');
  });

  it('should return OVERDUE status when balance remains and due date has passed', () => {
    const pledge = makePledge({
      amount: new Prisma.Decimal(100000),
      dueDate: new Date('2020-01-01'),
      collections: [{ amount: new Prisma.Decimal(30000) } as any],
    });
    const result = summarizePledge(pledge);
    expect(result.status).toBe('OVERDUE');
  });

  it('should return OVERDUE status when balance remains and due date has passed even if not paid', () => {
    const pledge = makePledge({
      amount: new Prisma.Decimal(100000),
      dueDate: new Date('2020-01-01'),
      collections: [],
    });
    const result = summarizePledge(pledge);
    expect(result.paid).toBe(0);
    expect(result.balance).toBe(100000);
    expect(result.status).toBe('OVERDUE');
  });

  it('should return PENDING status when no payments made and due date is in future', () => {
    const pledge = makePledge({
      amount: new Prisma.Decimal(100000),
      dueDate: new Date('2099-01-01'),
      collections: [],
    });
    const result = summarizePledge(pledge);
    expect(result.paid).toBe(0);
    expect(result.balance).toBe(100000);
    expect(result.status).toBe('PENDING');
  });

  it('should return PARTIALLY_PAID when paid equals amount but not fully', () => {
    const pledge = makePledge({
      amount: new Prisma.Decimal(100000),
      dueDate: new Date('2099-01-01'),
      collections: [{ amount: new Prisma.Decimal(50000) } as any],
    });
    const result = summarizePledge(pledge);
    expect(result.paid).toBe(50000);
    expect(result.balance).toBe(50000);
    expect(result.status).toBe('PARTIALLY_PAID');
  });
});