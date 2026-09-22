import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Session, requireChurch } from '../common/session';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignDto } from './campaign.dto';
import { Roles, RolesGuard } from '../common/roles.guard';

@ApiTags('Campaigns')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly db: PrismaService) {}
  @Roles('ADMIN', 'STAFF')
  @Get() list(@Req() req: { user: Session }) {
    return this.db.campaign.findMany({
      where: { churchId: requireChurch(req.user) },
      orderBy: { createdAt: 'desc' },
    });
  }
  @Roles('ADMIN')
  @Post() create(@Req() req: { user: Session }, @Body() dto: CampaignDto) {
    return this.db.campaign.create({
      data: { ...this.data(dto), churchId: requireChurch(req.user) },
    });
  }
  @Roles('ADMIN')
  @Patch(':id') async update(
    @Req() req: { user: Session },
    @Param('id') id: string,
    @Body() dto: CampaignDto,
  ) {
    const campaign = await this.db.campaign.findFirst({
      where: { id, churchId: requireChurch(req.user) },
    });
    if (!campaign)
      throw new NotFoundException('Campaign not found in your church.');
    return this.db.campaign.update({ where: { id }, data: this.data(dto) });
  }
  private data(dto: CampaignDto) {
    if (new Date(dto.endDate) <= new Date(dto.startDate))
      throw new BadRequestException('End date must be after the start date.');
    return {
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    };
  }
}
