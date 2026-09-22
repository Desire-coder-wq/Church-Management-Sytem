import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: { smsNotification: { create: jest.Mock; findMany: jest.Mock; update: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      smsNotification: {
        create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SMS_PROVIDER') return 'mock';
              if (key === 'TWILIO_ACCOUNT_SID') return '';
              return null;
            }),
            getOrThrow: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('sendSms', () => {
    it('should send SMS successfully in mock mode', async () => {
      await expect(
        service.sendSms('member-1', '+256700000000', 'Test message', 'PAYMENT_REMINDER'),
      ).resolves.not.toThrow();
      expect(prisma.smsNotification.create).toHaveBeenCalledTimes(1);
      expect(prisma.smsNotification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '+256700000000',
            message: 'Test message',
            type: 'PAYMENT_REMINDER',
            status: 'PENDING',
          }),
        }),
      );
      expect(prisma.smsNotification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-1' },
          data: expect.objectContaining({ status: 'SENT' }),
        }),
      );
    });

    it('should enforce rate limiting (max 10 SMS/hour per phone)', async () => {
      for (let i = 0; i < 10; i++) {
        await expect(
          service.sendSms('member-1', '+256700000000', 'Test message', 'PAYMENT_REMINDER'),
        ).resolves.not.toThrow();
      }
      await expect(
        service.sendSms('member-1', '+256700000000', 'Test message', 'PAYMENT_REMINDER'),
      ).rejects.toThrow('SMS rate limit exceeded');
    });

    it('should allow SMS to different phone numbers even when rate limit is reached', async () => {
      for (let i = 0; i < 10; i++) {
        await expect(
          service.sendSms('member-1', '+256700000000', 'Test message', 'PAYMENT_REMINDER'),
        ).resolves.not.toThrow();
      }
      await expect(
        service.sendSms('member-2', '+256711111111', 'Test message', 'PAYMENT_REMINDER'),
      ).resolves.not.toThrow();
    });
  });

  describe('getNotifications', () => {
    it('should return notifications for a church', async () => {
      const mockNotifications = [
        { id: 'notif-1', phone: '+256700000000', message: 'Test', status: 'SENT' },
      ];
      prisma.smsNotification.findMany.mockResolvedValue(mockNotifications);

      const result = await service.getNotifications('church-1');
      expect(result).toEqual(mockNotifications);
      expect(prisma.smsNotification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { member: { churchId: 'church-1' } },
        }),
      );
    });
  });

  describe('sendPledgeCreatedNotification', () => {
    it('should format pledge created message correctly', async () => {
      await service.sendPledgeCreatedNotification(
        'member-1',
        '+256700000000',
        'Building Fund',
        100000,
        new Date('2026-01-01'),
      );
      expect(prisma.smsNotification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'PLEDGE_CREATED',
            message: expect.stringContaining('UGX 100,000'),
          }),
        }),
      );
    });
  });

  describe('sendPaymentReceivedNotification', () => {
    it('should format payment received message correctly', async () => {
      await service.sendPaymentReceivedNotification(
        'member-1',
        '+256700000000',
        'Building Fund',
        50000,
        50000,
      );
      expect(prisma.smsNotification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'PAYMENT_RECEIVED',
            message: expect.stringContaining('UGX 50,000'),
          }),
        }),
      );
    });
  });

  describe('sendPaymentReminderNotification', () => {
    it('should format payment reminder message correctly', async () => {
      await service.sendPaymentReminderNotification(
        'member-1',
        '+256700000000',
        'Building Fund',
        75000,
        new Date('2026-01-01'),
      );
      expect(prisma.smsNotification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'PAYMENT_REMINDER',
            message: expect.stringContaining('UGX 75,000'),
          }),
        }),
      );
    });
  });

  describe('sendFullyPaidNotification', () => {
    it('should format fully paid message correctly', async () => {
      await service.sendFullyPaidNotification('member-1', '+256700000000', 'Building Fund');
      expect(prisma.smsNotification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'FULLY_PAID',
          }),
        }),
      );
    });
  });
});