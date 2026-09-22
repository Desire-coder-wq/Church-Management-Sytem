import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Session, requireChurch } from "../common/session";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "./notifications.service";

@ApiTags("Notifications")
@ApiBearerAuth("access-token")
@UseGuards(AuthGuard("jwt"))
@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly db: PrismaService,
  ) {}

  @Get()
  list(@Req() req: { user: Session }) {
    return this.notifications.getNotifications(requireChurch(req.user));
  }

  @Post("send/pledge-created")
  async sendPledgeCreated(
    @Req() req: { user: Session },
    @Body()
    dto: {
      memberId: string;
      campaignName: string;
      amount: number;
      dueDate: string;
    },
  ) {
    const churchId = requireChurch(req.user);
    const member = await this.db.member.findFirst({
      where: { id: dto.memberId, churchId },
    });
    if (!member) throw new Error("Member not found");
    await this.notifications.sendPledgeCreatedNotification(
      member.id,
      member.phone,
      dto.campaignName,
      dto.amount,
      new Date(dto.dueDate),
    );
    return { success: true };
  }

  @Post("send/payment-received")
  async sendPaymentReceived(
    @Req() req: { user: Session },
    @Body()
    dto: {
      memberId: string;
      campaignName: string;
      amount: number;
      balance: number;
    },
  ) {
    const churchId = requireChurch(req.user);
    const member = await this.db.member.findFirst({
      where: { id: dto.memberId, churchId },
    });
    if (!member) throw new Error("Member not found");
    await this.notifications.sendPaymentReceivedNotification(
      member.id,
      member.phone,
      dto.campaignName,
      dto.amount,
      dto.balance,
    );
    return { success: true };
  }

  @Post("send/payment-reminder")
  async sendPaymentReminder(
    @Req() req: { user: Session },
    @Body()
    dto: {
      memberId: string;
      campaignName: string;
      balance: number;
      dueDate: string;
    },
  ) {
    const churchId = requireChurch(req.user);
    const member = await this.db.member.findFirst({
      where: { id: dto.memberId, churchId },
    });
    if (!member) throw new Error("Member not found");
    await this.notifications.sendPaymentReminderNotification(
      member.id,
      member.phone,
      dto.campaignName,
      dto.balance,
      new Date(dto.dueDate),
    );
    return { success: true };
  }

  @Post("send/fully-paid")
  async sendFullyPaid(
    @Req() req: { user: Session },
    @Body() dto: { memberId: string; campaignName: string },
  ) {
    const churchId = requireChurch(req.user);
    const member = await this.db.member.findFirst({
      where: { id: dto.memberId, churchId },
    });
    if (!member) throw new Error("Member not found");
    await this.notifications.sendFullyPaidNotification(
      member.id,
      member.phone,
      dto.campaignName,
    );
    return { success: true };
  }

  @Post("retry-failed")
  async retryFailed(@Req() req: { user: Session }) {
    await this.notifications.retryFailedNotifications();
    return { success: true };
  }
}
