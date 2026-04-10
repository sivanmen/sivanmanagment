import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Super Admin
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sivanmanagment.com' },
    update: {},
    create: {
      email: 'admin@sivanmanagment.com',
      passwordHash: adminPasswordHash,
      firstName: 'Sivan',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      preferredLocale: 'he',
      timezone: 'Asia/Jerusalem',
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`Super Admin created: ${admin.email}`);

  // Create a demo Property Owner
  const ownerPasswordHash = await bcrypt.hash('Owner@123456', 12);
  const ownerUser = await prisma.user.upsert({
    where: { email: 'demo.owner@sivanmanagment.com' },
    update: {},
    create: {
      email: 'demo.owner@sivanmanagment.com',
      passwordHash: ownerPasswordHash,
      firstName: 'David',
      lastName: 'Cohen',
      role: 'OWNER',
      status: 'ACTIVE',
      preferredLocale: 'he',
      timezone: 'Asia/Jerusalem',
      emailVerifiedAt: new Date(),
    },
  });

  const owner = await prisma.owner.upsert({
    where: { userId: ownerUser.id },
    update: {},
    create: {
      userId: ownerUser.id,
      defaultManagementFeePercent: 25,
      defaultMinimumMonthlyFee: 500,
      expenseApprovalThreshold: 200,
    },
  });
  console.log(`Demo Owner created: ${ownerUser.email}`);

  // Create a demo Property
  const property = await prisma.property.upsert({
    where: { internalCode: 'CRT-001' },
    update: {},
    create: {
      ownerId: owner.id,
      internalCode: 'CRT-001',
      name: 'Aegean Sunset Villa',
      slug: 'aegean-sunset-villa',
      description: {
        en: 'Stunning beachfront villa with panoramic views of the Aegean Sea',
        he: 'וילה מרהיבה על חוף הים עם נוף פנורמי לים האגאי',
      },
      propertyType: 'VILLA',
      status: 'ACTIVE',
      addressLine1: '15 Elounda Bay',
      city: 'Elounda',
      stateRegion: 'Crete',
      postalCode: '72053',
      country: 'GR',
      latitude: 35.2595,
      longitude: 25.7253,
      bedrooms: 4,
      bathrooms: 3,
      maxGuests: 8,
      areaSqm: 180,
      amenities: ['pool', 'wifi', 'parking', 'ac', 'sea_view', 'bbq', 'washer'],
      checkInTime: '15:00',
      checkOutTime: '11:00',
      minStayNights: 3,
      baseNightlyRate: 280,
      currency: 'EUR',
      cleaningFee: 120,
      managementFeePercent: 25,
      minimumMonthlyFee: 500,
      purchasePrice: 380000,
      purchaseDate: new Date('2024-03-15'),
      publishedAt: new Date(),
    },
  });
  console.log(`Demo Property created: ${property.name}`);

  // Create Loyalty Tiers
  const tiers = [
    { name: 'Bronze Star', minPoints: 0, multiplier: 1.0, color: '#CD7F32', sortOrder: 1, benefits: ['Standard support', 'Monthly reports'] },
    { name: 'Silver Star', minPoints: 500, multiplier: 1.25, color: '#C0C0C0', sortOrder: 2, benefits: ['Priority support', '-0.5% management fee', 'Quarterly review'] },
    { name: 'Gold Star', minPoints: 1500, multiplier: 1.5, color: '#FFD700', sortOrder: 3, benefits: ['Dedicated manager', '-1% management fee', 'Monthly review', 'Early access'] },
    { name: 'Platinum Star', minPoints: 3000, multiplier: 2.0, color: '#E5E4E2', sortOrder: 4, benefits: ['VIP manager', '-2% management fee', 'Annual meeting', 'Exclusive events', 'Concierge'] },
  ];

  for (const tier of tiers) {
    await prisma.loyaltyTier.upsert({
      where: { id: tier.name },
      update: {},
      create: {
        id: tier.name,
        name: tier.name,
        minPoints: tier.minPoints,
        multiplier: tier.multiplier,
        benefits: tier.benefits,
        color: tier.color,
        sortOrder: tier.sortOrder,
      },
    });
  }
  console.log('Loyalty Tiers created');

  console.log('Seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
