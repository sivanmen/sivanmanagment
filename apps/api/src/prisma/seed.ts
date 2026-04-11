import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ══════════════════════════════════════════════════════════════
  // 1. USERS
  // ══════════════════════════════════════════════════════════════

  const adminPasswordHash = await bcrypt.hash('Admin123!@#', 12);
  const managerPasswordHash = await bcrypt.hash('Manager123!@#', 12);
  const maintPasswordHash = await bcrypt.hash('Maint123!@#', 12);
  const ownerPasswordHash = await bcrypt.hash('Owner123!@#', 12);

  // Super Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sivanmanagment.com' },
    update: { passwordHash: adminPasswordHash, role: 'SUPER_ADMIN' },
    create: {
      email: 'admin@sivanmanagment.com',
      passwordHash: adminPasswordHash,
      firstName: 'Sivan',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      preferredLocale: 'he',
      timezone: 'Europe/Athens',
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`Super Admin created: ${admin.email}`);

  // Property Manager
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@sivanmanagment.com' },
    update: {},
    create: {
      email: 'manager@sivanmanagment.com',
      passwordHash: managerPasswordHash,
      firstName: 'Elena',
      lastName: 'Papadopoulou',
      role: 'PROPERTY_MANAGER',
      status: 'ACTIVE',
      preferredLocale: 'en',
      timezone: 'Europe/Athens',
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`Property Manager created: ${managerUser.email}`);

  // Maintenance Staff
  const maintUser = await prisma.user.upsert({
    where: { email: 'maintenance@sivanmanagment.com' },
    update: {},
    create: {
      email: 'maintenance@sivanmanagment.com',
      passwordHash: maintPasswordHash,
      firstName: 'Nikos',
      lastName: 'Stavropoulos',
      role: 'MAINTENANCE',
      status: 'ACTIVE',
      preferredLocale: 'el',
      timezone: 'Europe/Athens',
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`Maintenance Staff created: ${maintUser.email}`);

  // ══════════════════════════════════════════════════════════════
  // 2. OWNERS (3)
  // ══════════════════════════════════════════════════════════════

  // Owner 1: David Cohen - Gold tier, 25%
  const owner1User = await prisma.user.upsert({
    where: { email: 'david.cohen@sivanmanagment.com' },
    update: {},
    create: {
      email: 'david.cohen@sivanmanagment.com',
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

  const owner1 = await prisma.owner.upsert({
    where: { userId: owner1User.id },
    update: {},
    create: {
      userId: owner1User.id,
      companyName: 'Cohen Investments Ltd.',
      taxId: 'IL-514789632',
      defaultManagementFeePercent: 25,
      defaultMinimumMonthlyFee: 500,
      expenseApprovalThreshold: 200,
      contractStartDate: new Date('2024-01-01'),
      notes: 'Gold tier owner. 4 properties in Crete. Very responsive.',
      bankDetails: { iban: 'GR16 0110 1250 0000 0001 2300 695', bic: 'ETHNGRAA', bankName: 'National Bank of Greece' },
    },
  });
  console.log(`Owner 1 created: David Cohen`);

  // Owner 2: Yael Levy - Silver tier, 20%
  const owner2User = await prisma.user.upsert({
    where: { email: 'yael.levy@sivanmanagment.com' },
    update: {},
    create: {
      email: 'yael.levy@sivanmanagment.com',
      passwordHash: ownerPasswordHash,
      firstName: 'Yael',
      lastName: 'Levy',
      role: 'OWNER',
      status: 'ACTIVE',
      preferredLocale: 'he',
      timezone: 'Asia/Jerusalem',
      emailVerifiedAt: new Date(),
    },
  });

  const owner2 = await prisma.owner.upsert({
    where: { userId: owner2User.id },
    update: {},
    create: {
      userId: owner2User.id,
      companyName: 'Levy Properties',
      taxId: 'IL-302468135',
      defaultManagementFeePercent: 20,
      defaultMinimumMonthlyFee: 400,
      expenseApprovalThreshold: 150,
      contractStartDate: new Date('2024-06-01'),
      notes: 'Silver tier. 2 luxury properties. Prefers email communication.',
      bankDetails: { iban: 'GR80 0140 0640 6400 0200 0002 866', bic: 'CRBAGRAA', bankName: 'Alpha Bank' },
    },
  });
  console.log(`Owner 2 created: Yael Levy`);

  // Owner 3: Michael Ben-Ari - Bronze tier, 30%
  const owner3User = await prisma.user.upsert({
    where: { email: 'michael.benari@sivanmanagment.com' },
    update: {},
    create: {
      email: 'michael.benari@sivanmanagment.com',
      passwordHash: ownerPasswordHash,
      firstName: 'Michael',
      lastName: 'Ben-Ari',
      role: 'OWNER',
      status: 'ACTIVE',
      preferredLocale: 'en',
      timezone: 'Asia/Jerusalem',
      emailVerifiedAt: new Date(),
    },
  });

  const owner3 = await prisma.owner.upsert({
    where: { userId: owner3User.id },
    update: {},
    create: {
      userId: owner3User.id,
      taxId: 'IL-897541236',
      defaultManagementFeePercent: 30,
      defaultMinimumMonthlyFee: 300,
      expenseApprovalThreshold: 100,
      contractStartDate: new Date('2025-01-15'),
      notes: 'Bronze tier. New owner with 1 property. Learning the ropes.',
    },
  });
  console.log(`Owner 3 created: Michael Ben-Ari`);

  // ══════════════════════════════════════════════════════════════
  // 3. PROPERTIES (7 in Crete)
  // ══════════════════════════════════════════════════════════════

  // Property 1: Aegean Sunset Villa (David) - Elounda
  const prop1 = await prisma.property.upsert({
    where: { internalCode: 'CRT-001' },
    update: {},
    create: {
      ownerId: owner1.id,
      managerId: managerUser.id,
      internalCode: 'CRT-001',
      name: 'Aegean Sunset Villa',
      slug: 'aegean-sunset-villa',
      description: {
        en: 'Stunning luxury villa with panoramic views of the Aegean Sea in Elounda',
        he: 'וילה יוקרתית מרהיבה עם נוף פנורמי לים האגאי באלונדה',
      },
      propertyType: 'VILLA',
      status: 'ACTIVE',
      addressLine1: '15 Elounda Bay Road',
      city: 'Elounda',
      stateRegion: 'Crete',
      postalCode: '72053',
      country: 'GR',
      latitude: 35.2595,
      longitude: 25.7253,
      bedrooms: 3,
      bathrooms: 2,
      maxGuests: 6,
      areaSqm: 160,
      amenities: ['pool', 'wifi', 'parking', 'ac', 'sea_view', 'bbq', 'washer', 'dishwasher'],
      checkInTime: '15:00',
      checkOutTime: '11:00',
      minStayNights: 3,
      baseNightlyRate: 280,
      currency: 'EUR',
      cleaningFee: 120,
      managementFeePercent: 25,
      minimumMonthlyFee: 500,
      wifiName: 'AegeanVilla_5G',
      wifiPassword: 'sunset2026!',
      purchasePrice: 380000,
      purchaseDate: new Date('2024-03-15'),
      publishedAt: new Date('2024-04-01'),
    },
  });

  // Property 2: Heraklion Harbor Suite (David)
  const prop2 = await prisma.property.upsert({
    where: { internalCode: 'CRT-002' },
    update: {},
    create: {
      ownerId: owner1.id,
      managerId: managerUser.id,
      internalCode: 'CRT-002',
      name: 'Heraklion Harbor Suite',
      slug: 'heraklion-harbor-suite',
      description: {
        en: 'Modern 1BR apartment in the heart of Heraklion, steps from the Venetian harbor',
        he: 'דירת חדר שינה אחד מודרנית בלב הרקליון, צעדים מנמל ונציה',
      },
      propertyType: 'APARTMENT',
      status: 'ACTIVE',
      addressLine1: '28 Kornarou Square',
      city: 'Heraklion',
      stateRegion: 'Crete',
      postalCode: '71202',
      country: 'GR',
      latitude: 35.3387,
      longitude: 25.1342,
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 3,
      areaSqm: 55,
      amenities: ['wifi', 'ac', 'washer', 'city_view', 'balcony'],
      checkInTime: '14:00',
      checkOutTime: '11:00',
      minStayNights: 2,
      baseNightlyRate: 120,
      currency: 'EUR',
      cleaningFee: 50,
      managementFeePercent: 25,
      minimumMonthlyFee: 500,
      wifiName: 'HarborSuite_WiFi',
      wifiPassword: 'harbor123',
      purchasePrice: 145000,
      purchaseDate: new Date('2023-11-20'),
      publishedAt: new Date('2023-12-15'),
    },
  });

  // Property 3: Chania Old Town Residence (David)
  const prop3 = await prisma.property.upsert({
    where: { internalCode: 'CRT-003' },
    update: {},
    create: {
      ownerId: owner1.id,
      managerId: managerUser.id,
      internalCode: 'CRT-003',
      name: 'Chania Old Town Residence',
      slug: 'chania-old-town-residence',
      description: {
        en: 'Charming 2BR traditional stone house in the atmospheric old town of Chania',
        he: 'בית אבן מסורתי מקסים עם 2 חדרי שינה בעיר העתיקה של חאניה',
      },
      propertyType: 'HOUSE',
      status: 'ACTIVE',
      addressLine1: '5 Zambeliou Street',
      city: 'Chania',
      stateRegion: 'Crete',
      postalCode: '73131',
      country: 'GR',
      latitude: 35.5180,
      longitude: 24.0173,
      bedrooms: 2,
      bathrooms: 1,
      maxGuests: 4,
      areaSqm: 85,
      amenities: ['wifi', 'ac', 'washer', 'historic', 'patio'],
      checkInTime: '15:00',
      checkOutTime: '11:00',
      minStayNights: 2,
      baseNightlyRate: 180,
      currency: 'EUR',
      cleaningFee: 70,
      managementFeePercent: 25,
      minimumMonthlyFee: 500,
      wifiName: 'ChaniaResidence',
      wifiPassword: 'oldtown2024',
      purchasePrice: 210000,
      purchaseDate: new Date('2024-05-10'),
      publishedAt: new Date('2024-06-01'),
    },
  });

  // Property 4: Rethymno Beachfront Studio (David)
  const prop4 = await prisma.property.upsert({
    where: { internalCode: 'CRT-004' },
    update: {},
    create: {
      ownerId: owner1.id,
      managerId: managerUser.id,
      internalCode: 'CRT-004',
      name: 'Rethymno Beachfront Studio',
      slug: 'rethymno-beachfront-studio',
      description: {
        en: 'Cozy beachfront studio with direct beach access in Rethymno',
        he: 'סטודיו חמים על חוף הים עם גישה ישירה לחוף ברתימנו',
      },
      propertyType: 'STUDIO',
      status: 'ACTIVE',
      addressLine1: '12 Petichaki Street',
      city: 'Rethymno',
      stateRegion: 'Crete',
      postalCode: '74100',
      country: 'GR',
      latitude: 35.3692,
      longitude: 24.4765,
      bedrooms: 0,
      bathrooms: 1,
      maxGuests: 2,
      areaSqm: 35,
      amenities: ['wifi', 'ac', 'sea_view', 'beach_access', 'kitchenette'],
      checkInTime: '14:00',
      checkOutTime: '11:00',
      minStayNights: 1,
      baseNightlyRate: 95,
      currency: 'EUR',
      cleaningFee: 40,
      managementFeePercent: 25,
      minimumMonthlyFee: 500,
      wifiName: 'BeachStudio_5G',
      wifiPassword: 'beach2025!',
      purchasePrice: 98000,
      purchaseDate: new Date('2025-01-10'),
      publishedAt: new Date('2025-02-01'),
    },
  });

  // Property 5: Knossos Garden Apartment (Yael)
  const prop5 = await prisma.property.upsert({
    where: { internalCode: 'CRT-005' },
    update: {},
    create: {
      ownerId: owner2.id,
      managerId: managerUser.id,
      internalCode: 'CRT-005',
      name: 'Knossos Garden Apartment',
      slug: 'knossos-garden-apartment',
      description: {
        en: 'Modern 2BR apartment with a lush garden, near Knossos archaeological site',
        he: 'דירה מודרנית עם 2 חדרי שינה וגינה ירוקה, ליד האתר הארכיאולוגי קנוסוס',
      },
      propertyType: 'APARTMENT',
      status: 'ACTIVE',
      addressLine1: '22 Knossos Avenue',
      city: 'Heraklion',
      stateRegion: 'Crete',
      postalCode: '71409',
      country: 'GR',
      latitude: 35.2982,
      longitude: 25.1628,
      bedrooms: 2,
      bathrooms: 1,
      maxGuests: 5,
      areaSqm: 90,
      amenities: ['wifi', 'ac', 'parking', 'garden', 'washer', 'dishwasher', 'bbq'],
      checkInTime: '15:00',
      checkOutTime: '11:00',
      minStayNights: 2,
      baseNightlyRate: 150,
      currency: 'EUR',
      cleaningFee: 60,
      managementFeePercent: 20,
      minimumMonthlyFee: 400,
      wifiName: 'KnossosGarden',
      wifiPassword: 'minoan2025',
      purchasePrice: 175000,
      purchaseDate: new Date('2024-08-01'),
      publishedAt: new Date('2024-09-01'),
    },
  });

  // Property 6: Spinalonga View Villa (Yael)
  const prop6 = await prisma.property.upsert({
    where: { internalCode: 'CRT-006' },
    update: {},
    create: {
      ownerId: owner2.id,
      managerId: managerUser.id,
      internalCode: 'CRT-006',
      name: 'Spinalonga View Villa',
      slug: 'spinalonga-view-villa',
      description: {
        en: 'Luxury 4BR villa overlooking Spinalonga island in Plaka, Elounda area',
        he: 'וילה יוקרתית עם 4 חדרי שינה ונוף לאי ספינלונגה בפלאקה, אזור אלונדה',
      },
      propertyType: 'VILLA',
      status: 'ACTIVE',
      addressLine1: '3 Plaka Coastal Road',
      city: 'Plaka',
      stateRegion: 'Crete',
      postalCode: '72053',
      country: 'GR',
      latitude: 35.2753,
      longitude: 25.7348,
      bedrooms: 4,
      bathrooms: 3,
      maxGuests: 10,
      areaSqm: 220,
      amenities: ['pool', 'wifi', 'parking', 'ac', 'sea_view', 'bbq', 'washer', 'dishwasher', 'jacuzzi', 'gym'],
      checkInTime: '16:00',
      checkOutTime: '11:00',
      minStayNights: 5,
      baseNightlyRate: 350,
      currency: 'EUR',
      cleaningFee: 180,
      managementFeePercent: 20,
      minimumMonthlyFee: 400,
      wifiName: 'SpinalongaVilla',
      wifiPassword: 'island2024!',
      purchasePrice: 620000,
      purchaseDate: new Date('2024-02-20'),
      publishedAt: new Date('2024-04-15'),
    },
  });

  // Property 7: Samaria Gorge Lodge (Michael)
  const prop7 = await prisma.property.upsert({
    where: { internalCode: 'CRT-007' },
    update: {},
    create: {
      ownerId: owner3.id,
      managerId: managerUser.id,
      internalCode: 'CRT-007',
      name: 'Samaria Gorge Lodge',
      slug: 'samaria-gorge-lodge',
      description: {
        en: 'Mountain retreat with 3BR near the famous Samaria Gorge, perfect for hikers',
        he: 'מחסה הרים עם 3 חדרי שינה ליד קניון סמריה המפורסם, מושלם למטיילים',
      },
      propertyType: 'HOUSE',
      status: 'ACTIVE',
      addressLine1: '8 Mountain Path',
      city: 'Chania',
      stateRegion: 'Crete',
      postalCode: '73005',
      country: 'GR',
      latitude: 35.3264,
      longitude: 23.9632,
      bedrooms: 3,
      bathrooms: 2,
      maxGuests: 7,
      areaSqm: 130,
      amenities: ['wifi', 'parking', 'fireplace', 'mountain_view', 'garden', 'bbq', 'washer'],
      checkInTime: '15:00',
      checkOutTime: '10:00',
      minStayNights: 2,
      baseNightlyRate: 200,
      currency: 'EUR',
      cleaningFee: 80,
      managementFeePercent: 30,
      minimumMonthlyFee: 300,
      wifiName: 'SamariaLodge',
      wifiPassword: 'gorge2025!',
      purchasePrice: 240000,
      purchaseDate: new Date('2025-01-15'),
      publishedAt: new Date('2025-03-01'),
    },
  });

  // ══════════════════════════════════════════════════════════════
  // 3b. ADDITIONAL PROPERTIES (5 more — CRT-008 to CRT-012)
  // ══════════════════════════════════════════════════════════════

  // Property 8: Azure Bay Suite (David) - Chania
  const prop8 = await prisma.property.upsert({
    where: { internalCode: 'CRT-008' },
    update: {},
    create: {
      ownerId: owner1.id,
      managerId: managerUser.id,
      internalCode: 'CRT-008',
      name: 'Azure Bay Suite',
      slug: 'azure-bay-suite',
      description: {
        en: 'Elegant 2BR apartment overlooking the azure waters of Chania Bay',
        he: 'דירה אלגנטית עם 2 חדרי שינה עם נוף למפרץ התכלת של חאניה',
      },
      propertyType: 'APARTMENT',
      status: 'ACTIVE',
      addressLine1: '18 Akti Miaouli',
      city: 'Chania',
      stateRegion: 'Crete',
      postalCode: '73132',
      country: 'GR',
      latitude: 35.5175,
      longitude: 24.0185,
      bedrooms: 2,
      bathrooms: 1,
      maxGuests: 4,
      areaSqm: 75,
      amenities: ['wifi', 'ac', 'sea_view', 'balcony', 'washer', 'dishwasher'],
      checkInTime: '15:00',
      checkOutTime: '11:00',
      minStayNights: 2,
      baseNightlyRate: 150,
      currency: 'EUR',
      cleaningFee: 60,
      managementFeePercent: 25,
      minimumMonthlyFee: 500,
      wifiName: 'AzureBay_WiFi',
      wifiPassword: 'azure2026!',
      purchasePrice: 195000,
      purchaseDate: new Date('2024-07-20'),
      publishedAt: new Date('2024-09-01'),
    },
  });

  // Property 9: Olive Grove Retreat (Yael) - Rethymno
  const prop9 = await prisma.property.upsert({
    where: { internalCode: 'CRT-009' },
    update: {},
    create: {
      ownerId: owner2.id,
      managerId: managerUser.id,
      internalCode: 'CRT-009',
      name: 'Olive Grove Retreat',
      slug: 'olive-grove-retreat',
      description: {
        en: 'Beautiful 3BR villa surrounded by ancient olive groves in the Rethymno countryside',
        he: 'וילה יפהפייה עם 3 חדרי שינה מוקפת בכרמי זיתים עתיקים בכפר רתימנו',
      },
      propertyType: 'VILLA',
      status: 'ACTIVE',
      addressLine1: '7 Olive Tree Lane',
      city: 'Rethymno',
      stateRegion: 'Crete',
      postalCode: '74100',
      country: 'GR',
      latitude: 35.3650,
      longitude: 24.4830,
      bedrooms: 3,
      bathrooms: 2,
      maxGuests: 7,
      areaSqm: 145,
      amenities: ['pool', 'wifi', 'parking', 'ac', 'garden', 'bbq', 'washer', 'dishwasher', 'olive_grove'],
      checkInTime: '15:00',
      checkOutTime: '11:00',
      minStayNights: 3,
      baseNightlyRate: 220,
      currency: 'EUR',
      cleaningFee: 90,
      managementFeePercent: 20,
      minimumMonthlyFee: 400,
      wifiName: 'OliveGrove_5G',
      wifiPassword: 'olives2025!',
      purchasePrice: 310000,
      purchaseDate: new Date('2024-04-10'),
      publishedAt: new Date('2024-06-15'),
    },
  });

  // Property 10: Heraklion Harbor Flat (David) - Heraklion
  const prop10 = await prisma.property.upsert({
    where: { internalCode: 'CRT-010' },
    update: {},
    create: {
      ownerId: owner1.id,
      managerId: managerUser.id,
      internalCode: 'CRT-010',
      name: 'Heraklion Harbor Flat',
      slug: 'heraklion-harbor-flat',
      description: {
        en: 'Compact yet stylish 1BR flat steps from the Venetian fortress in Heraklion',
        he: 'דירה קטנה ומעוצבת עם חדר שינה אחד, צעדים מהמצודה הוונציאנית בהרקליון',
      },
      propertyType: 'APARTMENT',
      status: 'ACTIVE',
      addressLine1: '40 25th Avgoustou Street',
      city: 'Heraklion',
      stateRegion: 'Crete',
      postalCode: '71202',
      country: 'GR',
      latitude: 35.3420,
      longitude: 25.1338,
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      areaSqm: 42,
      amenities: ['wifi', 'ac', 'city_view', 'washer', 'kitchenette'],
      checkInTime: '14:00',
      checkOutTime: '11:00',
      minStayNights: 1,
      baseNightlyRate: 95,
      currency: 'EUR',
      cleaningFee: 35,
      managementFeePercent: 25,
      minimumMonthlyFee: 500,
      wifiName: 'HarborFlat_WiFi',
      wifiPassword: 'koules2026!',
      purchasePrice: 115000,
      purchaseDate: new Date('2025-03-01'),
      publishedAt: new Date('2025-04-15'),
    },
  });

  // Property 11: Cretan Paradise Villa (Yael) - Agios Nikolaos
  const prop11 = await prisma.property.upsert({
    where: { internalCode: 'CRT-011' },
    update: {},
    create: {
      ownerId: owner2.id,
      managerId: managerUser.id,
      internalCode: 'CRT-011',
      name: 'Cretan Paradise Villa',
      slug: 'cretan-paradise-villa',
      description: {
        en: 'Magnificent 5BR luxury villa with private infinity pool overlooking Mirabello Bay',
        he: 'וילה יוקרתית מפוארת עם 5 חדרי שינה ובריכת אינפיניטי פרטית עם נוף למפרץ מיראבלו',
      },
      propertyType: 'VILLA',
      status: 'ACTIVE',
      addressLine1: '2 Mirabello Heights',
      city: 'Agios Nikolaos',
      stateRegion: 'Crete',
      postalCode: '72100',
      country: 'GR',
      latitude: 35.1897,
      longitude: 25.7155,
      bedrooms: 5,
      bathrooms: 4,
      maxGuests: 12,
      areaSqm: 320,
      amenities: ['pool', 'wifi', 'parking', 'ac', 'sea_view', 'bbq', 'washer', 'dishwasher', 'jacuzzi', 'gym', 'home_cinema', 'wine_cellar'],
      checkInTime: '16:00',
      checkOutTime: '11:00',
      minStayNights: 5,
      baseNightlyRate: 450,
      currency: 'EUR',
      cleaningFee: 200,
      managementFeePercent: 20,
      minimumMonthlyFee: 400,
      wifiName: 'CretanParadise_5G',
      wifiPassword: 'paradise2026!',
      purchasePrice: 850000,
      purchaseDate: new Date('2023-09-15'),
      publishedAt: new Date('2023-12-01'),
    },
  });

  // Property 12: Sunset Terrace Studio (Michael) - Chania
  const prop12 = await prisma.property.upsert({
    where: { internalCode: 'CRT-012' },
    update: {},
    create: {
      ownerId: owner3.id,
      managerId: managerUser.id,
      internalCode: 'CRT-012',
      name: 'Sunset Terrace Studio',
      slug: 'sunset-terrace-studio',
      description: {
        en: 'Charming studio with a large terrace and stunning sunset views in Chania',
        he: 'סטודיו מקסים עם מרפסת גדולה ונוף שקיעות מרהיב בחאניה',
      },
      propertyType: 'STUDIO',
      status: 'ACTIVE',
      addressLine1: '31 Theotokopoulou Street',
      city: 'Chania',
      stateRegion: 'Crete',
      postalCode: '73131',
      country: 'GR',
      latitude: 35.5168,
      longitude: 24.0155,
      bedrooms: 0,
      bathrooms: 1,
      maxGuests: 2,
      areaSqm: 30,
      amenities: ['wifi', 'ac', 'sea_view', 'terrace', 'kitchenette'],
      checkInTime: '14:00',
      checkOutTime: '11:00',
      minStayNights: 1,
      baseNightlyRate: 80,
      currency: 'EUR',
      cleaningFee: 30,
      managementFeePercent: 30,
      minimumMonthlyFee: 300,
      wifiName: 'SunsetTerrace_WiFi',
      wifiPassword: 'terrace2026!',
      purchasePrice: 82000,
      purchaseDate: new Date('2025-02-01'),
      publishedAt: new Date('2025-04-01'),
    },
  });

  console.log('12 Properties created');

  // ══════════════════════════════════════════════════════════════
  // 4. GUESTS (20 — idempotent via findFirst)
  // ══════════════════════════════════════════════════════════════

  async function upsertGuest(data: {
    firstName: string; lastName: string; email: string;
    phone: string; nationality: string; language: string;
    totalStays: number; totalRevenue: number;
  }) {
    const existing = await prisma.guestProfile.findFirst({ where: { email: data.email } });
    if (existing) return existing;
    return prisma.guestProfile.create({ data });
  }

  // Original 10 guests
  const guest0 = await upsertGuest({
    firstName: 'Sarah', lastName: 'Mueller', email: 'sarah.mueller@gmail.com',
    phone: '+49 170 1234567', nationality: 'DE', language: 'de',
    totalStays: 3, totalRevenue: 4200,
  });
  const guest1 = await upsertGuest({
    firstName: 'James', lastName: 'Thompson', email: 'james.t@outlook.com',
    phone: '+44 7700 900123', nationality: 'GB', language: 'en',
    totalStays: 2, totalRevenue: 2800,
  });
  const guest2 = await upsertGuest({
    firstName: 'Marie', lastName: 'Dubois', email: 'marie.dubois@yahoo.fr',
    phone: '+33 6 12 34 56 78', nationality: 'FR', language: 'fr',
    totalStays: 1, totalRevenue: 1960,
  });
  const guest3 = await upsertGuest({
    firstName: 'Robert', lastName: 'Anderson', email: 'robert.a@gmail.com',
    phone: '+1 555 123 4567', nationality: 'US', language: 'en',
    totalStays: 2, totalRevenue: 5600,
  });
  const guest4 = await upsertGuest({
    firstName: 'Amit', lastName: 'Shapira', email: 'amit.shapira@walla.co.il',
    phone: '+972 50 123 4567', nationality: 'IL', language: 'he',
    totalStays: 4, totalRevenue: 3200,
  });
  const guest5 = await upsertGuest({
    firstName: 'Claudia', lastName: 'Schmidt', email: 'c.schmidt@web.de',
    phone: '+49 151 9876543', nationality: 'DE', language: 'de',
    totalStays: 1, totalRevenue: 840,
  });
  const guest6 = await upsertGuest({
    firstName: 'Oliver', lastName: 'Brown', email: 'oliver.brown@btinternet.com',
    phone: '+44 7911 123456', nationality: 'GB', language: 'en',
    totalStays: 1, totalRevenue: 1260,
  });
  const guest7 = await upsertGuest({
    firstName: 'Sophie', lastName: 'Martin', email: 'sophie.martin@gmail.com',
    phone: '+33 7 98 76 54 32', nationality: 'FR', language: 'fr',
    totalStays: 2, totalRevenue: 2100,
  });
  const guest8 = await upsertGuest({
    firstName: 'Daniel', lastName: 'Rosenberg', email: 'daniel.r@gmail.com',
    phone: '+972 54 987 6543', nationality: 'IL', language: 'he',
    totalStays: 1, totalRevenue: 1750,
  });
  const guest9 = await upsertGuest({
    firstName: 'Anna', lastName: 'Fischer', email: 'anna.fischer@gmx.de',
    phone: '+49 176 1111222', nationality: 'DE', language: 'de',
    totalStays: 3, totalRevenue: 3500,
  });

  // 10 new guests with diverse nationalities
  const guest10 = await upsertGuest({
    firstName: 'Pieter', lastName: 'van den Berg', email: 'pieter.vdberg@gmail.com',
    phone: '+31 6 1234 5678', nationality: 'NL', language: 'nl',
    totalStays: 2, totalRevenue: 3100,
  });
  const guest11 = await upsertGuest({
    firstName: 'Erik', lastName: 'Lindqvist', email: 'erik.lindqvist@hotmail.se',
    phone: '+46 70 123 4567', nationality: 'SE', language: 'sv',
    totalStays: 1, totalRevenue: 1540,
  });
  const guest12 = await upsertGuest({
    firstName: 'Giulia', lastName: 'Rossi', email: 'giulia.rossi@libero.it',
    phone: '+39 333 123 4567', nationality: 'IT', language: 'it',
    totalStays: 2, totalRevenue: 2800,
  });
  const guest13 = await upsertGuest({
    firstName: 'Alexei', lastName: 'Petrov', email: 'alexei.petrov@yandex.ru',
    phone: '+7 916 123 4567', nationality: 'RU', language: 'ru',
    totalStays: 1, totalRevenue: 3150,
  });
  const guest14 = await upsertGuest({
    firstName: 'Emma', lastName: 'Williams', email: 'emma.w@outlook.com.au',
    phone: '+61 412 345 678', nationality: 'AU', language: 'en',
    totalStays: 1, totalRevenue: 1960,
  });
  const guest15 = await upsertGuest({
    firstName: 'Hans', lastName: 'Braun', email: 'hans.braun@web.de',
    phone: '+49 160 9876543', nationality: 'DE', language: 'de',
    totalStays: 3, totalRevenue: 4500,
  });
  const guest16 = await upsertGuest({
    firstName: 'Charlotte', lastName: 'Evans', email: 'charlotte.evans@gmail.com',
    phone: '+44 7456 789012', nationality: 'GB', language: 'en',
    totalStays: 1, totalRevenue: 1050,
  });
  const guest17 = await upsertGuest({
    firstName: 'Jean-Pierre', lastName: 'Laurent', email: 'jplaurent@orange.fr',
    phone: '+33 6 98 76 54 32', nationality: 'FR', language: 'fr',
    totalStays: 2, totalRevenue: 2640,
  });
  const guest18 = await upsertGuest({
    firstName: 'Noa', lastName: 'Katz', email: 'noa.katz@gmail.com',
    phone: '+972 52 876 5432', nationality: 'IL', language: 'he',
    totalStays: 1, totalRevenue: 2250,
  });
  const guest19 = await upsertGuest({
    firstName: 'Jennifer', lastName: 'Davis', email: 'jennifer.davis@yahoo.com',
    phone: '+1 312 555 7890', nationality: 'US', language: 'en',
    totalStays: 2, totalRevenue: 3800,
  });

  // Build the guests array for backward compatibility with booking references
  const guests = [guest0, guest1, guest2, guest3, guest4, guest5, guest6, guest7, guest8, guest9];

  console.log('20 Guests created/verified');

  // ══════════════════════════════════════════════════════════════
  // 5. BOOKINGS (33 — idempotent via guestEmail + checkIn)
  // ══════════════════════════════════════════════════════════════

  async function upsertBooking(data: any) {
    const existing = await prisma.booking.findFirst({
      where: { guestEmail: data.guestEmail, checkIn: data.checkIn, propertyId: data.propertyId },
    });
    if (existing) return existing;
    return prisma.booking.create({ data });
  }

  // --- Past bookings (CHECKED_OUT) ---
  await upsertBooking({
    propertyId: prop1.id, guestId: guest0.id, source: 'AIRBNB', status: 'CHECKED_OUT',
    checkIn: new Date('2026-01-05'), checkOut: new Date('2026-01-12'), nights: 7,
    guestsCount: 4, adults: 2, children: 2,
    nightlyRate: 280, subtotal: 1960, cleaningFee: 120, taxes: 62.4, totalAmount: 2142.4,
    paymentStatus: 'PAID', guestName: 'Sarah Mueller', guestEmail: 'sarah.mueller@gmail.com',
    confirmedAt: new Date('2025-12-20'),
  });
  await upsertBooking({
    propertyId: prop2.id, guestId: guest1.id, source: 'BOOKING_COM', status: 'CHECKED_OUT',
    checkIn: new Date('2026-01-10'), checkOut: new Date('2026-01-15'), nights: 5,
    guestsCount: 2, adults: 2,
    nightlyRate: 120, subtotal: 600, cleaningFee: 50, taxes: 19.5, totalAmount: 669.5,
    paymentStatus: 'PAID', guestName: 'James Thompson', guestEmail: 'james.t@outlook.com',
    confirmedAt: new Date('2025-12-28'),
  });
  await upsertBooking({
    propertyId: prop3.id, guestId: guest2.id, source: 'DIRECT', status: 'CHECKED_OUT',
    checkIn: new Date('2026-01-20'), checkOut: new Date('2026-01-27'), nights: 7,
    guestsCount: 3, adults: 2, children: 1,
    nightlyRate: 180, subtotal: 1260, cleaningFee: 70, taxes: 39.9, totalAmount: 1369.9,
    paymentStatus: 'PAID', guestName: 'Marie Dubois', guestEmail: 'marie.dubois@yahoo.fr',
    confirmedAt: new Date('2026-01-10'),
  });
  await upsertBooking({
    propertyId: prop6.id, guestId: guest3.id, source: 'AIRBNB', status: 'CHECKED_OUT',
    checkIn: new Date('2026-02-01'), checkOut: new Date('2026-02-08'), nights: 7,
    guestsCount: 6, adults: 4, children: 2,
    nightlyRate: 350, subtotal: 2450, cleaningFee: 180, taxes: 78.9, totalAmount: 2708.9,
    paymentStatus: 'PAID', guestName: 'Robert Anderson', guestEmail: 'robert.a@gmail.com',
    confirmedAt: new Date('2026-01-15'),
  });
  await upsertBooking({
    propertyId: prop5.id, guestId: guest4.id, source: 'DIRECT', status: 'CHECKED_OUT',
    checkIn: new Date('2026-02-10'), checkOut: new Date('2026-02-15'), nights: 5,
    guestsCount: 4, adults: 2, children: 2,
    nightlyRate: 150, subtotal: 750, cleaningFee: 60, taxes: 24.3, totalAmount: 834.3,
    paymentStatus: 'PAID', guestName: 'Amit Shapira', guestEmail: 'amit.shapira@walla.co.il',
    confirmedAt: new Date('2026-02-01'),
  });
  await upsertBooking({
    propertyId: prop4.id, guestId: guest5.id, source: 'BOOKING_COM', status: 'CHECKED_OUT',
    checkIn: new Date('2026-02-20'), checkOut: new Date('2026-02-27'), nights: 7,
    guestsCount: 2, adults: 2,
    nightlyRate: 95, subtotal: 665, cleaningFee: 40, taxes: 21.2, totalAmount: 726.2,
    paymentStatus: 'PAID', guestName: 'Claudia Schmidt', guestEmail: 'c.schmidt@web.de',
    confirmedAt: new Date('2026-02-10'),
  });
  await upsertBooking({
    propertyId: prop7.id, guestId: guest6.id, source: 'AIRBNB', status: 'CHECKED_OUT',
    checkIn: new Date('2026-03-01'), checkOut: new Date('2026-03-08'), nights: 7,
    guestsCount: 5, adults: 3, children: 2,
    nightlyRate: 200, subtotal: 1400, cleaningFee: 80, taxes: 44.4, totalAmount: 1524.4,
    paymentStatus: 'PAID', guestName: 'Oliver Brown', guestEmail: 'oliver.brown@btinternet.com',
    confirmedAt: new Date('2026-02-18'),
  });
  await upsertBooking({
    propertyId: prop1.id, guestId: guest7.id, source: 'DIRECT', status: 'CHECKED_OUT',
    checkIn: new Date('2026-03-10'), checkOut: new Date('2026-03-17'), nights: 7,
    guestsCount: 2, adults: 2,
    nightlyRate: 280, subtotal: 1960, cleaningFee: 120, taxes: 62.4, totalAmount: 2142.4,
    paymentStatus: 'PAID', guestName: 'Sophie Martin', guestEmail: 'sophie.martin@gmail.com',
    confirmedAt: new Date('2026-03-01'),
  });

  // New CHECKED_OUT bookings on new properties
  await upsertBooking({
    propertyId: prop8.id, guestId: guest10.id, source: 'BOOKING_COM', status: 'CHECKED_OUT',
    checkIn: new Date('2026-02-05'), checkOut: new Date('2026-02-12'), nights: 7,
    guestsCount: 3, adults: 2, children: 1,
    nightlyRate: 150, subtotal: 1050, cleaningFee: 60, taxes: 33.3, totalAmount: 1143.3,
    paymentStatus: 'PAID', guestName: 'Pieter van den Berg', guestEmail: 'pieter.vdberg@gmail.com',
    confirmedAt: new Date('2026-01-20'),
  });
  await upsertBooking({
    propertyId: prop9.id, guestId: guest12.id, source: 'AIRBNB', status: 'CHECKED_OUT',
    checkIn: new Date('2026-02-15'), checkOut: new Date('2026-02-22'), nights: 7,
    guestsCount: 5, adults: 3, children: 2,
    nightlyRate: 220, subtotal: 1540, cleaningFee: 90, taxes: 48.9, totalAmount: 1678.9,
    paymentStatus: 'PAID', guestName: 'Giulia Rossi', guestEmail: 'giulia.rossi@libero.it',
    confirmedAt: new Date('2026-02-01'),
  });
  await upsertBooking({
    propertyId: prop10.id, guestId: guest14.id, source: 'DIRECT', status: 'CHECKED_OUT',
    checkIn: new Date('2026-03-01'), checkOut: new Date('2026-03-08'), nights: 7,
    guestsCount: 2, adults: 2,
    nightlyRate: 95, subtotal: 665, cleaningFee: 35, taxes: 21.0, totalAmount: 721.0,
    paymentStatus: 'PAID', guestName: 'Emma Williams', guestEmail: 'emma.w@outlook.com.au',
    confirmedAt: new Date('2026-02-15'),
  });
  await upsertBooking({
    propertyId: prop11.id, guestId: guest13.id, source: 'BOOKING_COM', status: 'CHECKED_OUT',
    checkIn: new Date('2026-02-20'), checkOut: new Date('2026-02-27'), nights: 7,
    guestsCount: 10, adults: 6, children: 4,
    nightlyRate: 450, subtotal: 3150, cleaningFee: 200, taxes: 100.5, totalAmount: 3450.5,
    paymentStatus: 'PAID', guestName: 'Alexei Petrov', guestEmail: 'alexei.petrov@yandex.ru',
    confirmedAt: new Date('2026-02-05'),
  });
  await upsertBooking({
    propertyId: prop12.id, guestId: guest16.id, source: 'AIRBNB', status: 'CHECKED_OUT',
    checkIn: new Date('2026-03-10'), checkOut: new Date('2026-03-17'), nights: 7,
    guestsCount: 2, adults: 2,
    nightlyRate: 80, subtotal: 560, cleaningFee: 30, taxes: 17.7, totalAmount: 607.7,
    paymentStatus: 'PAID', guestName: 'Charlotte Evans', guestEmail: 'charlotte.evans@gmail.com',
    confirmedAt: new Date('2026-02-28'),
  });

  // --- Cancelled ---
  await upsertBooking({
    propertyId: prop3.id, guestId: guest8.id, source: 'BOOKING_COM', status: 'CANCELLED',
    checkIn: new Date('2026-03-20'), checkOut: new Date('2026-03-25'), nights: 5,
    guestsCount: 2, adults: 2,
    nightlyRate: 180, subtotal: 900, cleaningFee: 70, taxes: 29.1, totalAmount: 999.1,
    paymentStatus: 'REFUNDED', guestName: 'Daniel Rosenberg', guestEmail: 'daniel.r@gmail.com',
    cancelledAt: new Date('2026-03-10'), cancellationReason: 'Change of plans',
  });
  await upsertBooking({
    propertyId: prop11.id, guestId: guest17.id, source: 'DIRECT', status: 'CANCELLED',
    checkIn: new Date('2026-03-25'), checkOut: new Date('2026-04-01'), nights: 7,
    guestsCount: 4, adults: 2, children: 2,
    nightlyRate: 450, subtotal: 3150, cleaningFee: 200, taxes: 100.5, totalAmount: 3450.5,
    paymentStatus: 'REFUNDED', guestName: 'Jean-Pierre Laurent', guestEmail: 'jplaurent@orange.fr',
    cancelledAt: new Date('2026-03-15'), cancellationReason: 'Flight cancelled due to strike',
  });

  // --- Currently checked in (CHECKED_IN) ---
  await upsertBooking({
    propertyId: prop1.id, guestId: guest9.id, source: 'AIRBNB', status: 'CHECKED_IN',
    checkIn: new Date('2026-04-08'), checkOut: new Date('2026-04-15'), nights: 7,
    guestsCount: 4, adults: 2, children: 2,
    nightlyRate: 280, subtotal: 1960, cleaningFee: 120, taxes: 62.4, totalAmount: 2142.4,
    paymentStatus: 'PAID', guestName: 'Anna Fischer', guestEmail: 'anna.fischer@gmx.de',
    confirmedAt: new Date('2026-03-25'),
  });
  await upsertBooking({
    propertyId: prop5.id, guestId: guest0.id, source: 'DIRECT', status: 'CHECKED_IN',
    checkIn: new Date('2026-04-09'), checkOut: new Date('2026-04-16'), nights: 7,
    guestsCount: 3, adults: 2, children: 1,
    nightlyRate: 150, subtotal: 1050, cleaningFee: 60, taxes: 33.3, totalAmount: 1143.3,
    paymentStatus: 'PAID', guestName: 'Sarah Mueller', guestEmail: 'sarah.mueller@gmail.com',
    confirmedAt: new Date('2026-03-28'),
  });
  await upsertBooking({
    propertyId: prop9.id, guestId: guest15.id, source: 'BOOKING_COM', status: 'CHECKED_IN',
    checkIn: new Date('2026-04-07'), checkOut: new Date('2026-04-14'), nights: 7,
    guestsCount: 4, adults: 2, children: 2,
    nightlyRate: 220, subtotal: 1540, cleaningFee: 90, taxes: 48.9, totalAmount: 1678.9,
    paymentStatus: 'PAID', guestName: 'Hans Braun', guestEmail: 'hans.braun@web.de',
    confirmedAt: new Date('2026-03-20'),
  });
  await upsertBooking({
    propertyId: prop11.id, guestId: guest19.id, source: 'AIRBNB', status: 'CHECKED_IN',
    checkIn: new Date('2026-04-06'), checkOut: new Date('2026-04-13'), nights: 7,
    guestsCount: 8, adults: 4, children: 4,
    nightlyRate: 450, subtotal: 3150, cleaningFee: 200, taxes: 100.5, totalAmount: 3450.5,
    paymentStatus: 'PAID', guestName: 'Jennifer Davis', guestEmail: 'jennifer.davis@yahoo.com',
    confirmedAt: new Date('2026-03-15'),
  });
  await upsertBooking({
    propertyId: prop12.id, guestId: guest11.id, source: 'DIRECT', status: 'CHECKED_IN',
    checkIn: new Date('2026-04-09'), checkOut: new Date('2026-04-16'), nights: 7,
    guestsCount: 2, adults: 2,
    nightlyRate: 80, subtotal: 560, cleaningFee: 30, taxes: 17.7, totalAmount: 607.7,
    paymentStatus: 'PAID', guestName: 'Erik Lindqvist', guestEmail: 'erik.lindqvist@hotmail.se',
    confirmedAt: new Date('2026-03-30'),
  });

  // --- Upcoming confirmed (CONFIRMED) ---
  await upsertBooking({
    propertyId: prop2.id, guestId: guest3.id, source: 'BOOKING_COM', status: 'CONFIRMED',
    checkIn: new Date('2026-04-20'), checkOut: new Date('2026-04-27'), nights: 7,
    guestsCount: 2, adults: 2,
    nightlyRate: 120, subtotal: 840, cleaningFee: 50, taxes: 26.7, totalAmount: 916.7,
    paymentStatus: 'PAID', guestName: 'Robert Anderson', guestEmail: 'robert.a@gmail.com',
    confirmedAt: new Date('2026-04-01'),
  });
  await upsertBooking({
    propertyId: prop6.id, guestId: guest4.id, source: 'DIRECT', status: 'CONFIRMED',
    checkIn: new Date('2026-04-25'), checkOut: new Date('2026-05-02'), nights: 7,
    guestsCount: 8, adults: 4, children: 4,
    nightlyRate: 350, subtotal: 2450, cleaningFee: 180, taxes: 78.9, totalAmount: 2708.9,
    paymentStatus: 'PARTIAL', guestName: 'Amit Shapira', guestEmail: 'amit.shapira@walla.co.il',
    confirmedAt: new Date('2026-04-05'),
  });
  await upsertBooking({
    propertyId: prop7.id, guestId: guest7.id, source: 'AIRBNB', status: 'CONFIRMED',
    checkIn: new Date('2026-05-01'), checkOut: new Date('2026-05-08'), nights: 7,
    guestsCount: 4, adults: 2, children: 2,
    nightlyRate: 200, subtotal: 1400, cleaningFee: 80, taxes: 44.4, totalAmount: 1524.4,
    paymentStatus: 'PENDING', guestName: 'Sophie Martin', guestEmail: 'sophie.martin@gmail.com',
    confirmedAt: new Date('2026-04-08'),
  });
  await upsertBooking({
    propertyId: prop3.id, guestId: guest1.id, source: 'BOOKING_COM', status: 'CONFIRMED',
    checkIn: new Date('2026-05-10'), checkOut: new Date('2026-05-17'), nights: 7,
    guestsCount: 3, adults: 2, children: 1,
    nightlyRate: 180, subtotal: 1260, cleaningFee: 70, taxes: 39.9, totalAmount: 1369.9,
    paymentStatus: 'PENDING', guestName: 'James Thompson', guestEmail: 'james.t@outlook.com',
    confirmedAt: new Date('2026-04-10'),
  });
  await upsertBooking({
    propertyId: prop6.id, guestId: guest9.id, source: 'AIRBNB', status: 'CONFIRMED',
    checkIn: new Date('2026-06-15'), checkOut: new Date('2026-06-25'), nights: 10,
    guestsCount: 8, adults: 4, children: 4,
    nightlyRate: 350, subtotal: 3500, cleaningFee: 180, taxes: 110.4, totalAmount: 3790.4,
    paymentStatus: 'PAID', guestName: 'Anna Fischer', guestEmail: 'anna.fischer@gmx.de',
    confirmedAt: new Date('2026-04-10'),
  });
  await upsertBooking({
    propertyId: prop8.id, guestId: guest18.id, source: 'DIRECT', status: 'CONFIRMED',
    checkIn: new Date('2026-04-20'), checkOut: new Date('2026-04-27'), nights: 7,
    guestsCount: 4, adults: 2, children: 2,
    nightlyRate: 150, subtotal: 1050, cleaningFee: 60, taxes: 33.3, totalAmount: 1143.3,
    paymentStatus: 'PAID', guestName: 'Noa Katz', guestEmail: 'noa.katz@gmail.com',
    confirmedAt: new Date('2026-04-05'),
  });
  await upsertBooking({
    propertyId: prop10.id, guestId: guest12.id, source: 'BOOKING_COM', status: 'CONFIRMED',
    checkIn: new Date('2026-05-05'), checkOut: new Date('2026-05-12'), nights: 7,
    guestsCount: 2, adults: 2,
    nightlyRate: 95, subtotal: 665, cleaningFee: 35, taxes: 21.0, totalAmount: 721.0,
    paymentStatus: 'PENDING', guestName: 'Giulia Rossi', guestEmail: 'giulia.rossi@libero.it',
    confirmedAt: new Date('2026-04-08'),
  });

  // --- Pending/Inquiry ---
  await upsertBooking({
    propertyId: prop4.id, guestId: guest2.id, source: 'VRBO', status: 'PENDING',
    checkIn: new Date('2026-05-15'), checkOut: new Date('2026-05-22'), nights: 7,
    guestsCount: 2, adults: 2,
    nightlyRate: 95, subtotal: 665, cleaningFee: 40, taxes: 21.2, totalAmount: 726.2,
    paymentStatus: 'PENDING', guestName: 'Marie Dubois', guestEmail: 'marie.dubois@yahoo.fr',
  });
  await upsertBooking({
    propertyId: prop1.id, guestId: guest8.id, source: 'DIRECT', status: 'INQUIRY',
    checkIn: new Date('2026-06-01'), checkOut: new Date('2026-06-10'), nights: 9,
    guestsCount: 5, adults: 3, children: 2,
    nightlyRate: 280, subtotal: 2520, cleaningFee: 120, taxes: 79.2, totalAmount: 2719.2,
    paymentStatus: 'PENDING', guestName: 'Daniel Rosenberg', guestEmail: 'daniel.r@gmail.com',
  });

  console.log('29 Bookings created/verified');

  // ══════════════════════════════════════════════════════════════
  // 6. INCOME RECORDS (35 — idempotent via description check)
  // ══════════════════════════════════════════════════════════════

  async function upsertIncome(data: {
    propertyId: string; ownerId: string; category: any;
    amount: number; date: Date; periodMonth: number; periodYear: number; description: string;
  }) {
    const existing = await prisma.incomeRecord.findFirst({
      where: { propertyId: data.propertyId, description: data.description, date: data.date },
    });
    if (existing) return existing;
    return prisma.incomeRecord.create({ data });
  }

  const incomeData = [
    // Original income records
    { propertyId: prop1.id, ownerId: owner1.id, category: 'RENTAL' as const, amount: 2142.4, date: new Date('2026-01-12'), periodMonth: 1, periodYear: 2026, description: 'Booking - Sarah Mueller' },
    { propertyId: prop2.id, ownerId: owner1.id, category: 'RENTAL' as const, amount: 669.5, date: new Date('2026-01-15'), periodMonth: 1, periodYear: 2026, description: 'Booking - James Thompson' },
    { propertyId: prop3.id, ownerId: owner1.id, category: 'RENTAL' as const, amount: 1369.9, date: new Date('2026-01-27'), periodMonth: 1, periodYear: 2026, description: 'Booking - Marie Dubois' },
    { propertyId: prop6.id, ownerId: owner2.id, category: 'RENTAL' as const, amount: 2708.9, date: new Date('2026-02-08'), periodMonth: 2, periodYear: 2026, description: 'Booking - Robert Anderson' },
    { propertyId: prop5.id, ownerId: owner2.id, category: 'RENTAL' as const, amount: 834.3, date: new Date('2026-02-15'), periodMonth: 2, periodYear: 2026, description: 'Booking - Amit Shapira' },
    { propertyId: prop4.id, ownerId: owner1.id, category: 'RENTAL' as const, amount: 726.2, date: new Date('2026-02-27'), periodMonth: 2, periodYear: 2026, description: 'Booking - Claudia Schmidt' },
    { propertyId: prop7.id, ownerId: owner3.id, category: 'RENTAL' as const, amount: 1524.4, date: new Date('2026-03-08'), periodMonth: 3, periodYear: 2026, description: 'Booking - Oliver Brown' },
    { propertyId: prop1.id, ownerId: owner1.id, category: 'RENTAL' as const, amount: 2142.4, date: new Date('2026-03-17'), periodMonth: 3, periodYear: 2026, description: 'Booking - Sophie Martin' },
    { propertyId: prop1.id, ownerId: owner1.id, category: 'RENTAL' as const, amount: 2142.4, date: new Date('2026-04-11'), periodMonth: 4, periodYear: 2026, description: 'Booking - Anna Fischer (current)' },
    { propertyId: prop5.id, ownerId: owner2.id, category: 'RENTAL' as const, amount: 1143.3, date: new Date('2026-04-11'), periodMonth: 4, periodYear: 2026, description: 'Booking - Sarah Mueller (current)' },
    { propertyId: prop1.id, ownerId: owner1.id, category: 'EXTRA_SERVICES' as const, amount: 150, date: new Date('2026-01-10'), periodMonth: 1, periodYear: 2026, description: 'Airport transfer' },
    { propertyId: prop6.id, ownerId: owner2.id, category: 'EXTRA_SERVICES' as const, amount: 200, date: new Date('2026-02-05'), periodMonth: 2, periodYear: 2026, description: 'Private chef dinner' },
    { propertyId: prop1.id, ownerId: owner1.id, category: 'CLEANING_FEE' as const, amount: 120, date: new Date('2026-01-12'), periodMonth: 1, periodYear: 2026, description: 'Cleaning fee - Mueller' },
    { propertyId: prop2.id, ownerId: owner1.id, category: 'CLEANING_FEE' as const, amount: 50, date: new Date('2026-01-15'), periodMonth: 1, periodYear: 2026, description: 'Cleaning fee - Thompson' },
    { propertyId: prop3.id, ownerId: owner1.id, category: 'CLEANING_FEE' as const, amount: 70, date: new Date('2026-01-27'), periodMonth: 1, periodYear: 2026, description: 'Cleaning fee - Dubois' },
    { propertyId: prop6.id, ownerId: owner2.id, category: 'CLEANING_FEE' as const, amount: 180, date: new Date('2026-02-08'), periodMonth: 2, periodYear: 2026, description: 'Cleaning fee - Anderson' },
    { propertyId: prop5.id, ownerId: owner2.id, category: 'CLEANING_FEE' as const, amount: 60, date: new Date('2026-02-15'), periodMonth: 2, periodYear: 2026, description: 'Cleaning fee - Shapira' },
    { propertyId: prop4.id, ownerId: owner1.id, category: 'CLEANING_FEE' as const, amount: 40, date: new Date('2026-02-27'), periodMonth: 2, periodYear: 2026, description: 'Cleaning fee - Schmidt' },
    { propertyId: prop7.id, ownerId: owner3.id, category: 'CLEANING_FEE' as const, amount: 80, date: new Date('2026-03-08'), periodMonth: 3, periodYear: 2026, description: 'Cleaning fee - Brown' },
    { propertyId: prop1.id, ownerId: owner1.id, category: 'CLEANING_FEE' as const, amount: 120, date: new Date('2026-03-17'), periodMonth: 3, periodYear: 2026, description: 'Cleaning fee - Martin' },
    { propertyId: prop1.id, ownerId: owner1.id, category: 'LATE_CHECKOUT' as const, amount: 80, date: new Date('2026-03-17'), periodMonth: 3, periodYear: 2026, description: 'Late checkout fee - Martin' },
    { propertyId: prop7.id, ownerId: owner3.id, category: 'EXTRA_SERVICES' as const, amount: 100, date: new Date('2026-03-05'), periodMonth: 3, periodYear: 2026, description: 'Hiking guide service' },
    { propertyId: prop4.id, ownerId: owner1.id, category: 'DAMAGE_DEPOSIT' as const, amount: 200, date: new Date('2026-02-20'), periodMonth: 2, periodYear: 2026, description: 'Security deposit - Schmidt' },
    { propertyId: prop5.id, ownerId: owner2.id, category: 'EXTRA_SERVICES' as const, amount: 75, date: new Date('2026-02-12'), periodMonth: 2, periodYear: 2026, description: 'Baby cot rental' },
    { propertyId: prop2.id, ownerId: owner1.id, category: 'EXTRA_SERVICES' as const, amount: 50, date: new Date('2026-01-12'), periodMonth: 1, periodYear: 2026, description: 'Late check-out' },
    // New income records for new properties
    { propertyId: prop8.id, ownerId: owner1.id, category: 'RENTAL' as const, amount: 1143.3, date: new Date('2026-02-12'), periodMonth: 2, periodYear: 2026, description: 'Booking - Pieter van den Berg' },
    { propertyId: prop9.id, ownerId: owner2.id, category: 'RENTAL' as const, amount: 1678.9, date: new Date('2026-02-22'), periodMonth: 2, periodYear: 2026, description: 'Booking - Giulia Rossi' },
    { propertyId: prop10.id, ownerId: owner1.id, category: 'RENTAL' as const, amount: 721.0, date: new Date('2026-03-08'), periodMonth: 3, periodYear: 2026, description: 'Booking - Emma Williams' },
    { propertyId: prop11.id, ownerId: owner2.id, category: 'RENTAL' as const, amount: 3450.5, date: new Date('2026-02-27'), periodMonth: 2, periodYear: 2026, description: 'Booking - Alexei Petrov' },
    { propertyId: prop12.id, ownerId: owner3.id, category: 'RENTAL' as const, amount: 607.7, date: new Date('2026-03-17'), periodMonth: 3, periodYear: 2026, description: 'Booking - Charlotte Evans' },
    { propertyId: prop8.id, ownerId: owner1.id, category: 'CLEANING_FEE' as const, amount: 60, date: new Date('2026-02-12'), periodMonth: 2, periodYear: 2026, description: 'Cleaning fee - van den Berg' },
    { propertyId: prop9.id, ownerId: owner2.id, category: 'CLEANING_FEE' as const, amount: 90, date: new Date('2026-02-22'), periodMonth: 2, periodYear: 2026, description: 'Cleaning fee - Rossi' },
    { propertyId: prop11.id, ownerId: owner2.id, category: 'CLEANING_FEE' as const, amount: 200, date: new Date('2026-02-27'), periodMonth: 2, periodYear: 2026, description: 'Cleaning fee - Petrov' },
    { propertyId: prop11.id, ownerId: owner2.id, category: 'EXTRA_SERVICES' as const, amount: 350, date: new Date('2026-02-25'), periodMonth: 2, periodYear: 2026, description: 'Private yacht excursion - Petrov' },
    { propertyId: prop9.id, ownerId: owner2.id, category: 'EXTRA_SERVICES' as const, amount: 120, date: new Date('2026-02-18'), periodMonth: 2, periodYear: 2026, description: 'Olive oil tasting tour - Rossi' },
  ];

  for (const inc of incomeData) {
    await upsertIncome(inc);
  }
  console.log(`${incomeData.length} Income records created/verified`);

  // ══════════════════════════════════════════════════════════════
  // 7. EXPENSE RECORDS (28 — idempotent)
  // ══════════════════════════════════════════════════════════════

  async function upsertExpense(data: {
    propertyId: string; ownerId: string; category: any;
    amount: number; date: Date; periodMonth: number; periodYear: number;
    vendor: string; description: string; isRecurring?: boolean; recurrencePattern?: string | null;
  }) {
    const existing = await prisma.expenseRecord.findFirst({
      where: { propertyId: data.propertyId, description: data.description, date: data.date },
    });
    if (existing) return existing;
    return prisma.expenseRecord.create({ data: { ...data, isRecurring: data.isRecurring || false, recurrencePattern: data.recurrencePattern || null } });
  }

  const expenseData = [
    // Original expenses
    { propertyId: prop1.id, ownerId: owner1.id, category: 'CLEANING' as const, amount: 180, date: new Date('2026-01-12'), periodMonth: 1, periodYear: 2026, vendor: 'CretaClean Co.', description: 'Deep cleaning after Mueller' },
    { propertyId: prop2.id, ownerId: owner1.id, category: 'CLEANING' as const, amount: 80, date: new Date('2026-01-15'), periodMonth: 1, periodYear: 2026, vendor: 'CretaClean Co.', description: 'Standard cleaning after Thompson' },
    { propertyId: prop3.id, ownerId: owner1.id, category: 'CLEANING' as const, amount: 100, date: new Date('2026-01-27'), periodMonth: 1, periodYear: 2026, vendor: 'CretaClean Co.', description: 'Cleaning after Dubois' },
    { propertyId: prop1.id, ownerId: owner1.id, category: 'UTILITIES' as const, amount: 245, date: new Date('2026-01-31'), periodMonth: 1, periodYear: 2026, vendor: 'DEI Electricity', description: 'January electricity bill' },
    { propertyId: prop2.id, ownerId: owner1.id, category: 'UTILITIES' as const, amount: 85, date: new Date('2026-01-31'), periodMonth: 1, periodYear: 2026, vendor: 'DEI Electricity', description: 'January electricity - Harbor Suite' },
    { propertyId: prop3.id, ownerId: owner1.id, category: 'UTILITIES' as const, amount: 120, date: new Date('2026-01-31'), periodMonth: 1, periodYear: 2026, vendor: 'DEI Electricity', description: 'January electricity - Chania Residence' },
    { propertyId: prop6.id, ownerId: owner2.id, category: 'CLEANING' as const, amount: 250, date: new Date('2026-02-08'), periodMonth: 2, periodYear: 2026, vendor: 'CretaClean Co.', description: 'Deep cleaning after Anderson' },
    { propertyId: prop5.id, ownerId: owner2.id, category: 'CLEANING' as const, amount: 100, date: new Date('2026-02-15'), periodMonth: 2, periodYear: 2026, vendor: 'CretaClean Co.', description: 'Cleaning after Shapira' },
    { propertyId: prop4.id, ownerId: owner1.id, category: 'CLEANING' as const, amount: 60, date: new Date('2026-02-27'), periodMonth: 2, periodYear: 2026, vendor: 'CretaClean Co.', description: 'Cleaning after Schmidt' },
    { propertyId: prop1.id, ownerId: owner1.id, category: 'MAINTENANCE' as const, amount: 320, date: new Date('2026-02-15'), periodMonth: 2, periodYear: 2026, vendor: 'Nikos Plumbing', description: 'Pool pump repair' },
    { propertyId: prop3.id, ownerId: owner1.id, category: 'MAINTENANCE' as const, amount: 150, date: new Date('2026-02-20'), periodMonth: 2, periodYear: 2026, vendor: 'Yannis Electric', description: 'Replace outdoor lights' },
    { propertyId: prop7.id, ownerId: owner3.id, category: 'CLEANING' as const, amount: 120, date: new Date('2026-03-08'), periodMonth: 3, periodYear: 2026, vendor: 'Mountain Cleaners', description: 'Deep cleaning after Brown' },
    { propertyId: prop1.id, ownerId: owner1.id, category: 'CLEANING' as const, amount: 180, date: new Date('2026-03-17'), periodMonth: 3, periodYear: 2026, vendor: 'CretaClean Co.', description: 'Deep cleaning after Martin' },
    { propertyId: prop6.id, ownerId: owner2.id, category: 'SUPPLIES' as const, amount: 180, date: new Date('2026-02-01'), periodMonth: 2, periodYear: 2026, vendor: 'IKEA Athens', description: 'Pool towels and linens' },
    { propertyId: prop1.id, ownerId: owner1.id, category: 'INSURANCE' as const, amount: 450, date: new Date('2026-01-15'), periodMonth: 1, periodYear: 2026, vendor: 'Ethniki Insurance', description: 'Annual property insurance - Aegean Villa', isRecurring: true, recurrencePattern: 'yearly' },
    { propertyId: prop6.id, ownerId: owner2.id, category: 'INSURANCE' as const, amount: 680, date: new Date('2026-01-15'), periodMonth: 1, periodYear: 2026, vendor: 'Ethniki Insurance', description: 'Annual property insurance - Spinalonga Villa', isRecurring: true, recurrencePattern: 'yearly' },
    { propertyId: prop7.id, ownerId: owner3.id, category: 'UTILITIES' as const, amount: 180, date: new Date('2026-02-28'), periodMonth: 2, periodYear: 2026, vendor: 'DEI Electricity', description: 'February electricity + heating' },
    { propertyId: prop5.id, ownerId: owner2.id, category: 'UTILITIES' as const, amount: 95, date: new Date('2026-02-28'), periodMonth: 2, periodYear: 2026, vendor: 'DEYA Water', description: 'February water bill' },
    { propertyId: prop1.id, ownerId: owner1.id, category: 'TAXES' as const, amount: 520, date: new Date('2026-03-31'), periodMonth: 3, periodYear: 2026, vendor: 'AADE Tax Authority', description: 'Q1 property tax' },
    { propertyId: prop7.id, ownerId: owner3.id, category: 'MAINTENANCE' as const, amount: 85, date: new Date('2026-03-15'), periodMonth: 3, periodYear: 2026, vendor: 'Manolis Repairs', description: 'Fix leaking roof tile' },
    { propertyId: prop2.id, ownerId: owner1.id, category: 'SUPPLIES' as const, amount: 65, date: new Date('2026-03-01'), periodMonth: 3, periodYear: 2026, vendor: 'AB Vasilopoulos', description: 'Welcome basket supplies' },
    { propertyId: prop4.id, ownerId: owner1.id, category: 'MAINTENANCE' as const, amount: 95, date: new Date('2026-03-10'), periodMonth: 3, periodYear: 2026, vendor: 'AC Service Crete', description: 'AC unit servicing' },
    // New expenses for new properties
    { propertyId: prop8.id, ownerId: owner1.id, category: 'CLEANING' as const, amount: 90, date: new Date('2026-02-12'), periodMonth: 2, periodYear: 2026, vendor: 'CretaClean Co.', description: 'Cleaning after van den Berg' },
    { propertyId: prop9.id, ownerId: owner2.id, category: 'CLEANING' as const, amount: 130, date: new Date('2026-02-22'), periodMonth: 2, periodYear: 2026, vendor: 'CretaClean Co.', description: 'Deep cleaning after Rossi' },
    { propertyId: prop11.id, ownerId: owner2.id, category: 'CLEANING' as const, amount: 280, date: new Date('2026-02-27'), periodMonth: 2, periodYear: 2026, vendor: 'CretaClean Co.', description: 'Premium deep cleaning after Petrov' },
    { propertyId: prop10.id, ownerId: owner1.id, category: 'UTILITIES' as const, amount: 65, date: new Date('2026-02-28'), periodMonth: 2, periodYear: 2026, vendor: 'DEI Electricity', description: 'February electricity - Harbor Flat' },
    { propertyId: prop12.id, ownerId: owner3.id, category: 'CLEANING' as const, amount: 50, date: new Date('2026-03-17'), periodMonth: 3, periodYear: 2026, vendor: 'CretaClean Co.', description: 'Cleaning after Evans' },
    { propertyId: prop11.id, ownerId: owner2.id, category: 'MAINTENANCE' as const, amount: 450, date: new Date('2026-03-01'), periodMonth: 3, periodYear: 2026, vendor: 'Pool Tech Crete', description: 'Infinity pool pump maintenance' },
  ];

  for (const exp of expenseData) {
    await upsertExpense(exp);
  }
  console.log(`${expenseData.length} Expense records created/verified`);

  // ══════════════════════════════════════════════════════════════
  // 8. MANAGEMENT FEE CALCULATIONS
  // ══════════════════════════════════════════════════════════════

  const feeCalcs = [
    // January 2026 - David's properties
    { ownerId: owner1.id, propertyId: prop1.id, month: 1, year: 2026, income: 2412.4, feePct: 25, minFee: 500 },
    { ownerId: owner1.id, propertyId: prop2.id, month: 1, year: 2026, income: 769.5, feePct: 25, minFee: 500 },
    { ownerId: owner1.id, propertyId: prop3.id, month: 1, year: 2026, income: 1439.9, feePct: 25, minFee: 500 },
    { ownerId: owner1.id, propertyId: prop4.id, month: 1, year: 2026, income: 0, feePct: 25, minFee: 500 },
    // February 2026
    { ownerId: owner2.id, propertyId: prop6.id, month: 2, year: 2026, income: 3088.9, feePct: 20, minFee: 400 },
    { ownerId: owner2.id, propertyId: prop5.id, month: 2, year: 2026, income: 969.3, feePct: 20, minFee: 400 },
    { ownerId: owner1.id, propertyId: prop4.id, month: 2, year: 2026, income: 966.2, feePct: 25, minFee: 500 },
    // March 2026
    { ownerId: owner3.id, propertyId: prop7.id, month: 3, year: 2026, income: 1704.4, feePct: 30, minFee: 300 },
    { ownerId: owner1.id, propertyId: prop1.id, month: 3, year: 2026, income: 2342.4, feePct: 25, minFee: 500 },
  ];

  for (const fc of feeCalcs) {
    const calculatedFee = (fc.income * fc.feePct) / 100;
    const appliedFee = Math.max(calculatedFee, fc.minFee);
    const feeType = calculatedFee >= fc.minFee ? 'PERCENTAGE' as const : 'MINIMUM' as const;

    await prisma.managementFeeCalculation.upsert({
      where: {
        ownerId_propertyId_periodMonth_periodYear: {
          ownerId: fc.ownerId,
          propertyId: fc.propertyId,
          periodMonth: fc.month,
          periodYear: fc.year,
        },
      },
      update: {},
      create: {
        ownerId: fc.ownerId,
        propertyId: fc.propertyId,
        periodMonth: fc.month,
        periodYear: fc.year,
        totalIncome: fc.income,
        feePercent: fc.feePct,
        calculatedFee,
        minimumFee: fc.minFee,
        appliedFee,
        feeType,
        status: fc.month === 1 ? 'PAID' : fc.month === 2 ? 'INVOICED' : 'DRAFT',
      },
    });
  }
  console.log(`${feeCalcs.length} Management fee calculations created`);

  // ══════════════════════════════════════════════════════════════
  // 9. LOYALTY TIERS & MEMBERS
  // ══════════════════════════════════════════════════════════════

  const tiers = [
    { name: 'Bronze Star', minPoints: 0, multiplier: 1.0, color: '#CD7F32', sortOrder: 1, benefits: ['Standard support', 'Monthly reports'] },
    { name: 'Silver Star', minPoints: 500, multiplier: 1.25, color: '#C0C0C0', sortOrder: 2, benefits: ['Priority support', '-0.5% management fee', 'Quarterly review'] },
    { name: 'Gold Star', minPoints: 1500, multiplier: 1.5, color: '#FFD700', sortOrder: 3, benefits: ['Dedicated manager', '-1% management fee', 'Monthly review', 'Early access'] },
    { name: 'Platinum Star', minPoints: 3000, multiplier: 2.0, color: '#E5E4E2', sortOrder: 4, benefits: ['VIP manager', '-2% management fee', 'Annual meeting', 'Exclusive events', 'Concierge'] },
  ];

  const tierRecords: Record<string, any> = {};
  for (const tier of tiers) {
    const rec = await prisma.loyaltyTier.upsert({
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
    tierRecords[tier.name] = rec;
  }
  console.log('Loyalty Tiers created');

  // Loyalty Members (3 owners)
  await prisma.loyaltyMember.upsert({
    where: { userId: owner1User.id },
    update: {},
    create: {
      userId: owner1User.id,
      tierId: tierRecords['Gold Star'].id,
      totalPointsEarned: 2200,
      currentPoints: 1800,
    },
  });

  await prisma.loyaltyMember.upsert({
    where: { userId: owner2User.id },
    update: {},
    create: {
      userId: owner2User.id,
      tierId: tierRecords['Silver Star'].id,
      totalPointsEarned: 850,
      currentPoints: 700,
    },
  });

  await prisma.loyaltyMember.upsert({
    where: { userId: owner3User.id },
    update: {},
    create: {
      userId: owner3User.id,
      tierId: tierRecords['Bronze Star'].id,
      totalPointsEarned: 150,
      currentPoints: 150,
    },
  });
  console.log('3 Loyalty Members created');

  // ══════════════════════════════════════════════════════════════
  // 10. MAINTENANCE REQUESTS (12 — idempotent via title + propertyId)
  // ══════════════════════════════════════════════════════════════

  async function upsertMaintenance(data: any) {
    const existing = await prisma.maintenanceRequest.findFirst({
      where: { propertyId: data.propertyId, title: data.title },
    });
    if (existing) return existing;
    return prisma.maintenanceRequest.create({ data });
  }

  // Original 4
  await upsertMaintenance({
    propertyId: prop1.id,
    reportedById: admin.id,
    assignedToId: maintUser.id,
    title: 'Pool pump making noise',
    description: 'The pool pump has been making an unusual grinding noise since yesterday. Needs inspection.',
    priority: 'HIGH',
    status: 'COMPLETED',
    category: 'APPLIANCE',
    estimatedCost: 300,
    actualCost: 320,
    scheduledDate: new Date('2026-02-14'),
    completedAt: new Date('2026-02-15'),
    completionNotes: 'Replaced worn bearing in pool pump motor. Working normally now.',
  });

  await upsertMaintenance({
    propertyId: prop3.id,
    reportedById: managerUser.id,
    assignedToId: maintUser.id,
    title: 'Replace outdoor lighting',
    description: 'Several outdoor lights on the patio have burned out. Need LED replacements.',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    category: 'ELECTRICAL',
    estimatedCost: 120,
    actualCost: 150,
    scheduledDate: new Date('2026-02-19'),
    completedAt: new Date('2026-02-20'),
    completionNotes: 'Replaced 5 outdoor LED bulbs and fixed one faulty socket.',
  });

  await upsertMaintenance({
    propertyId: prop7.id,
    reportedById: admin.id,
    assignedToId: maintUser.id,
    title: 'Leaking roof tile',
    description: 'Guest reported a small leak near the bathroom skylight when it rains heavily.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    category: 'STRUCTURAL',
    estimatedCost: 100,
    scheduledDate: new Date('2026-04-12'),
  });

  await upsertMaintenance({
    propertyId: prop4.id,
    reportedById: managerUser.id,
    title: 'AC unit annual service',
    description: 'Scheduled annual servicing for the AC unit before summer season.',
    priority: 'LOW',
    status: 'OPEN',
    category: 'HVAC',
    estimatedCost: 95,
  });

  // 8 new maintenance requests across properties
  await upsertMaintenance({
    propertyId: prop8.id,
    reportedById: managerUser.id,
    assignedToId: maintUser.id,
    title: 'Bathroom faucet dripping',
    description: 'The master bathroom faucet has a constant slow drip. Washer likely needs replacement.',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    category: 'PLUMBING',
    estimatedCost: 60,
    actualCost: 45,
    scheduledDate: new Date('2026-03-05'),
    completedAt: new Date('2026-03-05'),
    completionNotes: 'Replaced washer and O-ring. No more dripping.',
  });

  await upsertMaintenance({
    propertyId: prop9.id,
    reportedById: admin.id,
    assignedToId: maintUser.id,
    title: 'Pool filter replacement',
    description: 'Pool water clarity has decreased. Sand filter media needs replacement — last changed 3 years ago.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    category: 'APPLIANCE',
    estimatedCost: 280,
    scheduledDate: new Date('2026-04-10'),
  });

  await upsertMaintenance({
    propertyId: prop10.id,
    reportedById: managerUser.id,
    title: 'Kitchen extractor fan broken',
    description: 'The kitchen extractor fan stopped working. Motor may need replacement.',
    priority: 'MEDIUM',
    status: 'OPEN',
    category: 'APPLIANCE',
    estimatedCost: 150,
  });

  await upsertMaintenance({
    propertyId: prop11.id,
    reportedById: admin.id,
    assignedToId: maintUser.id,
    title: 'Infinity pool tile crack',
    description: 'Small crack found in the infinity pool edge tiles. Needs professional repair before it worsens.',
    priority: 'HIGH',
    status: 'WAITING_PARTS',
    category: 'STRUCTURAL',
    estimatedCost: 800,
    scheduledDate: new Date('2026-04-18'),
  });

  await upsertMaintenance({
    propertyId: prop12.id,
    reportedById: managerUser.id,
    assignedToId: maintUser.id,
    title: 'Terrace railing loose',
    description: 'The terrace railing has become loose on the left side. Safety concern — needs immediate attention.',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    category: 'STRUCTURAL',
    estimatedCost: 200,
    scheduledDate: new Date('2026-04-11'),
  });

  await upsertMaintenance({
    propertyId: prop9.id,
    reportedById: managerUser.id,
    title: 'Garden irrigation system leak',
    description: 'The olive grove irrigation system has a leak in the main pipe near the pool area.',
    priority: 'LOW',
    status: 'OPEN',
    category: 'PLUMBING',
    estimatedCost: 120,
  });

  await upsertMaintenance({
    propertyId: prop11.id,
    reportedById: admin.id,
    assignedToId: maintUser.id,
    title: 'Home cinema projector bulb',
    description: 'Projector bulb in the home cinema room is dimming. Replacement bulb ordered.',
    priority: 'LOW',
    status: 'WAITING_PARTS',
    category: 'APPLIANCE',
    estimatedCost: 350,
  });

  await upsertMaintenance({
    propertyId: prop8.id,
    reportedById: admin.id,
    title: 'Balcony door seal worn',
    description: 'The balcony sliding door seal is worn, causing a draft. Needs new weatherstripping.',
    priority: 'MEDIUM',
    status: 'OPEN',
    category: 'STRUCTURAL',
    estimatedCost: 80,
  });

  console.log('12 Maintenance requests created/verified');

  // ══════════════════════════════════════════════════════════════
  // 11. TASKS (8 — idempotent via title + propertyId)
  // ══════════════════════════════════════════════════════════════

  async function upsertTask(data: any) {
    const existing = await prisma.task.findFirst({
      where: { propertyId: data.propertyId, title: data.title },
    });
    if (existing) return existing;
    return prisma.task.create({ data });
  }

  const task1 = await upsertTask({
    propertyId: prop1.id,
    title: 'Prepare welcome basket',
    description: 'Prepare welcome basket with wine, olives, and local treats for upcoming guest',
    type: 'SUPPLY_RESTOCK',
    priority: 'TASK_MEDIUM',
    status: 'TASK_COMPLETED',
    dueDate: new Date('2026-04-07'),
    completedAt: new Date('2026-04-07'),
    createdById: admin.id,
  });

  const task2 = await upsertTask({
    propertyId: prop1.id,
    title: 'Deep clean before Fischer arrival',
    type: 'CLEANING',
    priority: 'TASK_HIGH',
    status: 'TASK_COMPLETED',
    dueDate: new Date('2026-04-08'),
    completedAt: new Date('2026-04-08'),
    estimatedDurationMin: 180,
    actualDurationMin: 200,
    checklist: [
      { item: 'Kitchen deep clean', completed: true },
      { item: 'Bathroom sanitize', completed: true },
      { item: 'Change all linens', completed: true },
      { item: 'Pool area clean', completed: true },
    ],
    createdById: admin.id,
  });

  await upsertTask({
    propertyId: prop5.id,
    title: 'Check-in handover - Sarah Mueller',
    type: 'CHECK_IN',
    priority: 'TASK_HIGH',
    status: 'TASK_COMPLETED',
    dueDate: new Date('2026-04-09'),
    completedAt: new Date('2026-04-09'),
    estimatedDurationMin: 30,
    createdById: managerUser.id,
  });

  await upsertTask({
    propertyId: prop2.id,
    title: 'Prepare for Anderson arrival',
    type: 'CHECK_IN',
    priority: 'TASK_HIGH',
    status: 'TASK_PENDING',
    dueDate: new Date('2026-04-20'),
    estimatedDurationMin: 45,
    createdById: admin.id,
  });

  await upsertTask({
    propertyId: prop1.id,
    title: 'Check-out inspection - Fischer',
    type: 'CHECK_OUT',
    priority: 'TASK_MEDIUM',
    status: 'TASK_PENDING',
    dueDate: new Date('2026-04-15'),
    estimatedDurationMin: 30,
    checklist: [
      { item: 'Check for damages', completed: false },
      { item: 'Inventory check', completed: false },
      { item: 'Key return', completed: false },
    ],
    createdById: admin.id,
  });

  await upsertTask({
    propertyId: prop6.id,
    title: 'Pool chemical balance check',
    type: 'INSPECTION',
    priority: 'TASK_LOW',
    status: 'TASK_PENDING',
    dueDate: new Date('2026-04-18'),
    estimatedDurationMin: 20,
    createdById: managerUser.id,
  });

  await upsertTask({
    propertyId: prop4.id,
    title: 'Restock bathroom amenities',
    type: 'SUPPLY_RESTOCK',
    priority: 'TASK_LOW',
    status: 'TASK_PENDING',
    dueDate: new Date('2026-04-14'),
    createdById: managerUser.id,
  });

  await upsertTask({
    propertyId: prop7.id,
    title: 'Fix roof tile - urgent',
    type: 'TASK_MAINTENANCE',
    priority: 'TASK_URGENT',
    status: 'TASK_IN_PROGRESS',
    dueDate: new Date('2026-04-12'),
    estimatedDurationMin: 120,
    createdById: admin.id,
  });

  // Task assignments (idempotent)
  const existingAssignment1 = await prisma.taskAssignment.findFirst({
    where: { taskId: task1.id, userId: managerUser.id },
  });
  if (!existingAssignment1) {
    await prisma.taskAssignment.create({
      data: { taskId: task1.id, userId: managerUser.id, role: 'ASSIGNEE', status: 'ACCEPTED' },
    });
  }
  const existingAssignment2 = await prisma.taskAssignment.findFirst({
    where: { taskId: task2.id, userId: maintUser.id },
  });
  if (!existingAssignment2) {
    await prisma.taskAssignment.create({
      data: { taskId: task2.id, userId: maintUser.id, role: 'ASSIGNEE', status: 'ACCEPTED' },
    });
  }

  console.log('8 Tasks created/verified');

  // ══════════════════════════════════════════════════════════════
  // 12. DOCUMENTS (5 — idempotent via title)
  // ══════════════════════════════════════════════════════════════

  async function upsertDocument(data: any) {
    const existing = await prisma.document.findFirst({
      where: { title: data.title },
    });
    if (existing) return existing;
    return prisma.document.create({ data });
  }

  await upsertDocument({
    propertyId: prop1.id,
    ownerId: owner1.id,
    uploadedById: admin.id,
    title: 'Property Management Contract - Aegean Sunset Villa',
    fileUrl: '/documents/contracts/aegean-villa-contract.pdf',
    fileSize: 245000,
    mimeType: 'application/pdf',
    category: 'CONTRACT',
    accessLevel: 'OWNER_VISIBLE',
  });

  await upsertDocument({
    propertyId: prop6.id,
    ownerId: owner2.id,
    uploadedById: admin.id,
    title: 'Insurance Policy - Spinalonga View Villa',
    fileUrl: '/documents/insurance/spinalonga-insurance-2026.pdf',
    fileSize: 180000,
    mimeType: 'application/pdf',
    category: 'INSURANCE',
    accessLevel: 'OWNER_VISIBLE',
    expiresAt: new Date('2027-01-15'),
  });

  await upsertDocument({
    ownerId: owner1.id,
    uploadedById: admin.id,
    title: 'Q1 2026 Financial Report - David Cohen',
    fileUrl: '/documents/reports/q1-2026-cohen.pdf',
    fileSize: 320000,
    mimeType: 'application/pdf',
    category: 'REPORT',
    accessLevel: 'OWNER_VISIBLE',
  });

  await upsertDocument({
    propertyId: prop7.id,
    ownerId: owner3.id,
    uploadedById: admin.id,
    title: 'Tax Certificate - Samaria Gorge Lodge',
    fileUrl: '/documents/tax/samaria-tax-cert-2025.pdf',
    fileSize: 95000,
    mimeType: 'application/pdf',
    category: 'TAX',
    accessLevel: 'ADMIN_ONLY',
  });

  await upsertDocument({
    propertyId: prop1.id,
    uploadedById: managerUser.id,
    title: 'Property Photos - Aegean Sunset Villa (Updated)',
    fileUrl: '/documents/photos/aegean-villa-photos.zip',
    fileSize: 15000000,
    mimeType: 'application/zip',
    category: 'PHOTO',
    accessLevel: 'PUBLIC',
  });

  console.log('5 Documents created/verified');

  // ══════════════════════════════════════════════════════════════
  // 13. MESSAGE THREADS (3 — idempotent via subject)
  // ══════════════════════════════════════════════════════════════

  async function upsertThread(data: any, messages: any[]) {
    const existing = await prisma.messageThread.findFirst({
      where: { subject: data.subject },
    });
    if (existing) return existing;
    const thread = await prisma.messageThread.create({ data });
    for (const msg of messages) {
      await prisma.guestMessage.create({ data: { ...msg, threadId: thread.id } });
    }
    return thread;
  }

  await upsertThread(
    {
      propertyId: prop1.id,
      guestId: guest9.id,
      channel: 'WHATSAPP',
      subject: 'Check-in details for Anna Fischer',
      status: 'OPEN',
      assignedToId: managerUser.id,
      lastMessageAt: new Date('2026-04-08T10:30:00Z'),
      unreadCount: 1,
    },
    [
      { senderType: 'GUEST', content: 'Hi! I will be arriving around 16:00 tomorrow. Is that OK for check-in?', sentAt: new Date('2026-04-07T14:00:00Z'), isRead: true },
      { senderType: 'STAFF', senderId: managerUser.id, content: 'Hello Anna! Yes, 16:00 is perfect. I will be there to welcome you. The WiFi password is sunset2026!', sentAt: new Date('2026-04-07T14:15:00Z'), isRead: true },
      { senderType: 'GUEST', content: 'Thank you! One more question - is the pool heated?', sentAt: new Date('2026-04-08T10:30:00Z'), isRead: false },
    ],
  );

  await upsertThread(
    {
      propertyId: prop5.id,
      guestId: guest0.id,
      channel: 'EMAIL',
      subject: 'Welcome back to Crete!',
      status: 'RESOLVED',
      assignedToId: managerUser.id,
      lastMessageAt: new Date('2026-04-09T09:00:00Z'),
      unreadCount: 0,
    },
    [
      { senderType: 'SYSTEM', content: 'Automated: Welcome back message sent to Sarah Mueller for Knossos Garden Apartment.', contentType: 'TEMPLATE', sentAt: new Date('2026-04-08T08:00:00Z'), isRead: true },
      { senderType: 'GUEST', content: 'Thank you for the warm welcome! We are so happy to be back in Crete. The apartment looks even better than last time!', sentAt: new Date('2026-04-09T09:00:00Z'), isRead: true },
    ],
  );

  await upsertThread(
    {
      ownerId: owner1.id,
      channel: 'EMAIL',
      subject: 'Q1 Financial Report Ready',
      status: 'AWAITING_REPLY',
      assignedToId: admin.id,
      lastMessageAt: new Date('2026-04-05T11:00:00Z'),
      unreadCount: 0,
    },
    [
      { senderType: 'STAFF', senderId: admin.id, content: 'Dear David, your Q1 2026 financial report is ready for review. Total income across all properties: EUR 8,534. Net management fees: EUR 2,133. Please let me know if you have any questions.', sentAt: new Date('2026-04-05T11:00:00Z'), isRead: true },
    ],
  );

  console.log('3 Message threads created/verified');

  console.log('\nSeeding completed successfully!');
  console.log('Summary: 12 properties, 20 guests, 29 bookings, 35 income records, 28 expense records, 12 maintenance requests');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seeding error:', e);
    await prisma.$disconnect();
    // Don't exit with error code - allow server to start even if seed fails
    if (require.main === module) {
      process.exit(1);
    }
  });
