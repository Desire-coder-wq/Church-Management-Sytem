import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Session, requireChurch } from '../common/session';
import { PrismaService } from '../prisma/prisma.service';
import { PledgesService } from '../pledges/pledges.service';

@ApiTags('Dashboard') @ApiBearerAuth('access-token') @UseGuards(AuthGuard('jwt')) @Controller('dashboard')
export class DashboardController {
  constructor(private readonly db: PrismaService, private readonly pledges: PledgesService) {}
  @Get() async summary(@Req() req: { user: Session }) {
    const churchId = requireChurch(req.user);
    const [rows, campaigns, members] = await Promise.all([
      this.pledges.list(churchId), this.db.campaign.findMany({ where: { churchId } }), this.db.member.count({ where: { churchId } }),
    ]);
    const pledged = rows.reduce((s, p) => s + p.amount, 0);
    const paid = rows.reduce((s, p) => s + p.paid, 0);
    const target = campaigns.reduce((s, c) => s + Number(c.targetAmount), 0);
    const collections = rows.flatMap(row => row.collections.map(collection => ({ ...collection, member: row.member, campaign: row.campaign })));
    return { members, activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length, target, pledged, paid,
      outstanding: pledged - paid, remainingToTarget: Math.max(0, target - paid),
      recentCollections: collections.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime()).slice(0, 5),
      upcoming: rows.filter(row => row.balance > 0 && row.dueDate >= new Date()).slice(0, 5),
      overdue: rows.filter(row => row.status === 'OVERDUE'),
    };
  }
}
