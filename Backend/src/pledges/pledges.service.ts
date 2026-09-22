import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePledgeDto } from "./create-pledge.dto";

export const pledgeInclude = {
  member: { include: { group: true } },
  campaign: true,
  collections: true,
} satisfies Prisma.PledgeInclude;
export type PledgeRecord = Prisma.PledgeGetPayload<{
  include: typeof pledgeInclude;
}>;

export function summarizePledge(pledge: PledgeRecord) {
  const paid = pledge.collections.reduce(
    (sum, row) => sum.plus(row.amount),
    new Prisma.Decimal(0),
  );
  const balance = pledge.amount.minus(paid);
  return {
    ...pledge,
    amount: Number(pledge.amount),
    paid: Number(paid),
    balance: Number(balance),
    status: balance.isZero()
      ? "PAID"
      : pledge.dueDate < new Date()
        ? "OVERDUE"
        : paid.greaterThan(0)
          ? "PARTIALLY_PAID"
          : "PENDING",
  };
}

@Injectable()
export class PledgesService {
  constructor(private readonly db: PrismaService) {}

  async list(churchId: string) {
    const rows = await this.db.pledge.findMany({
      where: { member: { churchId }, campaign: { churchId } },
      include: pledgeInclude,
      orderBy: { dueDate: "asc" },
    });
    return rows.map(summarizePledge);
  }

  async create(churchId: string, dto: CreatePledgeDto) {
    const [member, campaign] = await Promise.all([
      this.db.member.findFirst({
        where: { id: dto.memberId, churchId, isActive: true },
      }),
      this.db.campaign.findFirst({
        where: { id: dto.campaignId, churchId, status: "ACTIVE" },
      }),
    ]);
    if (!member || !campaign)
      throw new NotFoundException(
        "Select an active member and campaign from your church.",
      );
    const dueDate = new Date(dto.dueDate);
    if (dueDate < campaign.startDate || dueDate > campaign.endDate) {
      throw new BadRequestException(
        "Due date must be within the campaign start and end dates.",
      );
    }
    return summarizePledge(
      await this.db.pledge.create({
        data: { ...dto, dueDate },
        include: pledgeInclude,
      }),
    );
  }
}
