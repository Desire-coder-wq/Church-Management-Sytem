import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Session, requireChurch } from '../common/session';
import { CreateCollectionDto } from './create-collection.dto';
import { CollectionsService } from './collections.service';

@ApiTags('Collections')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}
  @Get() list(@Req() req: { user: Session }) { return this.collections.list(requireChurch(req.user)); }
  @Post() create(@Req() req: { user: Session }, @Body() dto: CreateCollectionDto) {
    requireChurch(req.user);
    return this.collections.create(req.user, dto);
  }
}
