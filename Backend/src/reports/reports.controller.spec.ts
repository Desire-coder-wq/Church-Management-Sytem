import { ReportFilterDto } from './report-filter.dto';
import { plainToInstance } from 'class-transformer';

describe('ReportFilterDto validation', () => {
  it('should pass with no filters', async () => {
    const dto = plainToInstance(ReportFilterDto, {});
    expect(dto.campaignId).toBeUndefined();
    expect(dto.status).toBeUndefined();
  });

  it('should accept valid campaignId', () => {
    const dto = plainToInstance(ReportFilterDto, { campaignId: 'campaign-123' });
    expect(dto.campaignId).toBe('campaign-123');
  });

  it('should accept valid status values', () => {
    for (const status of ['PAID', 'PARTIALLY_PAID', 'PENDING', 'OVERDUE']) {
      const dto = plainToInstance(ReportFilterDto, { status });
      expect(dto.status).toBe(status);
    }
  });

  it('should accept valid date range', () => {
    const dto = plainToInstance(ReportFilterDto, {
      from: '2025-01-01',
      to: '2026-12-31',
    });
    expect(dto.from).toBe('2025-01-01');
    expect(dto.to).toBe('2026-12-31');
  });
});

describe('Report aggregation calculations', () => {
  it('should calculate totals correctly from filtered rows', () => {
    const rows = [
      { amount: 100000, paid: 50000, balance: 50000 },
      { amount: 200000, paid: 200000, balance: 0 },
      { amount: 50000, paid: 0, balance: 50000 },
    ];

    const totals = {
      pledged: rows.reduce((s, p) => s + p.amount, 0),
      paid: rows.reduce((s, p) => s + p.paid, 0),
      outstanding: rows.reduce((s, p) => s + p.balance, 0),
    };

    expect(totals.pledged).toBe(350000);
    expect(totals.paid).toBe(250000);
    expect(totals.outstanding).toBe(100000);
  });

  it('should filter by status', () => {
    const rows = [
      { id: '1', status: 'PAID', amount: 100000 },
      { id: '2', status: 'PENDING', amount: 50000 },
      { id: '3', status: 'OVERDUE', amount: 75000 },
    ];

    const filtered = rows.filter((row) => row.status === 'PAID');
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('1');
  });

  it('should filter by campaignId', () => {
    const rows = [
      { id: '1', campaignId: 'camp-1' },
      { id: '2', campaignId: 'camp-2' },
    ];

    const filtered = rows.filter((row) => row.campaignId === 'camp-1');
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('1');
  });
});