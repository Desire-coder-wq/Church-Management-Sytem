import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod, Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { Session } from '../common/session';
import { PesapalClient } from '../common/pesapal.client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

function paymentMethod(value: string): PaymentMethod {
  const method = value.toUpperCase();
  if (method.includes('VISA') || method.includes('MASTERCARD') || method.includes('CARD')) return 'CARD';
  if (method.includes('MTN') || method.includes('AIRTEL') || method.includes('MOBILE')) return 'MOBILE_MONEY';
  if (method.includes('BANK')) return 'BANK_TRANSFER';
  return 'OTHER';
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
    private readonly pesapal: PesapalClient,
    private readonly notifications: NotificationsService,
  ) {}

  private ensureMerchant(churchId: string) {
    const merchantChurch = this.config.get<string>('PESAPAL_CHURCH_ID');
    if (!merchantChurch || merchantChurch !== churchId) {
      throw new ServiceUnavailableException('Online payments are not connected for this church');
    }
    if (!this.config.get<string>('PESAPAL_CONSUMER_KEY') || !this.config.get<string>('PESAPAL_CONSUMER_SECRET')) {
      throw new ServiceUnavailableException('Pesapal live credentials are not configured');
    }
  }

  list(churchId: string) {
    return this.db.paymentRequest.findMany({
      where: { churchId },
      include: { pledge: { include: { member: true, campaign: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLink(session: Session, pledgeId: string, amount: number) {
    this.ensureMerchant(session.churchId);
    if (!Number.isFinite(amount) || amount < 1 || amount > 999999999999 || !/^\d+(\.\d{1,2})?$/.test(String(amount))) {
      throw new BadRequestException('Enter an amount of at least UGX 1 with at most two decimal places');
    }
    return this.db.$transaction(async tx => {
      const owned = await tx.$queryRaw<{ id: string }[]>`
        SELECT p.id FROM "Pledge" p JOIN "Member" m ON m.id = p."memberId"
        JOIN "Campaign" c ON c.id = p."campaignId"
        WHERE p.id = ${pledgeId} AND m."churchId" = ${session.churchId}
        AND c."churchId" = ${session.churchId} FOR UPDATE OF p`;
      if (!owned.length) throw new NotFoundException('Pledge not found in your church');
      const pledge = await tx.pledge.findUniqueOrThrow({
        where: { id: pledgeId }, include: { collections: true },
      });
      const paid = pledge.collections.filter(row => !row.reversedAt)
        .reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0));
      const balance = pledge.amount.minus(paid);
      if (balance.lessThan(amount)) throw new BadRequestException(`The remaining balance is UGX ${balance.toFixed(2)}`);
      const active = await tx.paymentRequest.findFirst({
        where: { pledgeId, status: { in: ['READY', 'INITIATING', 'CHECKOUT'] }, expiresAt: { gt: new Date() } },
      });
      if (active) {
        if (active.amount.equals(amount)) return active;
        throw new ConflictException('This pledge already has an active payment link');
      }
      const publicToken = randomBytes(24).toString('hex');
      return tx.paymentRequest.create({ data: {
        churchId: session.churchId, pledgeId, createdById: session.sub,
        amount: new Prisma.Decimal(amount), publicToken,
        merchantReference: `CPM-${randomBytes(14).toString('hex')}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      } });
    });
  }

  async publicLink(token: string) {
    const request = await this.db.paymentRequest.findUnique({
      where: { publicToken: token },
      include: { church: true, pledge: { include: { campaign: true } } },
    });
    if (!request) throw new NotFoundException('Payment link not found');
    return {
      churchName: request.church.name,
      campaignName: request.pledge.campaign.name,
      amount: Number(request.amount), status: request.status,
      expired: request.expiresAt < new Date(),
    };
  }

  async checkout(token: string) {
    const request = await this.db.paymentRequest.findUnique({
      where: { publicToken: token },
      include: { pledge: { include: { member: true, campaign: true } } },
    });
    if (!request) throw new NotFoundException('Payment link not found');
    this.ensureMerchant(request.churchId);
    if (request.expiresAt < new Date()) throw new BadRequestException('This payment link has expired');
    if (request.status === 'COMPLETED' || request.status === 'REVERSED') {
      throw new ConflictException('This payment link has already been used');
    }
    if (request.status === 'CHECKOUT' && request.checkoutUrl) return { redirectUrl: request.checkoutUrl };
    const claimed = await this.db.paymentRequest.updateMany({
      where: { id: request.id, status: 'READY' }, data: { status: 'INITIATING' },
    });
    if (!claimed.count) throw new ConflictException('This payment link is already opening');
    try {
      const publicApi = (this.config.get<string>('API_PUBLIC_URL') || 'https://church-management-sytem.onrender.com/api').replace(/\/+$/, '');
      const names = request.pledge.member.fullName.trim().split(/\s+/);
      const order = await this.pesapal.submitOrder({
        reference: request.merchantReference,
        amount: Number(request.amount),
        description: `Pledge for ${request.pledge.campaign.name}`,
        phone: request.pledge.member.phone,
        firstName: names[0] || 'Member', lastName: names.slice(1).join(' '),
        callbackUrl: `${publicApi}/payments/callback`,
        ipnUrl: `${publicApi}/payments/ipn`,
      });
      await this.db.paymentRequest.update({
        where: { id: request.id },
        data: { status: 'CHECKOUT', trackingId: order.order_tracking_id, checkoutUrl: order.redirect_url },
      });
      return { redirectUrl: order.redirect_url };
    } catch (error) {
      await this.db.paymentRequest.updateMany({
        where: { id: request.id, status: 'INITIATING' }, data: { status: 'READY' },
      });
      throw error;
    }
  }

  async status(reference: string) {
    let request = await this.db.paymentRequest.findUnique({ where: { merchantReference: reference } });
    if (!request) throw new NotFoundException('Payment request not found');
    if (request.trackingId && request.status === 'CHECKOUT') {
      try {
        await this.reconcile(reference, request.trackingId);
        request = await this.db.paymentRequest.findUnique({ where: { merchantReference: reference } });
      } catch (error) {
        this.logger.warn(`Payment status check failed for ${reference}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    if (!request) throw new NotFoundException('Payment request not found');
    return { status: request.status, amount: Number(request.amount), method: request.gatewayMethod };
  }

  async reconcile(reference: string, trackingId: string) {
    const request = await this.db.paymentRequest.findUnique({ where: { merchantReference: reference } });
    if (!request || (request.trackingId && request.trackingId !== trackingId)) {
      throw new NotFoundException('Payment request not found');
    }
    this.ensureMerchant(request.churchId);
    const verified = await this.pesapal.getStatus(trackingId);
    const receivedAmount = Number(verified.amount);
    if (verified.merchant_reference !== reference || verified.currency !== 'UGX'
      || !Number.isFinite(receivedAmount) || !new Prisma.Decimal(receivedAmount).equals(request.amount)) {
      throw new ConflictException('The verified Pesapal payment does not match this request');
    }
    const code = Number(verified.status_code);
    if (![1, 2, 3].includes(code)) return { status: request.status };
    const result = await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Pledge" WHERE id = ${request.pledgeId} FOR UPDATE`;
      const fresh = await tx.paymentRequest.findUniqueOrThrow({ where: { id: request.id } });
      if (fresh.trackingId && fresh.trackingId !== trackingId) {
        throw new ConflictException('This tracking number belongs to another payment');
      }
      if (code === 2) {
        if (fresh.status !== 'COMPLETED') await tx.paymentRequest.update({ where: { id: fresh.id }, data: { status: 'FAILED', trackingId } });
        return { status: fresh.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED' };
      }
      let newCollection = false;
      if (code === 3) {
        const collection = await tx.collection.findUnique({ where: { gatewayTrackingId: trackingId } });
        if (collection && !collection.reversedAt) await tx.collection.update({
          where: { id: collection.id }, data: { reversedAt: new Date() },
        });
        await tx.paymentRequest.update({ where: { id: fresh.id }, data: { status: 'REVERSED', trackingId } });
      } else {
        if (fresh.status === 'REVERSED') return { status: 'REVERSED' };
        const alreadyPaid = await tx.collection.findMany({ where: { pledgeId: fresh.pledgeId, reversedAt: null } });
        const paid = alreadyPaid.reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0));
        const pledged = await tx.pledge.findUniqueOrThrow({ where: { id: fresh.pledgeId } });
        if (!alreadyPaid.some((row) => row.gatewayTrackingId === trackingId) && paid.plus(fresh.amount).greaterThan(pledged.amount)) {
          throw new ConflictException('Payment exceeds the pledge balance and needs review');
        }
        const existing = await tx.collection.findUnique({ where: { gatewayTrackingId: trackingId } });
        if (!existing) {
          await tx.collection.create({ data: {
          pledgeId: fresh.pledgeId, amount: fresh.amount,
          paymentDate: verified.created_date && !Number.isNaN(Date.parse(verified.created_date))
            ? new Date(verified.created_date) : new Date(),
          method: paymentMethod(verified.payment_method ?? ''),
          gateway: 'PESAPAL', gatewayMethod: verified.payment_method ?? 'Other',
          gatewayTrackingId: trackingId,
          gatewayConfirmationCode: verified.confirmation_code ?? null,
          referenceNumber: fresh.merchantReference,
          idempotencyKey: fresh.merchantReference,
          recordedById: fresh.createdById,
          } });
          newCollection = true;
        }
        await tx.paymentRequest.update({ where: { id: fresh.id }, data: {
          status: 'COMPLETED', trackingId, gatewayMethod: verified.payment_method ?? 'Other', completedAt: new Date(),
        } });
      }
      const pledge = await tx.pledge.findUniqueOrThrow({
        where: { id: fresh.pledgeId }, include: { collections: true },
      });
      const paid = pledge.collections.filter(row => !row.reversedAt)
        .reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0));
      const balance = pledge.amount.minus(paid);
      await tx.pledge.update({ where: { id: pledge.id }, data: {
        status: balance.lessThanOrEqualTo(0) ? 'PAID'
          : pledge.dueDate < new Date() ? 'OVERDUE'
          : paid.greaterThan(0) ? 'PARTIALLY_PAID' : 'PENDING',
      } });
      return { status: code === 3 ? 'REVERSED' : 'COMPLETED', newCollection, balance: Number(balance) };
    });
    if (result.newCollection) {
      try {
        const pledge = await this.db.pledge.findUniqueOrThrow({
          where: { id: request.pledgeId }, include: { member: true, campaign: true },
        });
        if (result.balance <= 0) await this.notifications.sendFullyPaidNotification(
          pledge.member.id, pledge.member.phone, pledge.campaign.name,
        );
        else await this.notifications.sendPaymentReceivedNotification(
          pledge.member.id, pledge.member.phone, pledge.campaign.name, Number(request.amount), result.balance,
        );
      } catch (error) {
        this.logger.warn(`Payment recorded but receipt SMS failed for ${reference}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    return { status: result.status };
  }
}
