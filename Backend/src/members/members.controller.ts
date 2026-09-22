import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Session, requireChurch } from '../common/session';
import { PrismaService } from '../prisma/prisma.service';
import { MemberDto } from './member.dto';

@ApiTags('Members') @ApiBearerAuth('access-token') @UseGuards(AuthGuard('jwt')) @Controller('members')
export class MembersController {
  constructor(private readonly db: PrismaService) {}
  @Get() list(@Req() req: { user: Session }) {
    return this.db.member.findMany({ where: { churchId: requireChurch(req.user) }, include: { group: true }, orderBy: { fullName: 'asc' } });
  }
  @Get(':id') async detail(@Req() req: { user: Session }, @Param('id') id: string) {
    const member = await this.db.member.findFirst({ where: { id, churchId: requireChurch(req.user) },
      include: { group: true, pledges: { include: { campaign: true, collections: true } } } });
    if (!member) throw new NotFoundException('Member not found in your church.');
    return member;
  }
  @Post() create(@Req() req: { user: Session }, @Body() dto: MemberDto) {
    const churchId = requireChurch(req.user);
    return this.db.member.create({ data: {
      church: { connect: { id: churchId } }, fullName: dto.fullName, phone: dto.phone,
      group: { connectOrCreate: { where: { churchId_name: { churchId, name: dto.group } }, create: { churchId, name: dto.group } } },
    }, include: { group: true } });
  }
  @Patch(':id') async update(@Req() req: { user: Session }, @Param('id') id: string, @Body() dto: MemberDto) {
    await this.detail(req, id);
    const churchId = requireChurch(req.user);
    return this.db.member.update({ where: { id }, data: { fullName: dto.fullName, phone: dto.phone,
      group: { connectOrCreate: { where: { churchId_name: { churchId, name: dto.group } }, create: { churchId, name: dto.group } } },
    }, include: { group: true } });
  }
}
