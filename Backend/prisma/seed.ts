import { PrismaClient, Role, CampaignStatus, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user and church
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@church.com' },
    update: {},
    create: {
      email: 'admin@church.com',
      fullName: 'Church Admin',
      passwordHash: hashedPassword,
      role: Role.ADMIN,
      church: {
        create: {
          name: 'Grace Community Church',
        },
      },
    },
    include: { church: true },
  });

  console.log('Created admin:', admin.email, 'for church:', admin.church.name);

  // Create a staff user
  const staff = await prisma.user.upsert({
    where: { email: 'staff@church.com' },
    update: {},
    create: {
      email: 'staff@church.com',
      fullName: 'Staff Member',
      passwordHash: await bcrypt.hash('Staff@123', 12),
      role: Role.STAFF,
      churchId: admin.churchId,
    },
  });

  console.log('Created staff:', staff.email);

  // Create groups
  const youthGroup = await prisma.group.upsert({
    where: { churchId_name: { churchId: admin.churchId, name: 'Youth Group' } },
    update: {},
    create: { churchId: admin.churchId, name: 'Youth Group', description: 'Young adults and teens' },
  });

  const womenGroup = await prisma.group.upsert({
    where: { churchId_name: { churchId: admin.churchId, name: 'Women Ministry' } },
    update: {},
    create: { churchId: admin.churchId, name: 'Women Ministry', description: 'Women fellowship group' },
  });

  const menGroup = await prisma.group.upsert({
    where: { churchId_name: { churchId: admin.churchId, name: 'Men Ministry' } },
    update: {},
    create: { churchId: admin.churchId, name: 'Men Ministry', description: 'Men fellowship group' },
  });

  console.log('Created groups:', youthGroup.name, womenGroup.name, menGroup.name);

  // Create members
  const members = await Promise.all([
    prisma.member.upsert({
      where: { phone: '+256700123456' },
      update: {},
      create: {
        churchId: admin.churchId,
        fullName: 'John Doe',
        phone: '+256700123456',
        groupId: youthGroup.id,
      },
    }),
    prisma.member.upsert({
      where: { phone: '+256700123457' },
      update: {},
      create: {
        churchId: admin.churchId,
        fullName: 'Jane Smith',
        phone: '+256700123457',
        groupId: womenGroup.id,
      },
    }),
    prisma.member.upsert({
      where: { phone: '+256700123458' },
      update: {},
      create: {
        churchId: admin.churchId,
        fullName: 'Robert Johnson',
        phone: '+256700123458',
        groupId: menGroup.id,
      },
    }),
  ]);

  console.log('Created members:', members.map((m) => m.fullName).join(', '));

  // Create campaigns
  const buildingFund = await prisma.campaign.upsert({
    where: { churchId_name: { churchId: admin.churchId, name: 'Church Building Fund' } },
    update: {},
    create: {
      churchId: admin.churchId,
      name: 'Church Building Fund',
      description: 'Fund for new church building construction',
      targetAmount: 500000000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2026-12-31'),
      status: CampaignStatus.ACTIVE,
    },
  });

  const missionFund = await prisma.campaign.upsert({
    where: { churchId_name: { churchId: admin.churchId, name: 'Mission Support Fund' } },
    update: {},
    create: {
      churchId: admin.churchId,
      name: 'Mission Support Fund',
      description: 'Support for missionary work',
      targetAmount: 100000000,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-06-30'),
      status: CampaignStatus.ACTIVE,
    },
  });

  console.log('Created campaigns:', buildingFund.name, missionFund.name);

  // Create pledges
  const pledge1 = await prisma.pledge.upsert({
    where: { memberId_campaignId: { memberId: members[0].id, campaignId: buildingFund.id } },
    update: {},
    create: {
      memberId: members[0].id,
      campaignId: buildingFund.id,
      amount: 5000000,
      dueDate: new Date('2026-06-30'),
    },
  });

  const pledge2 = await prisma.pledge.upsert({
    where: { memberId_campaignId: { memberId: members[1].id, campaignId: buildingFund.id } },
    update: {},
    create: {
      memberId: members[1].id,
      campaignId: buildingFund.id,
      amount: 3000000,
      dueDate: new Date('2026-06-30'),
    },
  });

  const pledge3 = await prisma.pledge.upsert({
    where: { memberId_campaignId: { memberId: members[2].id, campaignId: missionFund.id } },
    update: {},
    create: {
      memberId: members[2].id,
      campaignId: missionFund.id,
      amount: 2000000,
      dueDate: new Date('2026-03-31'),
    },
  });

  console.log('Created pledges for members');

  // Create some collections
  await prisma.collection.upsert({
    where: { idempotencyKey: 'seed-collection-1' },
    update: {},
    create: {
      pledgeId: pledge1.id,
      amount: 2000000,
      paymentDate: new Date('2025-02-15'),
      method: PaymentMethod.CASH,
      referenceNumber: 'TXN-001',
      idempotencyKey: 'seed-collection-1',
      recordedById: admin.id,
    },
  });

  await prisma.collection.upsert({
    where: { idempotencyKey: 'seed-collection-2' },
    update: {},
    create: {
      pledgeId: pledge2.id,
      amount: 1500000,
      paymentDate: new Date('2025-03-20'),
      method: PaymentMethod.MOBILE_MONEY,
      referenceNumber: 'TXN-002',
      idempotencyKey: 'seed-collection-2',
      recordedById: admin.id,
    },
  });

  await prisma.collection.upsert({
    where: { idempotencyKey: 'seed-collection-3' },
    update: {},
    create: {
      pledgeId: pledge3.id,
      amount: 1000000,
      paymentDate: new Date('2025-04-10'),
      method: PaymentMethod.BANK_TRANSFER,
      referenceNumber: 'TXN-003',
      idempotencyKey: 'seed-collection-3',
      recordedById: admin.id,
    },
  });

  console.log('Created sample collections');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });