import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({ log: ['warn', 'error'] });

async function main() {
  console.log(`[SEED] Starting database seed at ${new Date().toISOString()}`);

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

  // ══════════════════════════════════════════════════════════════
  // NOTIFICATION TEMPLATES
  // ══════════════════════════════════════════════════════════════

  const emailWrap = (bodyContent: string) =>
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif}a{color:#6b38d4}</style></head><body><div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden"><div style="background:#030303;padding:24px 32px;text-align:center"><h1 style="color:#ffffff;margin:0;font-size:22px">Sivan <span style="color:#6b38d4">Management</span></h1></div><div style="padding:32px">${bodyContent}</div><div style="background:#030303;padding:16px 32px;text-align:center;font-size:12px;color:#999999">&copy; Sivan Management | Vacation Rentals in Greece</div></div></body></html>`;

  const notificationTemplates = [
    {
      slug: 'booking_confirmation',
      category: 'booking',
      name: {
        en: 'Booking Confirmation',
        he: 'אישור הזמנה',
        de: 'Buchungsbestätigung',
        es: 'Confirmación de Reserva',
        fr: 'Confirmation de Réservation',
        ru: 'Подтверждение бронирования',
      },
      description: 'Sent to guest when a booking is confirmed',
      emailSubject: {
        en: 'Your booking at {{propertyName}} is confirmed!',
        he: 'ההזמנה שלך ב-{{propertyName}} אושרה!',
        de: 'Ihre Buchung bei {{propertyName}} ist bestätigt!',
        es: '¡Tu reserva en {{propertyName}} está confirmada!',
        fr: 'Votre réservation à {{propertyName}} est confirmée !',
        ru: 'Ваше бронирование в {{propertyName}} подтверждено!',
      },
      emailBody: {
        en: emailWrap('<p>Dear {{guestName}},</p><p>Your booking at <strong>{{propertyName}}</strong> is confirmed!</p><p><strong>Check-in:</strong> {{checkIn}}<br><strong>Check-out:</strong> {{checkOut}}<br><strong>Total:</strong> &euro;{{totalAmount}}</p><p>We look forward to welcoming you!</p><p>Best regards,<br>Sivan Management</p>'),
        he: emailWrap('<div dir="rtl"><p>{{guestName}} שלום,</p><p>ההזמנה שלך ב-<strong>{{propertyName}}</strong> אושרה!</p><p><strong>צ\'ק-אין:</strong> {{checkIn}}<br><strong>צ\'ק-אאוט:</strong> {{checkOut}}<br><strong>סה"כ:</strong> &euro;{{totalAmount}}</p><p>מצפים לארח אותך!</p><p>בברכה,<br>Sivan Management</p></div>'),
        de: emailWrap('<p>Liebe/r {{guestName}},</p><p>Ihre Buchung bei <strong>{{propertyName}}</strong> ist bestätigt!</p><p><strong>Check-in:</strong> {{checkIn}}<br><strong>Check-out:</strong> {{checkOut}}<br><strong>Gesamt:</strong> &euro;{{totalAmount}}</p><p>Wir freuen uns auf Ihren Besuch!</p><p>Mit freundlichen Grüßen,<br>Sivan Management</p>'),
        es: emailWrap('<p>Estimado/a {{guestName}},</p><p>¡Tu reserva en <strong>{{propertyName}}</strong> está confirmada!</p><p><strong>Check-in:</strong> {{checkIn}}<br><strong>Check-out:</strong> {{checkOut}}<br><strong>Total:</strong> &euro;{{totalAmount}}</p><p>¡Esperamos darte la bienvenida!</p><p>Saludos cordiales,<br>Sivan Management</p>'),
        fr: emailWrap('<p>Cher/Chère {{guestName}},</p><p>Votre réservation à <strong>{{propertyName}}</strong> est confirmée !</p><p><strong>Arrivée :</strong> {{checkIn}}<br><strong>Départ :</strong> {{checkOut}}<br><strong>Total :</strong> &euro;{{totalAmount}}</p><p>Nous avons hâte de vous accueillir !</p><p>Cordialement,<br>Sivan Management</p>'),
        ru: emailWrap('<p>Уважаемый(ая) {{guestName}},</p><p>Ваше бронирование в <strong>{{propertyName}}</strong> подтверждено!</p><p><strong>Заезд:</strong> {{checkIn}}<br><strong>Выезд:</strong> {{checkOut}}<br><strong>Итого:</strong> &euro;{{totalAmount}}</p><p>Ждём Вас с нетерпением!</p><p>С уважением,<br>Sivan Management</p>'),
      },
      whatsappBody: {
        en: 'Hi {{guestName}}! Your booking at {{propertyName}} is confirmed. Check-in: {{checkIn}}, Check-out: {{checkOut}}. Total: EUR {{totalAmount}}. We look forward to welcoming you!',
        he: 'שלום {{guestName}}! ההזמנה שלך ב-{{propertyName}} אושרה. צ\'ק-אין: {{checkIn}}, צ\'ק-אאוט: {{checkOut}}. סה"כ: EUR {{totalAmount}}. מצפים לראותך!',
        de: 'Hallo {{guestName}}! Ihre Buchung bei {{propertyName}} ist bestätigt. Check-in: {{checkIn}}, Check-out: {{checkOut}}. Gesamt: EUR {{totalAmount}}. Wir freuen uns auf Sie!',
        es: 'Hola {{guestName}}! Tu reserva en {{propertyName}} está confirmada. Check-in: {{checkIn}}, Check-out: {{checkOut}}. Total: EUR {{totalAmount}}. ¡Te esperamos!',
        fr: 'Bonjour {{guestName}} ! Votre réservation à {{propertyName}} est confirmée. Arrivée : {{checkIn}}, Départ : {{checkOut}}. Total : EUR {{totalAmount}}. À bientôt !',
        ru: 'Здравствуйте, {{guestName}}! Ваше бронирование в {{propertyName}} подтверждено. Заезд: {{checkIn}}, Выезд: {{checkOut}}. Итого: EUR {{totalAmount}}. Ждём Вас!',
      },
      smsBody: {
        en: 'Booking confirmed at {{propertyName}}. {{checkIn}}-{{checkOut}}. Total: EUR {{totalAmount}}. Sivan Management',
        he: 'הזמנה אושרה ב-{{propertyName}}. {{checkIn}}-{{checkOut}}. סה"כ: EUR {{totalAmount}}. Sivan Management',
        de: 'Buchung bestätigt: {{propertyName}}. {{checkIn}}-{{checkOut}}. Gesamt: EUR {{totalAmount}}. Sivan Management',
        es: 'Reserva confirmada en {{propertyName}}. {{checkIn}}-{{checkOut}}. Total: EUR {{totalAmount}}. Sivan Management',
        fr: 'Réservation confirmée: {{propertyName}}. {{checkIn}}-{{checkOut}}. Total: EUR {{totalAmount}}. Sivan Management',
        ru: 'Бронирование подтверждено: {{propertyName}}. {{checkIn}}-{{checkOut}}. Итого: EUR {{totalAmount}}. Sivan Management',
      },
      variables: ['guestName', 'propertyName', 'checkIn', 'checkOut', 'totalAmount'],
      isSystem: true,
    },
    {
      slug: 'booking_cancellation',
      category: 'booking',
      name: {
        en: 'Booking Cancellation',
        he: 'ביטול הזמנה',
        de: 'Buchungsstornierung',
        es: 'Cancelación de Reserva',
        fr: 'Annulation de Réservation',
        ru: 'Отмена бронирования',
      },
      description: 'Sent to guest when a booking is cancelled',
      emailSubject: {
        en: 'Booking at {{propertyName}} has been cancelled',
        he: 'ההזמנה ב-{{propertyName}} בוטלה',
        de: 'Buchung bei {{propertyName}} wurde storniert',
        es: 'La reserva en {{propertyName}} ha sido cancelada',
        fr: 'La réservation à {{propertyName}} a été annulée',
        ru: 'Бронирование в {{propertyName}} отменено',
      },
      emailBody: {
        en: emailWrap('<p>Dear {{guestName}},</p><p>We regret to inform you that your booking at <strong>{{propertyName}}</strong> ({{checkIn}} - {{checkOut}}) has been cancelled.</p><p><strong>Cancellation reason:</strong> {{cancellationReason}}</p><p>If a refund applies, it will be processed within 5-10 business days.</p><p>If you have questions, please contact us.</p><p>Best regards,<br>Sivan Management</p>'),
        he: emailWrap('<div dir="rtl"><p>{{guestName}} שלום,</p><p>אנו מצטערים להודיעך כי ההזמנה שלך ב-<strong>{{propertyName}}</strong> ({{checkIn}} - {{checkOut}}) בוטלה.</p><p><strong>סיבת הביטול:</strong> {{cancellationReason}}</p><p>אם מגיע לך החזר, הוא יעובד תוך 5-10 ימי עסקים.</p><p>בברכה,<br>Sivan Management</p></div>'),
        de: emailWrap('<p>Liebe/r {{guestName}},</p><p>Wir bedauern Ihnen mitteilen zu müssen, dass Ihre Buchung bei <strong>{{propertyName}}</strong> ({{checkIn}} - {{checkOut}}) storniert wurde.</p><p><strong>Stornierungsgrund:</strong> {{cancellationReason}}</p><p>Eine eventuelle Rückerstattung wird innerhalb von 5-10 Werktagen bearbeitet.</p><p>Mit freundlichen Grüßen,<br>Sivan Management</p>'),
        es: emailWrap('<p>Estimado/a {{guestName}},</p><p>Lamentamos informarte que tu reserva en <strong>{{propertyName}}</strong> ({{checkIn}} - {{checkOut}}) ha sido cancelada.</p><p><strong>Motivo de cancelación:</strong> {{cancellationReason}}</p><p>Si aplica un reembolso, se procesará en 5-10 días hábiles.</p><p>Saludos cordiales,<br>Sivan Management</p>'),
        fr: emailWrap('<p>Cher/Chère {{guestName}},</p><p>Nous avons le regret de vous informer que votre réservation à <strong>{{propertyName}}</strong> ({{checkIn}} - {{checkOut}}) a été annulée.</p><p><strong>Raison :</strong> {{cancellationReason}}</p><p>Si un remboursement s\'applique, il sera traité sous 5 à 10 jours ouvrables.</p><p>Cordialement,<br>Sivan Management</p>'),
        ru: emailWrap('<p>Уважаемый(ая) {{guestName}},</p><p>Сожалеем, но Ваше бронирование в <strong>{{propertyName}}</strong> ({{checkIn}} - {{checkOut}}) было отменено.</p><p><strong>Причина:</strong> {{cancellationReason}}</p><p>Если предусмотрен возврат средств, он будет обработан в течение 5-10 рабочих дней.</p><p>С уважением,<br>Sivan Management</p>'),
      },
      whatsappBody: {
        en: 'Hi {{guestName}}, your booking at {{propertyName}} ({{checkIn}} - {{checkOut}}) has been cancelled. Reason: {{cancellationReason}}. Contact us if you have questions.',
        he: 'שלום {{guestName}}, ההזמנה שלך ב-{{propertyName}} ({{checkIn}} - {{checkOut}}) בוטלה. סיבה: {{cancellationReason}}. צור קשר אם יש שאלות.',
        de: 'Hallo {{guestName}}, Ihre Buchung bei {{propertyName}} ({{checkIn}} - {{checkOut}}) wurde storniert. Grund: {{cancellationReason}}. Kontaktieren Sie uns bei Fragen.',
        es: 'Hola {{guestName}}, tu reserva en {{propertyName}} ({{checkIn}} - {{checkOut}}) ha sido cancelada. Motivo: {{cancellationReason}}. Contáctanos si tienes preguntas.',
        fr: 'Bonjour {{guestName}}, votre réservation à {{propertyName}} ({{checkIn}} - {{checkOut}}) a été annulée. Raison : {{cancellationReason}}. Contactez-nous si besoin.',
        ru: 'Здравствуйте, {{guestName}}, Ваше бронирование в {{propertyName}} ({{checkIn}} - {{checkOut}}) отменено. Причина: {{cancellationReason}}. Свяжитесь с нами при вопросах.',
      },
      smsBody: {
        en: 'Booking cancelled: {{propertyName}} ({{checkIn}}-{{checkOut}}). Contact us for details. Sivan Management',
        he: 'הזמנה בוטלה: {{propertyName}} ({{checkIn}}-{{checkOut}}). צרו קשר לפרטים. Sivan Management',
        de: 'Buchung storniert: {{propertyName}} ({{checkIn}}-{{checkOut}}). Kontaktieren Sie uns. Sivan Management',
        es: 'Reserva cancelada: {{propertyName}} ({{checkIn}}-{{checkOut}}). Contáctenos. Sivan Management',
        fr: 'Réservation annulée: {{propertyName}} ({{checkIn}}-{{checkOut}}). Contactez-nous. Sivan Management',
        ru: 'Бронирование отменено: {{propertyName}} ({{checkIn}}-{{checkOut}}). Свяжитесь с нами. Sivan Management',
      },
      variables: ['guestName', 'propertyName', 'checkIn', 'checkOut', 'cancellationReason'],
      isSystem: true,
    },
    {
      slug: 'payment_receipt',
      category: 'payment',
      name: {
        en: 'Payment Receipt',
        he: 'קבלה על תשלום',
        de: 'Zahlungsbeleg',
        es: 'Recibo de Pago',
        fr: 'Reçu de Paiement',
        ru: 'Квитанция об оплате',
      },
      description: 'Sent when a payment is received',
      emailSubject: {
        en: 'Payment of EUR {{amount}} received - Receipt #{{receiptNumber}}',
        he: 'התקבל תשלום בסך EUR {{amount}} - קבלה מס\' {{receiptNumber}}',
        de: 'Zahlung von EUR {{amount}} erhalten - Beleg Nr. {{receiptNumber}}',
        es: 'Pago de EUR {{amount}} recibido - Recibo #{{receiptNumber}}',
        fr: 'Paiement de EUR {{amount}} reçu - Reçu #{{receiptNumber}}',
        ru: 'Получена оплата EUR {{amount}} - Квитанция №{{receiptNumber}}',
      },
      emailBody: {
        en: emailWrap('<p>Dear {{guestName}},</p><p>We have received your payment.</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Amount:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">&euro;{{amount}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Property:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Payment Method:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{paymentMethod}}</td></tr><tr><td style="padding:8px"><strong>Receipt #:</strong></td><td style="padding:8px">{{receiptNumber}}</td></tr></table><p>Thank you for your payment!</p><p>Best regards,<br>Sivan Management</p>'),
        he: emailWrap('<div dir="rtl"><p>{{guestName}} שלום,</p><p>התשלום שלך התקבל.</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>סכום:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">&euro;{{amount}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>נכס:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>אמצעי תשלום:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{paymentMethod}}</td></tr><tr><td style="padding:8px"><strong>מס\' קבלה:</strong></td><td style="padding:8px">{{receiptNumber}}</td></tr></table><p>תודה על התשלום!</p><p>בברכה,<br>Sivan Management</p></div>'),
        de: emailWrap('<p>Liebe/r {{guestName}},</p><p>Wir haben Ihre Zahlung erhalten.</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Betrag:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">&euro;{{amount}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Objekt:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Zahlungsmethode:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{paymentMethod}}</td></tr><tr><td style="padding:8px"><strong>Beleg Nr.:</strong></td><td style="padding:8px">{{receiptNumber}}</td></tr></table><p>Vielen Dank!</p><p>Mit freundlichen Grüßen,<br>Sivan Management</p>'),
        es: emailWrap('<p>Estimado/a {{guestName}},</p><p>Hemos recibido tu pago.</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Monto:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">&euro;{{amount}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Propiedad:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Método de pago:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{paymentMethod}}</td></tr><tr><td style="padding:8px"><strong>Recibo #:</strong></td><td style="padding:8px">{{receiptNumber}}</td></tr></table><p>¡Gracias por tu pago!</p><p>Saludos cordiales,<br>Sivan Management</p>'),
        fr: emailWrap('<p>Cher/Chère {{guestName}},</p><p>Nous avons bien reçu votre paiement.</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Montant :</strong></td><td style="padding:8px;border-bottom:1px solid #eee">&euro;{{amount}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Propriété :</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Mode de paiement :</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{paymentMethod}}</td></tr><tr><td style="padding:8px"><strong>Reçu # :</strong></td><td style="padding:8px">{{receiptNumber}}</td></tr></table><p>Merci pour votre paiement !</p><p>Cordialement,<br>Sivan Management</p>'),
        ru: emailWrap('<p>Уважаемый(ая) {{guestName}},</p><p>Мы получили Ваш платёж.</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Сумма:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">&euro;{{amount}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Объект:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Способ оплаты:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{paymentMethod}}</td></tr><tr><td style="padding:8px"><strong>Квитанция №:</strong></td><td style="padding:8px">{{receiptNumber}}</td></tr></table><p>Спасибо за оплату!</p><p>С уважением,<br>Sivan Management</p>'),
      },
      whatsappBody: {
        en: 'Hi {{guestName}}, we received your payment of EUR {{amount}} for {{propertyName}}. Receipt #{{receiptNumber}}. Thank you!',
        he: 'שלום {{guestName}}, התקבל התשלום שלך בסך EUR {{amount}} עבור {{propertyName}}. קבלה מס\' {{receiptNumber}}. תודה!',
        de: 'Hallo {{guestName}}, wir haben Ihre Zahlung von EUR {{amount}} für {{propertyName}} erhalten. Beleg Nr. {{receiptNumber}}. Danke!',
        es: 'Hola {{guestName}}, recibimos tu pago de EUR {{amount}} por {{propertyName}}. Recibo #{{receiptNumber}}. ¡Gracias!',
        fr: 'Bonjour {{guestName}}, nous avons reçu votre paiement de EUR {{amount}} pour {{propertyName}}. Reçu #{{receiptNumber}}. Merci !',
        ru: 'Здравствуйте, {{guestName}}, получена оплата EUR {{amount}} за {{propertyName}}. Квитанция №{{receiptNumber}}. Спасибо!',
      },
      smsBody: {
        en: 'Payment EUR {{amount}} received for {{propertyName}}. Receipt #{{receiptNumber}}. Sivan Management',
        he: 'התקבל תשלום EUR {{amount}} עבור {{propertyName}}. קבלה {{receiptNumber}}. Sivan Management',
        de: 'Zahlung EUR {{amount}} erhalten: {{propertyName}}. Beleg {{receiptNumber}}. Sivan Management',
        es: 'Pago EUR {{amount}} recibido: {{propertyName}}. Recibo {{receiptNumber}}. Sivan Management',
        fr: 'Paiement EUR {{amount}} reçu: {{propertyName}}. Reçu {{receiptNumber}}. Sivan Management',
        ru: 'Оплата EUR {{amount}} получена: {{propertyName}}. Квитанция {{receiptNumber}}. Sivan Management',
      },
      variables: ['guestName', 'propertyName', 'amount', 'paymentMethod', 'receiptNumber'],
      isSystem: true,
    },
    {
      slug: 'payment_reminder',
      category: 'payment',
      name: {
        en: 'Payment Reminder',
        he: 'תזכורת תשלום',
        de: 'Zahlungserinnerung',
        es: 'Recordatorio de Pago',
        fr: 'Rappel de Paiement',
        ru: 'Напоминание об оплате',
      },
      description: 'Sent to guest when a payment is due',
      emailSubject: {
        en: 'Payment reminder: EUR {{amount}} due for {{propertyName}}',
        he: 'תזכורת תשלום: EUR {{amount}} לתשלום עבור {{propertyName}}',
        de: 'Zahlungserinnerung: EUR {{amount}} fällig für {{propertyName}}',
        es: 'Recordatorio de pago: EUR {{amount}} pendiente para {{propertyName}}',
        fr: 'Rappel de paiement : EUR {{amount}} dû pour {{propertyName}}',
        ru: 'Напоминание: оплата EUR {{amount}} за {{propertyName}}',
      },
      emailBody: {
        en: emailWrap('<p>Dear {{guestName}},</p><p>This is a friendly reminder that a payment of <strong>&euro;{{amount}}</strong> is due for your stay at <strong>{{propertyName}}</strong>.</p><p><strong>Due date:</strong> {{dueDate}}</p><p>Please complete the payment at your earliest convenience.</p><p>If you have already made this payment, please disregard this message.</p><p>Best regards,<br>Sivan Management</p>'),
        he: emailWrap('<div dir="rtl"><p>{{guestName}} שלום,</p><p>זוהי תזכורת ידידותית כי תשלום בסך <strong>&euro;{{amount}}</strong> ממתין עבור שהותך ב-<strong>{{propertyName}}</strong>.</p><p><strong>תאריך יעד:</strong> {{dueDate}}</p><p>אנא בצע/י את התשלום בהקדם.</p><p>אם כבר שילמת, אנא התעלם/י מהודעה זו.</p><p>בברכה,<br>Sivan Management</p></div>'),
        de: emailWrap('<p>Liebe/r {{guestName}},</p><p>Wir möchten Sie freundlich daran erinnern, dass eine Zahlung von <strong>&euro;{{amount}}</strong> für Ihren Aufenthalt bei <strong>{{propertyName}}</strong> fällig ist.</p><p><strong>Fälligkeitsdatum:</strong> {{dueDate}}</p><p>Bitte tätigen Sie die Zahlung so bald wie möglich.</p><p>Mit freundlichen Grüßen,<br>Sivan Management</p>'),
        es: emailWrap('<p>Estimado/a {{guestName}},</p><p>Le recordamos que tiene un pago pendiente de <strong>&euro;{{amount}}</strong> para su estancia en <strong>{{propertyName}}</strong>.</p><p><strong>Fecha de vencimiento:</strong> {{dueDate}}</p><p>Por favor, realice el pago lo antes posible.</p><p>Saludos cordiales,<br>Sivan Management</p>'),
        fr: emailWrap('<p>Cher/Chère {{guestName}},</p><p>Nous vous rappelons qu\'un paiement de <strong>&euro;{{amount}}</strong> est dû pour votre séjour à <strong>{{propertyName}}</strong>.</p><p><strong>Date d\'échéance :</strong> {{dueDate}}</p><p>Veuillez effectuer le paiement dès que possible.</p><p>Cordialement,<br>Sivan Management</p>'),
        ru: emailWrap('<p>Уважаемый(ая) {{guestName}},</p><p>Напоминаем, что платёж в размере <strong>&euro;{{amount}}</strong> за проживание в <strong>{{propertyName}}</strong> ожидает оплаты.</p><p><strong>Срок оплаты:</strong> {{dueDate}}</p><p>Пожалуйста, произведите оплату в ближайшее время.</p><p>С уважением,<br>Sivan Management</p>'),
      },
      whatsappBody: {
        en: 'Hi {{guestName}}, friendly reminder: EUR {{amount}} is due for your stay at {{propertyName}} by {{dueDate}}. Please complete the payment at your convenience.',
        he: 'שלום {{guestName}}, תזכורת: תשלום בסך EUR {{amount}} ממתין עבור {{propertyName}} עד {{dueDate}}. אנא שלם/י בהקדם.',
        de: 'Hallo {{guestName}}, Erinnerung: EUR {{amount}} fällig für {{propertyName}} bis {{dueDate}}. Bitte zahlen Sie so bald wie möglich.',
        es: 'Hola {{guestName}}, recordatorio: EUR {{amount}} pendiente para {{propertyName}} hasta {{dueDate}}. Por favor, realice el pago.',
        fr: 'Bonjour {{guestName}}, rappel : EUR {{amount}} dû pour {{propertyName}} avant le {{dueDate}}. Merci d\'effectuer le paiement.',
        ru: 'Здравствуйте, {{guestName}}, напоминание: оплата EUR {{amount}} за {{propertyName}} до {{dueDate}}. Пожалуйста, произведите оплату.',
      },
      smsBody: {
        en: 'Reminder: EUR {{amount}} due for {{propertyName}} by {{dueDate}}. Sivan Management',
        he: 'תזכורת: EUR {{amount}} לתשלום עבור {{propertyName}} עד {{dueDate}}. Sivan Management',
        de: 'Erinnerung: EUR {{amount}} fällig für {{propertyName}} bis {{dueDate}}. Sivan Management',
        es: 'Recordatorio: EUR {{amount}} pendiente para {{propertyName}} hasta {{dueDate}}. Sivan Management',
        fr: 'Rappel: EUR {{amount}} dû pour {{propertyName}} avant le {{dueDate}}. Sivan Management',
        ru: 'Напоминание: EUR {{amount}} за {{propertyName}} до {{dueDate}}. Sivan Management',
      },
      variables: ['guestName', 'propertyName', 'amount', 'dueDate'],
      isSystem: true,
    },
    {
      slug: 'maintenance_created',
      category: 'maintenance',
      name: {
        en: 'Maintenance Request Created',
        he: 'בקשת תחזוקה נוצרה',
        de: 'Wartungsanfrage erstellt',
        es: 'Solicitud de Mantenimiento Creada',
        fr: 'Demande de Maintenance Créée',
        ru: 'Заявка на обслуживание создана',
      },
      description: 'Sent when a new maintenance request is submitted',
      emailSubject: {
        en: 'New maintenance request: {{title}} at {{propertyName}}',
        he: 'בקשת תחזוקה חדשה: {{title}} ב-{{propertyName}}',
        de: 'Neue Wartungsanfrage: {{title}} bei {{propertyName}}',
        es: 'Nueva solicitud de mantenimiento: {{title}} en {{propertyName}}',
        fr: 'Nouvelle demande de maintenance : {{title}} à {{propertyName}}',
        ru: 'Новая заявка на обслуживание: {{title}} в {{propertyName}}',
      },
      emailBody: {
        en: emailWrap('<p>A new maintenance request has been submitted.</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Title:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{title}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Property:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Priority:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{priority}}</td></tr><tr><td style="padding:8px"><strong>Description:</strong></td><td style="padding:8px">{{description}}</td></tr></table><p>Please review and assign this request.</p><p>Sivan Management</p>'),
        he: emailWrap('<div dir="rtl"><p>בקשת תחזוקה חדשה הוגשה.</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>כותרת:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{title}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>נכס:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>עדיפות:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{priority}}</td></tr><tr><td style="padding:8px"><strong>תיאור:</strong></td><td style="padding:8px">{{description}}</td></tr></table><p>אנא בדוק/י ושייכ/י את הבקשה.</p><p>Sivan Management</p></div>'),
        de: emailWrap('<p>Eine neue Wartungsanfrage wurde eingereicht.</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Titel:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{title}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Objekt:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Priorität:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{priority}}</td></tr><tr><td style="padding:8px"><strong>Beschreibung:</strong></td><td style="padding:8px">{{description}}</td></tr></table><p>Bitte überprüfen und zuweisen.</p><p>Sivan Management</p>'),
        es: emailWrap('<p>Se ha enviado una nueva solicitud de mantenimiento.</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Título:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{title}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Propiedad:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Prioridad:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{priority}}</td></tr><tr><td style="padding:8px"><strong>Descripción:</strong></td><td style="padding:8px">{{description}}</td></tr></table><p>Por favor, revise y asigne esta solicitud.</p><p>Sivan Management</p>'),
        fr: emailWrap('<p>Une nouvelle demande de maintenance a été soumise.</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Titre :</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{title}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Propriété :</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Priorité :</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{priority}}</td></tr><tr><td style="padding:8px"><strong>Description :</strong></td><td style="padding:8px">{{description}}</td></tr></table><p>Veuillez examiner et assigner cette demande.</p><p>Sivan Management</p>'),
        ru: emailWrap('<p>Подана новая заявка на обслуживание.</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Заголовок:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{title}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Объект:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Приоритет:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{priority}}</td></tr><tr><td style="padding:8px"><strong>Описание:</strong></td><td style="padding:8px">{{description}}</td></tr></table><p>Пожалуйста, проверьте и назначьте ответственного.</p><p>Sivan Management</p>'),
      },
      whatsappBody: {
        en: 'New maintenance request at {{propertyName}}: "{{title}}" (Priority: {{priority}}). Please review.',
        he: 'בקשת תחזוקה חדשה ב-{{propertyName}}: "{{title}}" (עדיפות: {{priority}}). אנא בדוק.',
        de: 'Neue Wartungsanfrage bei {{propertyName}}: "{{title}}" (Priorität: {{priority}}). Bitte prüfen.',
        es: 'Nueva solicitud de mantenimiento en {{propertyName}}: "{{title}}" (Prioridad: {{priority}}). Por favor, revise.',
        fr: 'Nouvelle demande de maintenance à {{propertyName}} : "{{title}}" (Priorité : {{priority}}). Veuillez vérifier.',
        ru: 'Новая заявка в {{propertyName}}: "{{title}}" (Приоритет: {{priority}}). Проверьте, пожалуйста.',
      },
      smsBody: {
        en: 'Maintenance: {{title}} at {{propertyName}} ({{priority}}). Sivan Management',
        he: 'תחזוקה: {{title}} ב-{{propertyName}} ({{priority}}). Sivan Management',
        de: 'Wartung: {{title}} bei {{propertyName}} ({{priority}}). Sivan Management',
        es: 'Mantenimiento: {{title}} en {{propertyName}} ({{priority}}). Sivan Management',
        fr: 'Maintenance: {{title}} à {{propertyName}} ({{priority}}). Sivan Management',
        ru: 'Обслуживание: {{title}} в {{propertyName}} ({{priority}}). Sivan Management',
      },
      variables: ['title', 'propertyName', 'priority', 'description'],
      isSystem: true,
    },
    {
      slug: 'maintenance_completed',
      category: 'maintenance',
      name: {
        en: 'Maintenance Completed',
        he: 'תחזוקה הושלמה',
        de: 'Wartung abgeschlossen',
        es: 'Mantenimiento Completado',
        fr: 'Maintenance Terminée',
        ru: 'Обслуживание завершено',
      },
      description: 'Sent when a maintenance request is marked as completed',
      emailSubject: {
        en: 'Maintenance completed: {{title}} at {{propertyName}}',
        he: 'תחזוקה הושלמה: {{title}} ב-{{propertyName}}',
        de: 'Wartung abgeschlossen: {{title}} bei {{propertyName}}',
        es: 'Mantenimiento completado: {{title}} en {{propertyName}}',
        fr: 'Maintenance terminée : {{title}} à {{propertyName}}',
        ru: 'Обслуживание завершено: {{title}} в {{propertyName}}',
      },
      emailBody: {
        en: emailWrap('<p>The following maintenance request has been completed:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Title:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{title}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Property:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px"><strong>Completed by:</strong></td><td style="padding:8px">{{completedBy}}</td></tr></table><p>If you notice any remaining issues, please submit a new request.</p><p>Sivan Management</p>'),
        he: emailWrap('<div dir="rtl"><p>בקשת התחזוקה הבאה הושלמה:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>כותרת:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{title}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>נכס:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px"><strong>בוצע על ידי:</strong></td><td style="padding:8px">{{completedBy}}</td></tr></table><p>אם יש בעיות נוספות, אנא הגש/י בקשה חדשה.</p><p>Sivan Management</p></div>'),
        de: emailWrap('<p>Die folgende Wartungsanfrage wurde abgeschlossen:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Titel:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{title}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Objekt:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px"><strong>Erledigt von:</strong></td><td style="padding:8px">{{completedBy}}</td></tr></table><p>Bei weiteren Problemen erstellen Sie bitte eine neue Anfrage.</p><p>Sivan Management</p>'),
        es: emailWrap('<p>La siguiente solicitud de mantenimiento se ha completado:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Título:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{title}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Propiedad:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px"><strong>Completado por:</strong></td><td style="padding:8px">{{completedBy}}</td></tr></table><p>Si nota algún problema restante, envíe una nueva solicitud.</p><p>Sivan Management</p>'),
        fr: emailWrap('<p>La demande de maintenance suivante a été complétée :</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Titre :</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{title}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Propriété :</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px"><strong>Complété par :</strong></td><td style="padding:8px">{{completedBy}}</td></tr></table><p>Si vous remarquez d\'autres problèmes, veuillez soumettre une nouvelle demande.</p><p>Sivan Management</p>'),
        ru: emailWrap('<p>Следующая заявка на обслуживание выполнена:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Заголовок:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{title}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Объект:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px"><strong>Выполнил:</strong></td><td style="padding:8px">{{completedBy}}</td></tr></table><p>Если остались проблемы, подайте новую заявку.</p><p>Sivan Management</p>'),
      },
      whatsappBody: {
        en: 'Maintenance completed: "{{title}}" at {{propertyName}} by {{completedBy}}. If issues remain, please let us know.',
        he: 'תחזוקה הושלמה: "{{title}}" ב-{{propertyName}} על ידי {{completedBy}}. אם יש עוד בעיות, ספרו לנו.',
        de: 'Wartung erledigt: "{{title}}" bei {{propertyName}} von {{completedBy}}. Bei weiteren Problemen melden Sie sich.',
        es: 'Mantenimiento completado: "{{title}}" en {{propertyName}} por {{completedBy}}. Si hay más problemas, avísenos.',
        fr: 'Maintenance terminée : "{{title}}" à {{propertyName}} par {{completedBy}}. Si d\'autres problèmes persistent, contactez-nous.',
        ru: 'Обслуживание завершено: "{{title}}" в {{propertyName}}, выполнил {{completedBy}}. При проблемах свяжитесь с нами.',
      },
      smsBody: {
        en: 'Maintenance done: {{title}} at {{propertyName}}. Sivan Management',
        he: 'תחזוקה הושלמה: {{title}} ב-{{propertyName}}. Sivan Management',
        de: 'Wartung erledigt: {{title}} bei {{propertyName}}. Sivan Management',
        es: 'Mantenimiento completado: {{title}} en {{propertyName}}. Sivan Management',
        fr: 'Maintenance terminée: {{title}} à {{propertyName}}. Sivan Management',
        ru: 'Обслуживание завершено: {{title}} в {{propertyName}}. Sivan Management',
      },
      variables: ['title', 'propertyName', 'completedBy'],
      isSystem: true,
    },
    {
      slug: 'guest_checkin_instructions',
      category: 'guest',
      name: {
        en: 'Guest Check-in Instructions',
        he: 'הוראות צ\'ק-אין לאורח',
        de: 'Check-in Anweisungen',
        es: 'Instrucciones de Check-in',
        fr: 'Instructions d\'Arrivée',
        ru: 'Инструкции по заселению',
      },
      description: 'Sent to guest with check-in details before arrival',
      emailSubject: {
        en: 'Check-in instructions for {{propertyName}}',
        he: 'הוראות צ\'ק-אין עבור {{propertyName}}',
        de: 'Check-in Anweisungen für {{propertyName}}',
        es: 'Instrucciones de check-in para {{propertyName}}',
        fr: 'Instructions d\'arrivée pour {{propertyName}}',
        ru: 'Инструкции по заселению в {{propertyName}}',
      },
      emailBody: {
        en: emailWrap('<p>Dear {{guestName}},</p><p>Welcome! Here are your check-in details for <strong>{{propertyName}}</strong>:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Check-in time:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{checkInTime}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Address:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{address}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>WiFi Name:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{wifiName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>WiFi Password:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{wifiPassword}}</td></tr><tr><td style="padding:8px"><strong>Access Code:</strong></td><td style="padding:8px">{{accessCode}}</td></tr></table><p>If you need assistance, contact us anytime.</p><p>Best regards,<br>Sivan Management</p>'),
        he: emailWrap('<div dir="rtl"><p>{{guestName}} שלום,</p><p>ברוכים הבאים! הנה פרטי הצ\'ק-אין עבור <strong>{{propertyName}}</strong>:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>שעת צ\'ק-אין:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{checkInTime}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>כתובת:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{address}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>שם WiFi:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{wifiName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>סיסמת WiFi:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{wifiPassword}}</td></tr><tr><td style="padding:8px"><strong>קוד כניסה:</strong></td><td style="padding:8px">{{accessCode}}</td></tr></table><p>לכל שאלה, צרו קשר בכל עת.</p><p>בברכה,<br>Sivan Management</p></div>'),
        de: emailWrap('<p>Liebe/r {{guestName}},</p><p>Willkommen! Hier sind Ihre Check-in-Details für <strong>{{propertyName}}</strong>:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Check-in Zeit:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{checkInTime}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Adresse:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{address}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>WLAN Name:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{wifiName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>WLAN Passwort:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{wifiPassword}}</td></tr><tr><td style="padding:8px"><strong>Zugangscode:</strong></td><td style="padding:8px">{{accessCode}}</td></tr></table><p>Bei Fragen kontaktieren Sie uns jederzeit.</p><p>Mit freundlichen Grüßen,<br>Sivan Management</p>'),
        es: emailWrap('<p>Estimado/a {{guestName}},</p><p>¡Bienvenido/a! Aquí están los detalles de check-in para <strong>{{propertyName}}</strong>:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Hora de check-in:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{checkInTime}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Dirección:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{address}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>WiFi:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{wifiName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Contraseña WiFi:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{wifiPassword}}</td></tr><tr><td style="padding:8px"><strong>Código de acceso:</strong></td><td style="padding:8px">{{accessCode}}</td></tr></table><p>Si necesita ayuda, contáctenos en cualquier momento.</p><p>Saludos cordiales,<br>Sivan Management</p>'),
        fr: emailWrap('<p>Cher/Chère {{guestName}},</p><p>Bienvenue ! Voici vos détails d\'arrivée pour <strong>{{propertyName}}</strong> :</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Heure d\'arrivée :</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{checkInTime}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Adresse :</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{address}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>WiFi :</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{wifiName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Mot de passe WiFi :</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{wifiPassword}}</td></tr><tr><td style="padding:8px"><strong>Code d\'accès :</strong></td><td style="padding:8px">{{accessCode}}</td></tr></table><p>N\'hésitez pas à nous contacter pour toute question.</p><p>Cordialement,<br>Sivan Management</p>'),
        ru: emailWrap('<p>Уважаемый(ая) {{guestName}},</p><p>Добро пожаловать! Вот данные для заселения в <strong>{{propertyName}}</strong>:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Время заезда:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{checkInTime}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Адрес:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{address}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>WiFi:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{wifiName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Пароль WiFi:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{wifiPassword}}</td></tr><tr><td style="padding:8px"><strong>Код доступа:</strong></td><td style="padding:8px">{{accessCode}}</td></tr></table><p>Свяжитесь с нами в любое время при необходимости.</p><p>С уважением,<br>Sivan Management</p>'),
      },
      whatsappBody: {
        en: 'Hi {{guestName}}! Here are your check-in details for {{propertyName}}:\n\nCheck-in: {{checkInTime}}\nAddress: {{address}}\nWiFi: {{wifiName}} / {{wifiPassword}}\nAccess code: {{accessCode}}\n\nSee you soon!',
        he: 'שלום {{guestName}}! הנה פרטי הצ\'ק-אין עבור {{propertyName}}:\n\nצ\'ק-אין: {{checkInTime}}\nכתובת: {{address}}\nWiFi: {{wifiName}} / {{wifiPassword}}\nקוד כניסה: {{accessCode}}\n\nנתראה בקרוב!',
        de: 'Hallo {{guestName}}! Hier sind Ihre Check-in-Details für {{propertyName}}:\n\nCheck-in: {{checkInTime}}\nAdresse: {{address}}\nWLAN: {{wifiName}} / {{wifiPassword}}\nZugangscode: {{accessCode}}\n\nBis bald!',
        es: 'Hola {{guestName}}! Aquí están tus detalles de check-in para {{propertyName}}:\n\nCheck-in: {{checkInTime}}\nDirección: {{address}}\nWiFi: {{wifiName}} / {{wifiPassword}}\nCódigo: {{accessCode}}\n\n¡Hasta pronto!',
        fr: 'Bonjour {{guestName}} ! Voici vos détails pour {{propertyName}} :\n\nArrivée : {{checkInTime}}\nAdresse : {{address}}\nWiFi : {{wifiName}} / {{wifiPassword}}\nCode : {{accessCode}}\n\nÀ bientôt !',
        ru: 'Здравствуйте, {{guestName}}! Данные для заселения в {{propertyName}}:\n\nЗаезд: {{checkInTime}}\nАдрес: {{address}}\nWiFi: {{wifiName}} / {{wifiPassword}}\nКод: {{accessCode}}\n\nДо встречи!',
      },
      smsBody: {
        en: 'Check-in {{propertyName}}: {{checkInTime}}, code: {{accessCode}}, WiFi: {{wifiName}}/{{wifiPassword}}. Sivan Mgmt',
        he: 'צ\'ק-אין {{propertyName}}: {{checkInTime}}, קוד: {{accessCode}}, WiFi: {{wifiName}}/{{wifiPassword}}. Sivan Mgmt',
        de: 'Check-in {{propertyName}}: {{checkInTime}}, Code: {{accessCode}}, WLAN: {{wifiName}}/{{wifiPassword}}. Sivan Mgmt',
        es: 'Check-in {{propertyName}}: {{checkInTime}}, código: {{accessCode}}, WiFi: {{wifiName}}/{{wifiPassword}}. Sivan Mgmt',
        fr: 'Arrivée {{propertyName}}: {{checkInTime}}, code: {{accessCode}}, WiFi: {{wifiName}}/{{wifiPassword}}. Sivan Mgmt',
        ru: 'Заезд {{propertyName}}: {{checkInTime}}, код: {{accessCode}}, WiFi: {{wifiName}}/{{wifiPassword}}. Sivan Mgmt',
      },
      variables: ['guestName', 'propertyName', 'checkInTime', 'address', 'wifiName', 'wifiPassword', 'accessCode'],
      isSystem: true,
    },
    {
      slug: 'guest_checkout_reminder',
      category: 'guest',
      name: {
        en: 'Guest Check-out Reminder',
        he: 'תזכורת צ\'ק-אאוט',
        de: 'Check-out Erinnerung',
        es: 'Recordatorio de Check-out',
        fr: 'Rappel de Départ',
        ru: 'Напоминание о выезде',
      },
      description: 'Sent to guest on checkout day',
      emailSubject: {
        en: 'Check-out reminder for {{propertyName}}',
        he: 'תזכורת צ\'ק-אאוט עבור {{propertyName}}',
        de: 'Check-out Erinnerung für {{propertyName}}',
        es: 'Recordatorio de check-out para {{propertyName}}',
        fr: 'Rappel de départ pour {{propertyName}}',
        ru: 'Напоминание о выезде из {{propertyName}}',
      },
      emailBody: {
        en: emailWrap('<p>Dear {{guestName}},</p><p>Today is your check-out day at <strong>{{propertyName}}</strong>.</p><p><strong>Check-out time:</strong> {{checkOutTime}}</p><p>Please remember to:</p><ul><li>Return all keys/access cards</li><li>Close all windows and doors</li><li>Turn off lights and A/C</li></ul><p>Thank you for staying with us! We hope you enjoyed your visit and would love to welcome you back.</p><p>Best regards,<br>Sivan Management</p>'),
        he: emailWrap('<div dir="rtl"><p>{{guestName}} שלום,</p><p>היום הוא יום הצ\'ק-אאוט שלך ב-<strong>{{propertyName}}</strong>.</p><p><strong>שעת צ\'ק-אאוט:</strong> {{checkOutTime}}</p><p>אנא זכור/י:</p><ul><li>להחזיר את כל המפתחות</li><li>לסגור חלונות ודלתות</li><li>לכבות אורות ומזגן</li></ul><p>תודה ששהית איתנו! מקווים שנהנית ונשמח לארח שוב.</p><p>בברכה,<br>Sivan Management</p></div>'),
        de: emailWrap('<p>Liebe/r {{guestName}},</p><p>Heute ist Ihr Check-out-Tag bei <strong>{{propertyName}}</strong>.</p><p><strong>Check-out Zeit:</strong> {{checkOutTime}}</p><p>Bitte denken Sie daran:</p><ul><li>Alle Schlüssel zurückgeben</li><li>Fenster und Türen schließen</li><li>Licht und Klimaanlage ausschalten</li></ul><p>Vielen Dank für Ihren Aufenthalt! Wir freuen uns auf ein Wiedersehen.</p><p>Mit freundlichen Grüßen,<br>Sivan Management</p>'),
        es: emailWrap('<p>Estimado/a {{guestName}},</p><p>Hoy es tu día de check-out en <strong>{{propertyName}}</strong>.</p><p><strong>Hora de check-out:</strong> {{checkOutTime}}</p><p>Por favor recuerda:</p><ul><li>Devolver todas las llaves</li><li>Cerrar ventanas y puertas</li><li>Apagar luces y aire acondicionado</li></ul><p>¡Gracias por hospedarte con nosotros! Esperamos verte pronto.</p><p>Saludos cordiales,<br>Sivan Management</p>'),
        fr: emailWrap('<p>Cher/Chère {{guestName}},</p><p>Aujourd\'hui est votre jour de départ de <strong>{{propertyName}}</strong>.</p><p><strong>Heure de départ :</strong> {{checkOutTime}}</p><p>N\'oubliez pas de :</p><ul><li>Rendre toutes les clés</li><li>Fermer les fenêtres et portes</li><li>Éteindre les lumières et la climatisation</li></ul><p>Merci pour votre séjour ! Nous espérons vous revoir bientôt.</p><p>Cordialement,<br>Sivan Management</p>'),
        ru: emailWrap('<p>Уважаемый(ая) {{guestName}},</p><p>Сегодня день Вашего выезда из <strong>{{propertyName}}</strong>.</p><p><strong>Время выезда:</strong> {{checkOutTime}}</p><p>Пожалуйста, не забудьте:</p><ul><li>Вернуть все ключи</li><li>Закрыть окна и двери</li><li>Выключить свет и кондиционер</li></ul><p>Спасибо, что были нашим гостем! Надеемся увидеть Вас снова.</p><p>С уважением,<br>Sivan Management</p>'),
      },
      whatsappBody: {
        en: 'Hi {{guestName}}, check-out today at {{propertyName}} by {{checkOutTime}}. Please return keys and close windows. Thank you for staying with us!',
        he: 'שלום {{guestName}}, צ\'ק-אאוט היום ב-{{propertyName}} עד {{checkOutTime}}. אנא החזר/י מפתחות וסגור/י חלונות. תודה ששהית איתנו!',
        de: 'Hallo {{guestName}}, Check-out heute bei {{propertyName}} bis {{checkOutTime}}. Bitte Schlüssel zurückgeben und Fenster schließen. Danke für Ihren Aufenthalt!',
        es: 'Hola {{guestName}}, check-out hoy en {{propertyName}} hasta las {{checkOutTime}}. Por favor devuelve las llaves. ¡Gracias por tu estancia!',
        fr: 'Bonjour {{guestName}}, départ aujourd\'hui de {{propertyName}} avant {{checkOutTime}}. Merci de rendre les clés. Merci pour votre séjour !',
        ru: 'Здравствуйте, {{guestName}}, выезд сегодня из {{propertyName}} до {{checkOutTime}}. Верните ключи и закройте окна. Спасибо за визит!',
      },
      smsBody: {
        en: 'Check-out today {{propertyName}} by {{checkOutTime}}. Return keys. Thank you! Sivan Management',
        he: 'צ\'ק-אאוט היום {{propertyName}} עד {{checkOutTime}}. החזר מפתחות. תודה! Sivan Management',
        de: 'Check-out heute {{propertyName}} bis {{checkOutTime}}. Schlüssel zurück. Danke! Sivan Management',
        es: 'Check-out hoy {{propertyName}} hasta {{checkOutTime}}. Devolver llaves. ¡Gracias! Sivan Management',
        fr: 'Départ aujourd\'hui {{propertyName}} avant {{checkOutTime}}. Rendre les clés. Merci ! Sivan Management',
        ru: 'Выезд сегодня {{propertyName}} до {{checkOutTime}}. Вернуть ключи. Спасибо! Sivan Management',
      },
      variables: ['guestName', 'propertyName', 'checkOutTime'],
      isSystem: true,
    },
    {
      slug: 'owner_monthly_report',
      category: 'payment',
      name: {
        en: 'Owner Monthly Report',
        he: 'דוח חודשי לבעלים',
        de: 'Monatlicher Eigentümerbericht',
        es: 'Informe Mensual del Propietario',
        fr: 'Rapport Mensuel Propriétaire',
        ru: 'Ежемесячный отчёт владельца',
      },
      description: 'Monthly financial summary sent to property owners',
      emailSubject: {
        en: '{{month}} Monthly Report for {{propertyName}}',
        he: 'דוח חודשי ל-{{month}} עבור {{propertyName}}',
        de: 'Monatsbericht {{month}} für {{propertyName}}',
        es: 'Informe mensual de {{month}} para {{propertyName}}',
        fr: 'Rapport mensuel {{month}} pour {{propertyName}}',
        ru: 'Ежемесячный отчёт за {{month}} по {{propertyName}}',
      },
      emailBody: {
        en: emailWrap('<p>Dear {{ownerName}},</p><p>Here is your monthly report for <strong>{{propertyName}}</strong> - {{month}}:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr style="background:#f9f9f9"><td style="padding:12px;border-bottom:1px solid #eee"><strong>Total Income:</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:right">&euro;{{totalIncome}}</td></tr><tr><td style="padding:12px;border-bottom:1px solid #eee"><strong>Total Expenses:</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:right">&euro;{{totalExpenses}}</td></tr><tr><td style="padding:12px;border-bottom:1px solid #eee"><strong>Management Fee:</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:right">&euro;{{managementFee}}</td></tr><tr style="background:#f0ebfa"><td style="padding:12px;font-size:16px"><strong>Net Payout:</strong></td><td style="padding:12px;text-align:right;font-size:16px;color:#6b38d4"><strong>&euro;{{netPayout}}</strong></td></tr></table><p><strong>Occupancy Rate:</strong> {{occupancyRate}}%<br><strong>Total Nights Booked:</strong> {{nightsBooked}}</p><p>Log in to your portal for the full report.</p><p>Best regards,<br>Sivan Management</p>'),
        he: emailWrap('<div dir="rtl"><p>{{ownerName}} שלום,</p><p>הנה הדוח החודשי שלך עבור <strong>{{propertyName}}</strong> - {{month}}:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr style="background:#f9f9f9"><td style="padding:12px;border-bottom:1px solid #eee"><strong>הכנסות:</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:left">&euro;{{totalIncome}}</td></tr><tr><td style="padding:12px;border-bottom:1px solid #eee"><strong>הוצאות:</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:left">&euro;{{totalExpenses}}</td></tr><tr><td style="padding:12px;border-bottom:1px solid #eee"><strong>עמלת ניהול:</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:left">&euro;{{managementFee}}</td></tr><tr style="background:#f0ebfa"><td style="padding:12px;font-size:16px"><strong>תשלום נטו:</strong></td><td style="padding:12px;text-align:left;font-size:16px;color:#6b38d4"><strong>&euro;{{netPayout}}</strong></td></tr></table><p><strong>שיעור תפוסה:</strong> {{occupancyRate}}%<br><strong>לילות שהוזמנו:</strong> {{nightsBooked}}</p><p>היכנס לפורטל שלך לדוח המלא.</p><p>בברכה,<br>Sivan Management</p></div>'),
        de: emailWrap('<p>Liebe/r {{ownerName}},</p><p>Hier ist Ihr Monatsbericht für <strong>{{propertyName}}</strong> - {{month}}:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr style="background:#f9f9f9"><td style="padding:12px;border-bottom:1px solid #eee"><strong>Gesamteinnahmen:</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:right">&euro;{{totalIncome}}</td></tr><tr><td style="padding:12px;border-bottom:1px solid #eee"><strong>Gesamtausgaben:</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:right">&euro;{{totalExpenses}}</td></tr><tr><td style="padding:12px;border-bottom:1px solid #eee"><strong>Verwaltungsgebühr:</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:right">&euro;{{managementFee}}</td></tr><tr style="background:#f0ebfa"><td style="padding:12px;font-size:16px"><strong>Nettobetrag:</strong></td><td style="padding:12px;text-align:right;font-size:16px;color:#6b38d4"><strong>&euro;{{netPayout}}</strong></td></tr></table><p><strong>Auslastung:</strong> {{occupancyRate}}%<br><strong>Gebuchte Nächte:</strong> {{nightsBooked}}</p><p>Melden Sie sich im Portal für den vollständigen Bericht an.</p><p>Mit freundlichen Grüßen,<br>Sivan Management</p>'),
        es: emailWrap('<p>Estimado/a {{ownerName}},</p><p>Aquí está su informe mensual para <strong>{{propertyName}}</strong> - {{month}}:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr style="background:#f9f9f9"><td style="padding:12px;border-bottom:1px solid #eee"><strong>Ingresos totales:</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:right">&euro;{{totalIncome}}</td></tr><tr><td style="padding:12px;border-bottom:1px solid #eee"><strong>Gastos totales:</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:right">&euro;{{totalExpenses}}</td></tr><tr><td style="padding:12px;border-bottom:1px solid #eee"><strong>Comisión de gestión:</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:right">&euro;{{managementFee}}</td></tr><tr style="background:#f0ebfa"><td style="padding:12px;font-size:16px"><strong>Pago neto:</strong></td><td style="padding:12px;text-align:right;font-size:16px;color:#6b38d4"><strong>&euro;{{netPayout}}</strong></td></tr></table><p><strong>Tasa de ocupación:</strong> {{occupancyRate}}%<br><strong>Noches reservadas:</strong> {{nightsBooked}}</p><p>Inicie sesión en su portal para el informe completo.</p><p>Saludos cordiales,<br>Sivan Management</p>'),
        fr: emailWrap('<p>Cher/Chère {{ownerName}},</p><p>Voici votre rapport mensuel pour <strong>{{propertyName}}</strong> - {{month}} :</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr style="background:#f9f9f9"><td style="padding:12px;border-bottom:1px solid #eee"><strong>Revenus totaux :</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:right">&euro;{{totalIncome}}</td></tr><tr><td style="padding:12px;border-bottom:1px solid #eee"><strong>Dépenses totales :</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:right">&euro;{{totalExpenses}}</td></tr><tr><td style="padding:12px;border-bottom:1px solid #eee"><strong>Frais de gestion :</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:right">&euro;{{managementFee}}</td></tr><tr style="background:#f0ebfa"><td style="padding:12px;font-size:16px"><strong>Paiement net :</strong></td><td style="padding:12px;text-align:right;font-size:16px;color:#6b38d4"><strong>&euro;{{netPayout}}</strong></td></tr></table><p><strong>Taux d\'occupation :</strong> {{occupancyRate}}%<br><strong>Nuits réservées :</strong> {{nightsBooked}}</p><p>Connectez-vous à votre portail pour le rapport complet.</p><p>Cordialement,<br>Sivan Management</p>'),
        ru: emailWrap('<p>Уважаемый(ая) {{ownerName}},</p><p>Вот Ваш ежемесячный отчёт по <strong>{{propertyName}}</strong> за {{month}}:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr style="background:#f9f9f9"><td style="padding:12px;border-bottom:1px solid #eee"><strong>Общий доход:</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:right">&euro;{{totalIncome}}</td></tr><tr><td style="padding:12px;border-bottom:1px solid #eee"><strong>Общие расходы:</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:right">&euro;{{totalExpenses}}</td></tr><tr><td style="padding:12px;border-bottom:1px solid #eee"><strong>Комиссия за управление:</strong></td><td style="padding:12px;border-bottom:1px solid #eee;text-align:right">&euro;{{managementFee}}</td></tr><tr style="background:#f0ebfa"><td style="padding:12px;font-size:16px"><strong>Чистая выплата:</strong></td><td style="padding:12px;text-align:right;font-size:16px;color:#6b38d4"><strong>&euro;{{netPayout}}</strong></td></tr></table><p><strong>Заполняемость:</strong> {{occupancyRate}}%<br><strong>Забронировано ночей:</strong> {{nightsBooked}}</p><p>Войдите в портал для полного отчёта.</p><p>С уважением,<br>Sivan Management</p>'),
      },
      whatsappBody: {
        en: 'Hi {{ownerName}}, your {{month}} report for {{propertyName}}: Income EUR {{totalIncome}}, Expenses EUR {{totalExpenses}}, Net Payout EUR {{netPayout}}. Occupancy: {{occupancyRate}}%. Log in for details.',
        he: 'שלום {{ownerName}}, דוח {{month}} עבור {{propertyName}}: הכנסות EUR {{totalIncome}}, הוצאות EUR {{totalExpenses}}, נטו EUR {{netPayout}}. תפוסה: {{occupancyRate}}%. היכנס לפרטים.',
        de: 'Hallo {{ownerName}}, Ihr {{month}}-Bericht für {{propertyName}}: Einnahmen EUR {{totalIncome}}, Ausgaben EUR {{totalExpenses}}, Netto EUR {{netPayout}}. Auslastung: {{occupancyRate}}%.',
        es: 'Hola {{ownerName}}, informe de {{month}} para {{propertyName}}: Ingresos EUR {{totalIncome}}, Gastos EUR {{totalExpenses}}, Neto EUR {{netPayout}}. Ocupación: {{occupancyRate}}%.',
        fr: 'Bonjour {{ownerName}}, rapport {{month}} pour {{propertyName}} : Revenus EUR {{totalIncome}}, Dépenses EUR {{totalExpenses}}, Net EUR {{netPayout}}. Occupation : {{occupancyRate}}%.',
        ru: 'Здравствуйте, {{ownerName}}, отчёт за {{month}} по {{propertyName}}: Доход EUR {{totalIncome}}, Расходы EUR {{totalExpenses}}, Нетто EUR {{netPayout}}. Заполняемость: {{occupancyRate}}%.',
      },
      smsBody: {
        en: '{{month}} report {{propertyName}}: Income EUR {{totalIncome}}, Net EUR {{netPayout}}. Sivan Management',
        he: 'דוח {{month}} {{propertyName}}: הכנסות EUR {{totalIncome}}, נטו EUR {{netPayout}}. Sivan Management',
        de: '{{month}} Bericht {{propertyName}}: Einnahmen EUR {{totalIncome}}, Netto EUR {{netPayout}}. Sivan Management',
        es: 'Informe {{month}} {{propertyName}}: Ingresos EUR {{totalIncome}}, Neto EUR {{netPayout}}. Sivan Management',
        fr: 'Rapport {{month}} {{propertyName}} : Revenus EUR {{totalIncome}}, Net EUR {{netPayout}}. Sivan Management',
        ru: 'Отчёт {{month}} {{propertyName}}: Доход EUR {{totalIncome}}, Нетто EUR {{netPayout}}. Sivan Management',
      },
      variables: ['ownerName', 'propertyName', 'month', 'totalIncome', 'totalExpenses', 'managementFee', 'netPayout', 'occupancyRate', 'nightsBooked'],
      isSystem: true,
    },
    {
      slug: 'welcome_new_user',
      category: 'system',
      name: {
        en: 'Welcome New User',
        he: 'ברוכים הבאים למשתמש חדש',
        de: 'Willkommen Neuer Benutzer',
        es: 'Bienvenido Nuevo Usuario',
        fr: 'Bienvenue Nouvel Utilisateur',
        ru: 'Добро пожаловать',
      },
      description: 'Sent when a new user account is created',
      emailSubject: {
        en: 'Welcome to Sivan Management, {{userName}}!',
        he: 'ברוכים הבאים ל-Sivan Management, {{userName}}!',
        de: 'Willkommen bei Sivan Management, {{userName}}!',
        es: '¡Bienvenido a Sivan Management, {{userName}}!',
        fr: 'Bienvenue chez Sivan Management, {{userName}} !',
        ru: 'Добро пожаловать в Sivan Management, {{userName}}!',
      },
      emailBody: {
        en: emailWrap('<p>Dear {{userName}},</p><p>Welcome to <strong>Sivan Management</strong>! Your account has been created successfully.</p><p>You can now log in to your portal to:</p><ul><li>View your properties and bookings</li><li>Access financial reports</li><li>Manage maintenance requests</li><li>Communicate with guests and staff</li></ul><p><a href="{{portalUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">Log In to Your Portal</a></p><p>Best regards,<br>Sivan Management Team</p>'),
        he: emailWrap('<div dir="rtl"><p>{{userName}} שלום,</p><p>ברוכים הבאים ל-<strong>Sivan Management</strong>! החשבון שלך נוצר בהצלחה.</p><p>כעת תוכל/י להיכנס לפורטל כדי:</p><ul><li>לצפות בנכסים והזמנות</li><li>לגשת לדוחות כספיים</li><li>לנהל בקשות תחזוקה</li><li>לתקשר עם אורחים וצוות</li></ul><p><a href="{{portalUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">כניסה לפורטל</a></p><p>בברכה,<br>צוות Sivan Management</p></div>'),
        de: emailWrap('<p>Liebe/r {{userName}},</p><p>Willkommen bei <strong>Sivan Management</strong>! Ihr Konto wurde erfolgreich erstellt.</p><p>Sie können sich jetzt in Ihrem Portal anmelden um:</p><ul><li>Immobilien und Buchungen einzusehen</li><li>Finanzberichte abzurufen</li><li>Wartungsanfragen zu verwalten</li><li>Mit Gästen und Personal zu kommunizieren</li></ul><p><a href="{{portalUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">Zum Portal</a></p><p>Mit freundlichen Grüßen,<br>Sivan Management Team</p>'),
        es: emailWrap('<p>Estimado/a {{userName}},</p><p>¡Bienvenido/a a <strong>Sivan Management</strong>! Tu cuenta ha sido creada exitosamente.</p><p>Ahora puedes iniciar sesión en tu portal para:</p><ul><li>Ver tus propiedades y reservas</li><li>Acceder a informes financieros</li><li>Gestionar solicitudes de mantenimiento</li><li>Comunicarte con huéspedes y personal</li></ul><p><a href="{{portalUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">Iniciar Sesión</a></p><p>Saludos cordiales,<br>Equipo Sivan Management</p>'),
        fr: emailWrap('<p>Cher/Chère {{userName}},</p><p>Bienvenue chez <strong>Sivan Management</strong> ! Votre compte a été créé avec succès.</p><p>Vous pouvez maintenant vous connecter à votre portail pour :</p><ul><li>Voir vos propriétés et réservations</li><li>Accéder aux rapports financiers</li><li>Gérer les demandes de maintenance</li><li>Communiquer avec les invités et le personnel</li></ul><p><a href="{{portalUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">Se Connecter</a></p><p>Cordialement,<br>L\'équipe Sivan Management</p>'),
        ru: emailWrap('<p>Уважаемый(ая) {{userName}},</p><p>Добро пожаловать в <strong>Sivan Management</strong>! Ваш аккаунт успешно создан.</p><p>Теперь Вы можете войти в портал, чтобы:</p><ul><li>Просматривать объекты и бронирования</li><li>Получать финансовые отчёты</li><li>Управлять заявками на обслуживание</li><li>Общаться с гостями и персоналом</li></ul><p><a href="{{portalUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">Войти в Портал</a></p><p>С уважением,<br>Команда Sivan Management</p>'),
      },
      whatsappBody: {
        en: 'Welcome to Sivan Management, {{userName}}! Your account is ready. Log in at {{portalUrl}} to get started.',
        he: 'ברוכים הבאים ל-Sivan Management, {{userName}}! החשבון מוכן. היכנס ב-{{portalUrl}} להתחלה.',
        de: 'Willkommen bei Sivan Management, {{userName}}! Ihr Konto ist bereit. Melden Sie sich an: {{portalUrl}}',
        es: '¡Bienvenido a Sivan Management, {{userName}}! Tu cuenta está lista. Inicia sesión en {{portalUrl}}',
        fr: 'Bienvenue chez Sivan Management, {{userName}} ! Votre compte est prêt. Connectez-vous : {{portalUrl}}',
        ru: 'Добро пожаловать в Sivan Management, {{userName}}! Ваш аккаунт готов. Войдите: {{portalUrl}}',
      },
      smsBody: {
        en: 'Welcome to Sivan Management, {{userName}}! Log in at {{portalUrl}}',
        he: 'ברוכים הבאים ל-Sivan Management, {{userName}}! היכנס ב-{{portalUrl}}',
        de: 'Willkommen bei Sivan Management, {{userName}}! Anmelden: {{portalUrl}}',
        es: '¡Bienvenido a Sivan Management, {{userName}}! Inicia sesión: {{portalUrl}}',
        fr: 'Bienvenue chez Sivan Management, {{userName}} ! Connexion : {{portalUrl}}',
        ru: 'Добро пожаловать, {{userName}}! Войти: {{portalUrl}}',
      },
      variables: ['userName', 'portalUrl'],
      isSystem: true,
    },
    {
      slug: 'password_reset',
      category: 'system',
      name: {
        en: 'Password Reset',
        he: 'איפוס סיסמה',
        de: 'Passwort zurücksetzen',
        es: 'Restablecimiento de Contraseña',
        fr: 'Réinitialisation du Mot de Passe',
        ru: 'Сброс пароля',
      },
      description: 'Sent when a password reset is requested',
      emailSubject: {
        en: 'Reset your password - Sivan Management',
        he: 'איפוס סיסמה - Sivan Management',
        de: 'Passwort zurücksetzen - Sivan Management',
        es: 'Restablecer contraseña - Sivan Management',
        fr: 'Réinitialiser votre mot de passe - Sivan Management',
        ru: 'Сброс пароля - Sivan Management',
      },
      emailBody: {
        en: emailWrap('<p>Dear {{userName}},</p><p>We received a request to reset your password.</p><p>Click the button below to set a new password. This link expires in {{expiryHours}} hours.</p><p><a href="{{resetUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">Reset Password</a></p><p>If you did not request this, you can safely ignore this email.</p><p>Best regards,<br>Sivan Management</p>'),
        he: emailWrap('<div dir="rtl"><p>{{userName}} שלום,</p><p>קיבלנו בקשה לאיפוס הסיסמה שלך.</p><p>לחץ/י על הכפתור למטה כדי להגדיר סיסמה חדשה. הקישור תקף ל-{{expiryHours}} שעות.</p><p><a href="{{resetUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">איפוס סיסמה</a></p><p>אם לא ביקשת זאת, ניתן להתעלם מהודעה זו.</p><p>בברכה,<br>Sivan Management</p></div>'),
        de: emailWrap('<p>Liebe/r {{userName}},</p><p>Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten.</p><p>Klicken Sie auf die Schaltfläche unten, um ein neues Passwort festzulegen. Der Link ist {{expiryHours}} Stunden gültig.</p><p><a href="{{resetUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">Passwort Zurücksetzen</a></p><p>Wenn Sie dies nicht angefordert haben, können Sie diese E-Mail ignorieren.</p><p>Mit freundlichen Grüßen,<br>Sivan Management</p>'),
        es: emailWrap('<p>Estimado/a {{userName}},</p><p>Recibimos una solicitud para restablecer tu contraseña.</p><p>Haz clic en el botón de abajo para establecer una nueva contraseña. Este enlace expira en {{expiryHours}} horas.</p><p><a href="{{resetUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">Restablecer Contraseña</a></p><p>Si no solicitaste esto, puedes ignorar este correo.</p><p>Saludos cordiales,<br>Sivan Management</p>'),
        fr: emailWrap('<p>Cher/Chère {{userName}},</p><p>Nous avons reçu une demande de réinitialisation de votre mot de passe.</p><p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien expire dans {{expiryHours}} heures.</p><p><a href="{{resetUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">Réinitialiser</a></p><p>Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet e-mail.</p><p>Cordialement,<br>Sivan Management</p>'),
        ru: emailWrap('<p>Уважаемый(ая) {{userName}},</p><p>Мы получили запрос на сброс Вашего пароля.</p><p>Нажмите кнопку ниже, чтобы установить новый пароль. Ссылка действительна {{expiryHours}} часов.</p><p><a href="{{resetUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">Сбросить Пароль</a></p><p>Если Вы не запрашивали сброс, проигнорируйте это письмо.</p><p>С уважением,<br>Sivan Management</p>'),
      },
      whatsappBody: {
        en: 'Password reset requested for your Sivan Management account. Reset here: {{resetUrl}} (expires in {{expiryHours}} hours). Ignore if not requested.',
        he: 'התבקש איפוס סיסמה לחשבון Sivan Management שלך. איפוס כאן: {{resetUrl}} (תקף {{expiryHours}} שעות). התעלם אם לא ביקשת.',
        de: 'Passwort-Reset für Ihr Sivan Management Konto angefordert. Zurücksetzen: {{resetUrl}} (gültig {{expiryHours}} Std). Ignorieren falls nicht angefordert.',
        es: 'Se solicitó restablecer la contraseña de tu cuenta Sivan Management. Restablecer: {{resetUrl}} (expira en {{expiryHours}} horas). Ignora si no lo solicitaste.',
        fr: 'Réinitialisation demandée pour votre compte Sivan Management. Réinitialiser : {{resetUrl}} (expire dans {{expiryHours}} h). Ignorez si non demandé.',
        ru: 'Запрошен сброс пароля для аккаунта Sivan Management. Сбросить: {{resetUrl}} (действует {{expiryHours}} ч). Игнорируйте, если не запрашивали.',
      },
      smsBody: {
        en: 'Sivan Management password reset: {{resetUrl}} (expires {{expiryHours}}h)',
        he: 'איפוס סיסמה Sivan Management: {{resetUrl}} (תקף {{expiryHours}} שעות)',
        de: 'Sivan Management Passwort-Reset: {{resetUrl}} (gültig {{expiryHours}}h)',
        es: 'Restablecer contraseña Sivan Management: {{resetUrl}} (expira {{expiryHours}}h)',
        fr: 'Réinitialisation Sivan Management: {{resetUrl}} (expire {{expiryHours}}h)',
        ru: 'Сброс пароля Sivan Management: {{resetUrl}} (действует {{expiryHours}}ч)',
      },
      variables: ['userName', 'resetUrl', 'expiryHours'],
      isSystem: true,
    },
    {
      slug: 'expense_approval_request',
      category: 'payment',
      name: {
        en: 'Expense Approval Request',
        he: 'בקשת אישור הוצאה',
        de: 'Ausgabengenehmigungsanfrage',
        es: 'Solicitud de Aprobación de Gasto',
        fr: 'Demande d\'Approbation de Dépense',
        ru: 'Запрос на одобрение расходов',
      },
      description: 'Sent when an expense requires approval',
      emailSubject: {
        en: 'Expense approval needed: EUR {{amount}} for {{propertyName}}',
        he: 'נדרש אישור הוצאה: EUR {{amount}} עבור {{propertyName}}',
        de: 'Ausgabengenehmigung erforderlich: EUR {{amount}} für {{propertyName}}',
        es: 'Aprobación de gasto necesaria: EUR {{amount}} para {{propertyName}}',
        fr: 'Approbation de dépense requise : EUR {{amount}} pour {{propertyName}}',
        ru: 'Требуется одобрение расходов: EUR {{amount}} для {{propertyName}}',
      },
      emailBody: {
        en: emailWrap('<p>Dear {{approverName}},</p><p>An expense requires your approval:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Amount:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">&euro;{{amount}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Property:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Category:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{expenseCategory}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Description:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{description}}</td></tr><tr><td style="padding:8px"><strong>Submitted by:</strong></td><td style="padding:8px">{{submittedBy}}</td></tr></table><p><a href="{{approvalUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">Review & Approve</a></p><p>Sivan Management</p>'),
        he: emailWrap('<div dir="rtl"><p>{{approverName}} שלום,</p><p>הוצאה דורשת את אישורך:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>סכום:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">&euro;{{amount}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>נכס:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>קטגוריה:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{expenseCategory}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>תיאור:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{description}}</td></tr><tr><td style="padding:8px"><strong>הוגש על ידי:</strong></td><td style="padding:8px">{{submittedBy}}</td></tr></table><p><a href="{{approvalUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">בדיקה ואישור</a></p><p>Sivan Management</p></div>'),
        de: emailWrap('<p>Liebe/r {{approverName}},</p><p>Eine Ausgabe erfordert Ihre Genehmigung:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Betrag:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">&euro;{{amount}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Objekt:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Kategorie:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{expenseCategory}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Beschreibung:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{description}}</td></tr><tr><td style="padding:8px"><strong>Eingereicht von:</strong></td><td style="padding:8px">{{submittedBy}}</td></tr></table><p><a href="{{approvalUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">Prüfen & Genehmigen</a></p><p>Sivan Management</p>'),
        es: emailWrap('<p>Estimado/a {{approverName}},</p><p>Un gasto requiere su aprobación:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Monto:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">&euro;{{amount}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Propiedad:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Categoría:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{expenseCategory}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Descripción:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{description}}</td></tr><tr><td style="padding:8px"><strong>Enviado por:</strong></td><td style="padding:8px">{{submittedBy}}</td></tr></table><p><a href="{{approvalUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">Revisar y Aprobar</a></p><p>Sivan Management</p>'),
        fr: emailWrap('<p>Cher/Chère {{approverName}},</p><p>Une dépense nécessite votre approbation :</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Montant :</strong></td><td style="padding:8px;border-bottom:1px solid #eee">&euro;{{amount}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Propriété :</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Catégorie :</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{expenseCategory}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Description :</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{description}}</td></tr><tr><td style="padding:8px"><strong>Soumis par :</strong></td><td style="padding:8px">{{submittedBy}}</td></tr></table><p><a href="{{approvalUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">Examiner & Approuver</a></p><p>Sivan Management</p>'),
        ru: emailWrap('<p>Уважаемый(ая) {{approverName}},</p><p>Расход требует Вашего одобрения:</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Сумма:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">&euro;{{amount}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Объект:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{propertyName}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Категория:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{expenseCategory}}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Описание:</strong></td><td style="padding:8px;border-bottom:1px solid #eee">{{description}}</td></tr><tr><td style="padding:8px"><strong>Подал:</strong></td><td style="padding:8px">{{submittedBy}}</td></tr></table><p><a href="{{approvalUrl}}" style="display:inline-block;padding:12px 24px;background:#6b38d4;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0">Проверить и Одобрить</a></p><p>Sivan Management</p>'),
      },
      whatsappBody: {
        en: 'Expense approval needed: EUR {{amount}} for {{propertyName}} ({{expenseCategory}}). Submitted by {{submittedBy}}. Review: {{approvalUrl}}',
        he: 'נדרש אישור הוצאה: EUR {{amount}} עבור {{propertyName}} ({{expenseCategory}}). הוגש ע"י {{submittedBy}}. בדיקה: {{approvalUrl}}',
        de: 'Ausgabengenehmigung: EUR {{amount}} für {{propertyName}} ({{expenseCategory}}). Von {{submittedBy}}. Prüfen: {{approvalUrl}}',
        es: 'Aprobación de gasto: EUR {{amount}} para {{propertyName}} ({{expenseCategory}}). Por {{submittedBy}}. Revisar: {{approvalUrl}}',
        fr: 'Approbation de dépense : EUR {{amount}} pour {{propertyName}} ({{expenseCategory}}). Par {{submittedBy}}. Examiner : {{approvalUrl}}',
        ru: 'Одобрение расходов: EUR {{amount}} за {{propertyName}} ({{expenseCategory}}). От {{submittedBy}}. Проверить: {{approvalUrl}}',
      },
      smsBody: {
        en: 'Approve expense: EUR {{amount}} for {{propertyName}}. Review: {{approvalUrl}}. Sivan Mgmt',
        he: 'אשר הוצאה: EUR {{amount}} עבור {{propertyName}}. בדיקה: {{approvalUrl}}. Sivan Mgmt',
        de: 'Ausgabe genehmigen: EUR {{amount}} für {{propertyName}}. Prüfen: {{approvalUrl}}. Sivan Mgmt',
        es: 'Aprobar gasto: EUR {{amount}} para {{propertyName}}. Revisar: {{approvalUrl}}. Sivan Mgmt',
        fr: 'Approuver dépense: EUR {{amount}} pour {{propertyName}}. Examiner: {{approvalUrl}}. Sivan Mgmt',
        ru: 'Одобрить расход: EUR {{amount}} за {{propertyName}}. Проверить: {{approvalUrl}}. Sivan Mgmt',
      },
      variables: ['approverName', 'amount', 'propertyName', 'expenseCategory', 'description', 'submittedBy', 'approvalUrl'],
      isSystem: true,
    },
  ];

  for (const tpl of notificationTemplates) {
    await prisma.notificationTemplate.upsert({
      where: { slug: tpl.slug },
      update: {
        category: tpl.category,
        name: tpl.name,
        description: tpl.description,
        emailSubject: tpl.emailSubject,
        emailBody: tpl.emailBody,
        whatsappBody: tpl.whatsappBody,
        smsBody: tpl.smsBody,
        variables: tpl.variables,
        isSystem: tpl.isSystem,
      },
      create: {
        slug: tpl.slug,
        category: tpl.category,
        name: tpl.name,
        description: tpl.description,
        emailSubject: tpl.emailSubject,
        emailBody: tpl.emailBody,
        whatsappBody: tpl.whatsappBody,
        smsBody: tpl.smsBody,
        variables: tpl.variables,
        isActive: true,
        isSystem: tpl.isSystem,
      },
    });
  }

  console.log(`${notificationTemplates.length} Notification templates created/updated`);

  console.log('\nSeeding completed successfully!');
  console.log('Summary: 12 properties, 20 guests, 29 bookings, 35 income records, 28 expense records, 12 maintenance requests, 12 notification templates');
}

main()
  .then(async () => {
    console.log('[SEED] Disconnecting from database...');
    await prisma.$disconnect();
    console.log('[SEED] Done.');
  })
  .catch(async (e) => {
    console.error('[SEED] Fatal seeding error:', e);
    console.error('[SEED] Error name:', e?.name);
    console.error('[SEED] Error message:', e?.message);
    if (e?.meta) console.error('[SEED] Prisma meta:', JSON.stringify(e.meta));
    await prisma.$disconnect();
    // Don't exit with error code - allow server to start even if seed fails
  });
