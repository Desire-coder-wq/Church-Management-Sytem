import { BadRequestException, Body, Controller, Get, HttpCode, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsNumber, IsString, Max, Min } from 'class-validator';
import { Response } from 'express';
import { Roles, RolesGuard } from '../common/roles.guard';
import { Session, requireChurch } from '../common/session';
import { PaymentsService } from './payments.service';

class CreatePaymentLinkDto {
  @ApiProperty() @IsString() pledgeId!: string;
  @ApiProperty({ minimum: 1 }) @IsNumber({ maxDecimalPlaces: 2 }) @Min(1) @Max(999999999999)
  amount!: number;
}

@ApiTags('Pesapal payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService, private readonly config: ConfigService) {}

  @ApiBearerAuth('access-token') @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('ADMIN')
  @Get('links')
  list(@Req() req: { user: Session }) {
    return this.payments.list(requireChurch(req.user));
  }

  @ApiBearerAuth('access-token') @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('ADMIN')
  @Post('links')
  create(@Req() req: { user: Session }, @Body() dto: CreatePaymentLinkDto) {
    return this.payments.createLink(req.user, dto.pledgeId, dto.amount);
  }

  @Get('public/:token')
  detail(@Param('token') token: string) {
    return this.payments.publicLink(token);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('public/:token/checkout')
  checkout(@Param('token') token: string) {
    return this.payments.checkout(token);
  }

  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @Get('status/:reference')
  status(@Param('reference') reference: string) {
    return this.payments.status(reference);
  }

  @Get('callback')
  async callback(
    @Query('OrderTrackingId') trackingId: string,
    @Query('OrderMerchantReference') reference: string,
    @Res() response: Response,
  ) {
    if (!trackingId || !reference) throw new BadRequestException('Missing payment reference');
    try {
      await this.payments.reconcile(reference, trackingId);
    } catch {
      // The browser return is not proof of payment; an IPN or a later check can reconcile it.
    }
    const frontend = (this.config.get<string>('FRONTEND_URL') || 'https://church-management-sytem.pages.dev').replace(/\/+$/, '');
    const url = new URL('/payment-result', frontend);
    url.searchParams.set('reference', reference);
    return response.redirect(303, url.toString());
  }

  @Get('ipn') @HttpCode(200)
  async ipn(
    @Query('OrderTrackingId') trackingId: string,
    @Query('OrderMerchantReference') reference: string,
  ) {
    if (!trackingId || !reference) throw new BadRequestException('Missing payment reference');
    await this.payments.reconcile(reference, trackingId);
    return { orderNotificationType: 'IPNCHANGE', orderTrackingId: trackingId,
      orderMerchantReference: reference, status: 200 };
  }
}
