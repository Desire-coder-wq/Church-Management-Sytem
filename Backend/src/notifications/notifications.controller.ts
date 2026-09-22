import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Session, requireChurch } from '../common/session';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Notifications') @ApiBearerAuth('access-token') @UseGuards(AuthGuard('jwt')) @Controller('notifications')
export class NotificationsController {
  constructor(private readonly db: PrismaService) {}
  @Get() list(@Req() req: { user: Session }) {
    return this.db.smsNotification.findMany({ where: { member: { churchId: requireChurch(req.user) } },
      include: { member: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  }
}
