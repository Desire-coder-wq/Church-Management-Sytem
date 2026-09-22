import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CampaignDto } from './campaign.dto';
import { CampaignStatus } from '@prisma/client';

describe('CampaignDto validation', () => {
  it('should pass for valid campaign data', async () => {
    const dto = plainToInstance(CampaignDto, {
      name: 'Building Fund',
      description: 'Church building project',
      targetAmount: 5000000,
      startDate: '2025-01-01',
      endDate: '2026-12-31',
      status: 'ACTIVE',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when name is too short', async () => {
    const dto = plainToInstance(CampaignDto, {
      name: 'Ab',
      targetAmount: 5000000,
      startDate: '2025-01-01',
      endDate: '2026-12-31',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should fail when targetAmount is zero or negative', async () => {
    const dto = plainToInstance(CampaignDto, {
      name: 'Building Fund',
      targetAmount: 0,
      startDate: '2025-01-01',
      endDate: '2026-12-31',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('targetAmount');
  });

  it('should fail when startDate is not a valid date', async () => {
    const dto = plainToInstance(CampaignDto, {
      name: 'Building Fund',
      targetAmount: 5000000,
      startDate: 'invalid-date',
      endDate: '2026-12-31',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('startDate');
  });

  it('should fail when endDate is missing', async () => {
    const dto = plainToInstance(CampaignDto, {
      name: 'Building Fund',
      targetAmount: 5000000,
      startDate: '2025-01-01',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'endDate')).toBe(true);
  });
});