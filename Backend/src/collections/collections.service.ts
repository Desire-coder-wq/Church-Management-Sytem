import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { Session } from "../common/session";
import { CreateCollectionDto } from "./create-collection.dto";

@Injectable()
export class CollectionsService {
  constructor(private readonly db: PrismaService) {}

  list(churchId: string) {
    return this.db.collection.findMany({
      where: { pledge: { member: { churchId }, campaign: { churchId } } },
      include: { pledge: { include: { member: true, campaign: true } } },
      orderBy: { paymentDate: "desc" },
    });
  }

  async create(session: Session, dto: CreateCollectionDto) {
    if (new Date(dto.paymentDate) > new Date())
      throw new BadRequestException("Payment date cannot be in the future.");
    return this.db.$transaction(async (tx) => {
      // Serialize collections for this pledge to prevent concurrent overpayments.
      const owned = await tx.$queryRaw<{ id: string }[]>`
        SELECT p.id FROM "Pledge" p JOIN "Member" m ON m.id = p."memberId"
        JOIN "Campaign" c ON c.id = p."campaignId"
        WHERE p.id = ${dto.pledgeId} AND m."churchId" = ${session.churchId}
        AND c."churchId" = ${session.churchId} FOR UPDATE OF p`;
      if (!owned.length)
        throw new NotFoundException("Pledge not found in your church.");
      const existing = await tx.collection.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        if (
          existing.pledgeId !== dto.pledgeId ||
          !existing.amount.equals(dto.amount) ||
          existing.method !== dto.method ||
          existing.recordedById !== session.sub ||
          existing.paymentDate.getTime() !==
            new Date(dto.paymentDate).getTime() ||
          existing.referenceNumber !== (dto.referenceNumber || null)
        ) {
          throw new ConflictException(
            "This request ID belongs to a different collection.",
          );
        }
        return existing;
      }
      const pledge = await tx.pledge.findUniqueOrThrow({
        where: { id: dto.pledgeId },
        include: { collections: true },
      });
      const paid = pledge.collections.reduce(
        (sum, row) => sum.plus(row.amount),
        new Prisma.Decimal(0),
      );
      const balance = pledge.amount.minus(paid);
      if (balance.lessThan(dto.amount))
        throw new BadRequestException(
          `Payment exceeds the remaining balance of UGX ${balance.toFixed(2)}.`,
        );
      const collection = await tx.collection.create({
        data: {
          ...dto,
          referenceNumber: dto.referenceNumber || null,
          paymentDate: new Date(dto.paymentDate),
          recordedById: session.sub,
        },
      });
      await tx.pledge.update({
        where: { id: pledge.id },
        data: {
          status: balance.equals(dto.amount) ? "PAID" : "PARTIALLY_PAID",
        },
      });
      return collection;
    });
  }
}
