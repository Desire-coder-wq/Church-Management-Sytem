import { PledgesService, PledgeRecord } from '../pledges/pledges.service';
import { summarizePledge } from '../pledges/pledges.service';
import { Prisma } from '@prisma/client';

describe('Dashboard aggregation', () => {
  function makePledge(amount: number, paid: number, dueDate: Date, status: string): PledgeRecord {
    const collections = paid > 0 ? [{ amount: new Prisma.Decimal(paid) } as any] : [];
    return {
      id: 'pledge-1',
      memberId: 'member-1',
      campaignId: 'campaign-1',
      amount: new Prisma.Decimal(amount),
      dueDate,
      status: status as any,
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
        group: { id: 'group-1', churchId: 'church-1', name: 'Youth', description: null, createdAt: new Date(), updatedAt: new Date() },
      },
      campaign: {
        id: 'campaign-1',
        churchId: 'church-1',
        name: 'Building Fund',
        description: '',
        targetAmount: new Prisma.Decimal(500000000),
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        status: 'ACTIVE' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      collections: collections as any,
    } as PledgeRecord;
  }

  describe('summary calculations', () => {
    it('should aggregate totals correctly across multiple pledges', () => {
      const pledges = [
        summarizePledge(makePledge(100000, 50000, new Date('2099-01-01'), 'PARTIALLY_PAID')),
        summarizePledge(makePledge(200000, 200000, new Date('2099-01-01'), 'PAID')),
        summarizePledge(makePledge(50000, 0, new Date('2020-01-01'), 'OVERDUE')),
      ];

      const pledged = pledges.reduce((s, p) => s + p.amount, 0);
      const paid = pledges.reduce((s, p) => s + p.paid, 0);
      const outstanding = pledged - paid;

      expect(pledged).toBe(350000);
      expect(paid).toBe(250000);
      expect(outstanding).toBe(100000);
    });

    it('should count upcoming pledges (balance > 0, due date in future)', () => {
      const pledges = [
        summarizePledge(makePledge(100000, 50000, new Date('2099-01-01'), 'PARTIALLY_PAID')),
        summarizePledge(makePledge(200000, 200000, new Date('2099-01-01'), 'PAID')),
        summarizePledge(makePledge(50000, 0, new Date('2020-01-01'), 'OVERDUE')),
      ];

      const upcoming = pledges.filter((row) => row.balance > 0 && row.dueDate >= new Date());
      expect(upcoming.length).toBe(1);
      expect(upcoming[0].status).toBe('PARTIALLY_PAID');
    });

    it('should identify overdue pledges', () => {
      const pledges = [
        summarizePledge(makePledge(100000, 50000, new Date('2099-01-01'), 'PARTIALLY_PAID')),
        summarizePledge(makePledge(50000, 0, new Date('2020-01-01'), 'OVERDUE')),
      ];

      const overdue = pledges.filter((row) => row.status === 'OVERDUE');
      expect(overdue.length).toBe(1);
    });

    it('should calculate recent collections from pledge data', () => {
      const pledges = [
        summarizePledge(
          makePledge(100000, 50000, new Date('2099-01-01'), 'PARTIALLY_PAID')
        ),
      ];

      const collections = pledges.flatMap((row) =>
        row.collections.map((collection: any) => ({
          ...collection,
          member: row.member,
          campaign: row.campaign,
        })),
      );

      expect(collections.length).toBe(1);
      expect(collections[0].member.fullName).toBe('John Doe');
      expect(collections[0].campaign.name).toBe('Building Fund');
    });
  });
});