import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { SmsType, SmsStatus, Prisma } from "@prisma/client";

interface SmsProvider {
  send(phone: string, message: string): Promise<{ providerId: string }>;
}

class MockSmsProvider implements SmsProvider {
  async send(phone: string, message: string) {
    Logger.log(`[MOCK SMS] To: ${phone} | Message: ${message}`);
    return { providerId: `mock-${Date.now()}` };
  }
}

class TwilioSmsProvider implements SmsProvider {
  private client: any;

  constructor(private config: ConfigService) {
    const accountSid = config.get<string>("TWILIO_ACCOUNT_SID");
    const authToken = config.get<string>("TWILIO_AUTH_TOKEN");
    if (accountSid && authToken) {
      const twilio = require("twilio");
      this.client = twilio(accountSid, authToken);
    }
  }

  async send(phone: string, message: string) {
    if (!this.client) {
      throw new Error(
        "Twilio client not initialized. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.",
      );
    }
    const fromNumber = this.config.get<string>("TWILIO_FROM_NUMBER");
    const result = await this.client.messages.create({
      body: message,
      from: fromNumber,
      to: phone,
    });
    return { providerId: result.sid };
  }
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private provider: SmsProvider;
  private readonly smsRateLimit = new Map<
    string,
    { count: number; resetAt: number }
  >();

  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
  ) {
    const provider = config.get<string>("SMS_PROVIDER") || "mock";
    this.provider =
      provider === "twilio"
        ? new TwilioSmsProvider(config)
        : new MockSmsProvider();
  }

  private checkSmsRateLimit(phone: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxPerHour = 10;

    const record = this.smsRateLimit.get(phone);
    if (!record || record.resetAt < now) {
      this.smsRateLimit.set(phone, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (record.count >= maxPerHour) {
      return false;
    }
    record.count++;
    return true;
  }

  async sendSms(
    memberId: string,
    phone: string,
    message: string,
    type: SmsType,
  ): Promise<void> {
    if (!this.checkSmsRateLimit(phone)) {
      await this.db.smsNotification.create({
        data: {
          memberId,
          phone,
          message,
          type,
          status: "FAILED",
          failureReason: "Rate limit exceeded (max 10 SMS/hour)",
        },
      });
      throw new Error("SMS rate limit exceeded for this phone number.");
    }

    const notification = await this.db.smsNotification.create({
      data: { memberId, phone, message, type, status: "PENDING" },
    });

    try {
      const result = await this.provider.send(phone, message);
      await this.db.smsNotification.update({
        where: { id: notification.id },
        data: {
          status: "SENT",
          providerId: result.providerId,
          sentAt: new Date(),
        },
      });
      this.logger.log(`SMS sent to ${phone} (${type})`);
    } catch (error) {
      await this.db.smsNotification.update({
        where: { id: notification.id },
        data: {
          status: "FAILED",
          failureReason:
            error instanceof Error ? error.message : "Unknown error",
          retryCount: { increment: 1 },
        },
      });
      this.logger.error(
        `SMS failed to ${phone}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  async sendPledgeCreatedNotification(
    memberId: string,
    phone: string,
    campaignName: string,
    amount: number,
    dueDate: Date,
  ) {
    const message = `Your pledge of UGX ${amount.toLocaleString()} for "${campaignName}" has been recorded. Due by ${dueDate.toISOString().slice(0, 10)}. Thank you for your generosity.`;
    return this.sendSms(memberId, phone, message, "PLEDGE_CREATED");
  }

  async sendPaymentReceivedNotification(
    memberId: string,
    phone: string,
    campaignName: string,
    amount: number,
    balance: number,
  ) {
    const message = `Payment of UGX ${amount.toLocaleString()} received for "${campaignName}". Remaining balance: UGX ${balance.toLocaleString()}. Thank you!`;
    return this.sendSms(memberId, phone, message, "PAYMENT_RECEIVED");
  }

  async sendPaymentReminderNotification(
    memberId: string,
    phone: string,
    campaignName: string,
    balance: number,
    dueDate: Date,
  ) {
    const message = `Reminder: Your pledge for "${campaignName}" has a balance of UGX ${balance.toLocaleString()} due by ${dueDate.toISOString().slice(0, 10)}. Please complete your payment.`;
    return this.sendSms(memberId, phone, message, "PAYMENT_REMINDER");
  }

  async sendFullyPaidNotification(
    memberId: string,
    phone: string,
    campaignName: string,
  ) {
    const message = `Congratulations! Your pledge for "${campaignName}" is now fully paid. Thank you for your faithful giving.`;
    return this.sendSms(memberId, phone, message, "FULLY_PAID");
  }

  async getNotifications(churchId: string) {
    return this.db.smsNotification.findMany({
      where: { member: { churchId } },
      include: { member: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async retryFailedNotifications() {
    const failed = await this.db.smsNotification.findMany({
      where: { status: "FAILED", retryCount: { lt: 3 } },
      include: { member: true },
    });

    for (const notification of failed) {
      try {
        await this.provider.send(notification.phone, notification.message);
        await this.db.smsNotification.update({
          where: { id: notification.id },
          data: { status: "SENT", sentAt: new Date() },
        });
      } catch (error) {
        await this.db.smsNotification.update({
          where: { id: notification.id },
          data: {
            failureReason:
              error instanceof Error ? error.message : "Retry failed",
            retryCount: { increment: 1 },
          },
        });
      }
    }
  }
}
