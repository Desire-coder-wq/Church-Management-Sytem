import { Body, Controller, Get, Post, UseGuards, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsPhoneNumber,
  IsString,
  Min,
  MinLength,
} from "class-validator";
import { AuthGuard } from "@nestjs/passport";
import {
  AuthService,
  ChurchService,
  PrismaService,
  SmsService,
} from "./services";
import { SmsType } from "@prisma/client";
class Credentials {
  @IsString() @MinLength(2) fullName!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}
class MemberDto {
  @IsString() fullName!: string;
  @IsPhoneNumber("UG") phone!: string;
  @IsString() group!: string;
}
class CampaignDto {
  @IsString() name!: string;
  @IsString() description?: string;
  @IsNumber() @Min(1) targetAmount!: number;
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
}
class PledgeDto {
  @IsString() memberId!: string;
  @IsString() campaignId!: string;
  @IsNumber() @Min(1) amount!: number;
  @IsDateString() dueDate!: string;
}
class PaymentDto {
  @IsString() pledgeId!: string;
  @IsNumber() @Min(1) amount!: number;
  @IsDateString() paymentDate!: string;
  @IsEnum(["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "OTHER"]) method!: any;
  @IsString() referenceNumber!: string;
  @IsString() @MinLength(8) idempotencyKey!: string;
}
@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}
  @Post("signup") signup(@Body() d: Credentials) {
    return this.auth.signup(d.email, d.password, d.fullName);
  }
  @Post("login") login(@Body() d: Credentials) {
    return this.auth.login(d.email, d.password);
  }
}
@ApiTags("Church management")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller()
export class ApiController {
  constructor(
    private db: PrismaService,
    private church: ChurchService,
    private sms: SmsService,
  ) {}
  @Get("members") members(@Req() req: any) {
    return this.db.member.findMany({
      where: { churchId: req.user.churchId },
      include: { group: true },
    });
  }
  @Post("members") member(@Req() req: any, @Body() d: MemberDto) {
    return this.db.member.create({
      data: {
        church: { connect: { id: req.user.churchId } },
        fullName: d.fullName,
        phone: d.phone,
        group: {
          connectOrCreate: {
            where: {
              churchId_name: { churchId: req.user.churchId, name: d.group },
            },
            create: { churchId: req.user.churchId, name: d.group },
          },
        },
      },
      include: { group: true },
    });
  }
  @Get("campaigns") campaigns(@Req() req: any) {
    return this.db.campaign.findMany({
      where: { churchId: req.user.churchId },
    });
  }
  @Post("campaigns") campaign(@Req() req: any, @Body() d: CampaignDto) {
    return this.db.campaign.create({
      data: {
        ...d,
        churchId: req.user.churchId,
        startDate: new Date(d.startDate),
        endDate: new Date(d.endDate),
      },
    });
  }
  @Get("pledges") pledges() {
    return this.church.pledges();
  }
  @Post("pledges") async pledge(@Body() d: PledgeDto) {
    const p = await this.db.pledge.create({
      data: { ...d, dueDate: new Date(d.dueDate) },
      include: { member: true, campaign: true, collections: true },
    });
    await this.sms.send(
      p.member,
      `Your pledge of UGX ${p.amount} towards ${p.campaign.name} has been recorded.`,
      SmsType.PLEDGE_CREATED,
    );
    return this.church.view(p);
  }
  @Get("collections") collections() {
    return this.db.collection.findMany({
      include: { pledge: { include: { member: true, campaign: true } } },
      orderBy: { paymentDate: "desc" },
    });
  }
  @Post("collections") payment(@Body() d: PaymentDto) {
    return this.church.payment(d);
  }
  @Get("dashboard") dashboard() {
    return this.church.dashboard();
  }
  @Get("reports") async report() {
    const rows = await this.church.pledges();
    return {
      rows,
      totals: {
        pledged: rows.reduce((s, p) => s + p.amount, 0),
        paid: rows.reduce((s, p) => s + p.paid, 0),
        outstanding: rows.reduce((s, p) => s + p.balance, 0),
      },
    };
  }
  @Get("notifications") notifications() {
    return this.db.smsNotification.findMany({
      include: { member: true },
      orderBy: { sentAt: "desc" },
    });
  }
}
