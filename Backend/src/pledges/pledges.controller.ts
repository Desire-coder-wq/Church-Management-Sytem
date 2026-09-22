import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Session, requireChurch } from '../common/session';
import { CreatePledgeDto } from './create-pledge.dto';
import { PledgesService } from './pledges.service';

@ApiTags('Pledges')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('pledges')
export class PledgesController {
  constructor(private readonly pledges: PledgesService) {}
  @Get() list(@Req() req: { user: Session }) { return this.pledges.list(requireChurch(req.user)); }
  @Post() create(@Req() req: { user: Session }, @Body() dto: CreatePledgeDto) {
    return this.pledges.create(requireChurch(req.user), dto);
  }
}
