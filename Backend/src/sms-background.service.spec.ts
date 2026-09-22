import { Test, TestingModule } from '@nestjs/testing';
import { SmsBackgroundService } from './sms-background.service';
import { NotificationsService } from './notifications/notifications.service';

describe('SmsBackgroundService', () => {
  let service: SmsBackgroundService;
  let notifications: { retryFailedNotifications: jest.Mock };

  beforeEach(async () => {
    notifications = { retryFailedNotifications: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsBackgroundService,
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get<SmsBackgroundService>(SmsBackgroundService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call retryFailedNotifications on cron', async () => {
    await service.retryFailedSms();
    expect(notifications.retryFailedNotifications).toHaveBeenCalled();
  });
});