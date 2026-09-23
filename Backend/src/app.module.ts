import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PrismaService } from "./prisma/prisma.service";
import { DatabaseErrorsFilter } from "./common/database-errors.filter";
import { MembersController } from "./members/members.controller";
import { CampaignsController } from "./campaigns/campaigns.controller";
import { PledgesController } from "./pledges/pledges.controller";
import { PledgesService } from "./pledges/pledges.service";
import { CollectionsController } from "./collections/collections.controller";
import { CollectionsService } from "./collections/collections.service";
import { DashboardController } from "./dashboard/dashboard.controller";
import { ReportsController } from "./reports/reports.controller";
import { HealthController } from "./health/health.controller";
import { PesapalClient } from "./common/pesapal.client";
import { PaymentsController } from "./collections/payments.controller";
import { PaymentsService } from "./collections/payments.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [
    MembersController,
    CampaignsController,
    PledgesController,
    CollectionsController,
    PaymentsController,
    DashboardController,
    ReportsController,
    HealthController,
  ],
  providers: [
    PrismaService,
    PledgesService,
    CollectionsService,
    PaymentsService,
    PesapalClient,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: DatabaseErrorsFilter },
  ],
})
export class AppModule {}
