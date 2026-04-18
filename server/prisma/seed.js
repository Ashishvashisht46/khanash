/**
 * Prisma Seed Script — Dental RCM
 * Run with: npx prisma db seed
 *
 * Creates:
 *  - 1 Tenant: "Lux Dental Marketing"
 *  - 2 Locations: OHM Dental, Smile Studio Springfield
 *  - 2 Offices per location
 *  - 1 Admin user + 1 Manager + 2 Coordinator users
 *  - 10 sample deposits across locations
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

// ─── Helper ───────────────────────────────────────────────────────────────────
function generateDepositId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'DEP-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function randomDecimal(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const STATUSES = [
  'OPEN',
  'PENDING_REVIEW',
  'COORDINATOR_APPROVED',
  'MANAGER_APPROVED',
  'IN_PROGRESS',
  'COMPLETED',
  'DENIED',
  'UNDER_APPEAL',
];

const INSURANCES = ['Aetna', 'BlueCross BlueShield', 'Cigna', 'Delta Dental', 'Guardian', 'MetLife', 'United Healthcare'];
const PROVIDERS = ['Dr. Smith', 'Dr. Patel', 'Dr. Johnson', 'Dr. Lee', 'Dr. Martinez'];
const CDT_CODES = ['D0120', 'D0210', 'D1110', 'D2140', 'D2330', 'D4341', 'D7140'];

async function main() {
  console.log('🌱 Starting database seed...');

  // ─── Cleanup (idempotent) ─────────────────────────────────────────────────
  // Delete in dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.file.deleteMany({});
  await prisma.deposit.deleteMany({});
  await prisma.inviteToken.deleteMany({});
  await prisma.accessRequest.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.office.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.tenant.deleteMany({});
  console.log('  ✓ Cleared existing data');

  // ─── Tenant ───────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Lux Dental Marketing',
      slug: 'lux-dental',
      address: '123 Corporate Blvd, Suite 400, Chicago, IL 60601',
      phone: '+1 (312) 555-0100',
      settings: {
        timezone: 'America/Chicago',
        currencySymbol: '$',
        depositIdPrefix: 'DEP',
        requireManagerApproval: true,
      },
    },
  });
  console.log(`  ✓ Created tenant: ${tenant.name} (slug: ${tenant.slug})`);

  // ─── Locations ────────────────────────────────────────────────────────────
  const locationOHM = await prisma.location.create({
    data: {
      tenantId: tenant.id,
      name: 'OHM Dental',
      address: '456 Lake Shore Dr, Chicago, IL 60611',
      notes: 'Primary flagship location. High volume.',
    },
  });

  const locationSmile = await prisma.location.create({
    data: {
      tenantId: tenant.id,
      name: 'Smile Studio Springfield',
      address: '789 Capitol Ave, Springfield, IL 62701',
      notes: 'Secondary location opened 2022.',
    },
  });
  console.log(`  ✓ Created 2 locations`);

  // ─── Offices ─────────────────────────────────────────────────────────────
  const officeOHM_A = await prisma.office.create({
    data: {
      tenantId: tenant.id,
      locationId: locationOHM.id,
      name: 'OHM North Wing',
      notes: 'Pediatric and general dentistry',
    },
  });

  const officeOHM_B = await prisma.office.create({
    data: {
      tenantId: tenant.id,
      locationId: locationOHM.id,
      name: 'OHM South Wing',
      notes: 'Orthodontics and oral surgery',
    },
  });

  const officeSmile_A = await prisma.office.create({
    data: {
      tenantId: tenant.id,
      locationId: locationSmile.id,
      name: 'Smile Main Office',
      notes: 'General dentistry and cosmetics',
    },
  });

  const officeSmile_B = await prisma.office.create({
    data: {
      tenantId: tenant.id,
      locationId: locationSmile.id,
      name: 'Smile Oral Surgery Suite',
      notes: 'Surgical procedures only',
    },
  });
  console.log(`  ✓ Created 4 offices`);

  // ─── Users ────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const managerPassword = await bcrypt.hash('Manager@123456', 12);
  const coordPassword = await bcrypt.hash('Coord@123456', 12);

  const adminUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@luxdental.com',
      name: 'Alex Admin',
      password: adminPassword,
      role: 'ADMIN',
      active: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'manager@luxdental.com',
      name: 'Maria Manager',
      password: managerPassword,
      role: 'MANAGER',
      active: true,
      locationId: locationOHM.id,
      assignedLocations: [locationOHM.id, locationSmile.id],
    },
  });

  const coordOHM = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'coord.ohm@luxdental.com',
      name: 'Chris OHM Coordinator',
      password: coordPassword,
      role: 'COORDINATOR',
      active: true,
      locationId: locationOHM.id,
      assignedLocations: [locationOHM.id],
      assignedOffices: [officeOHM_A.id, officeOHM_B.id],
    },
  });

  const coordSmile = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'coord.smile@luxdental.com',
      name: 'Sam Smile Coordinator',
      password: coordPassword,
      role: 'COORDINATOR',
      active: true,
      locationId: locationSmile.id,
      assignedLocations: [locationSmile.id],
      assignedOffices: [officeSmile_A.id, officeSmile_B.id],
    },
  });
  console.log(`  ✓ Created 4 users (admin, manager, 2 coordinators)`);
  console.log(`    Admin:   admin@luxdental.com / Admin@123456`);
  console.log(`    Manager: manager@luxdental.com / Manager@123456`);
  console.log(`    Coord 1: coord.ohm@luxdental.com / Coord@123456`);
  console.log(`    Coord 2: coord.smile@luxdental.com / Coord@123456`);

  // ─── Sample Deposits ──────────────────────────────────────────────────────
  const depositData = [
    // OHM North Wing deposits
    {
      locationId: locationOHM.id,
      officeId: officeOHM_A.id,
      locationName: locationOHM.name,
      officeName: officeOHM_A.name,
      daysAgo: 2,
      status: 'OPEN',
      depositTotal: 3250.00,
    },
    {
      locationId: locationOHM.id,
      officeId: officeOHM_A.id,
      locationName: locationOHM.name,
      officeName: officeOHM_A.name,
      daysAgo: 5,
      status: 'PENDING_REVIEW',
      depositTotal: 1875.50,
    },
    {
      locationId: locationOHM.id,
      officeId: officeOHM_A.id,
      locationName: locationOHM.name,
      officeName: officeOHM_A.name,
      daysAgo: 35,
      status: 'OPEN', // Flagged as outstanding > 30 days
      depositTotal: 4120.75,
    },
    // OHM South Wing deposits
    {
      locationId: locationOHM.id,
      officeId: officeOHM_B.id,
      locationName: locationOHM.name,
      officeName: officeOHM_B.name,
      daysAgo: 1,
      status: 'COORDINATOR_APPROVED',
      depositTotal: 2680.00,
    },
    {
      locationId: locationOHM.id,
      officeId: officeOHM_B.id,
      locationName: locationOHM.name,
      officeName: officeOHM_B.name,
      daysAgo: 10,
      status: 'MANAGER_APPROVED',
      depositTotal: 5500.25,
    },
    // Smile Main Office deposits
    {
      locationId: locationSmile.id,
      officeId: officeSmile_A.id,
      locationName: locationSmile.name,
      officeName: officeSmile_A.name,
      daysAgo: 3,
      status: 'PENDING_REVIEW',
      depositTotal: 1920.00,
    },
    {
      locationId: locationSmile.id,
      officeId: officeSmile_A.id,
      locationName: locationSmile.name,
      officeName: officeSmile_A.name,
      daysAgo: 20,
      status: 'COMPLETED',
      depositTotal: 3340.00,
    },
    {
      locationId: locationSmile.id,
      officeId: officeSmile_A.id,
      locationName: locationSmile.name,
      officeName: officeSmile_A.name,
      daysAgo: 45,
      status: 'DENIED',
      depositTotal: 760.00,
    },
    // Smile Oral Surgery deposits
    {
      locationId: locationSmile.id,
      officeId: officeSmile_B.id,
      locationName: locationSmile.name,
      officeName: officeSmile_B.name,
      daysAgo: 7,
      status: 'IN_PROGRESS',
      depositTotal: 8450.00,
    },
    {
      locationId: locationSmile.id,
      officeId: officeSmile_B.id,
      locationName: locationSmile.name,
      officeName: officeSmile_B.name,
      daysAgo: 60,
      status: 'UNDER_APPEAL',
      depositTotal: 2100.00,
    },
  ];

  const usedDepositIds = new Set();
  const createdDeposits = [];

  for (const d of depositData) {
    // Generate unique depositId
    let depositId;
    do {
      depositId = generateDepositId();
    } while (usedDepositIds.has(depositId));
    usedDepositIds.add(depositId);

    const total = d.depositTotal;
    const insurancePaid = parseFloat((total * 0.7).toFixed(2));
    const patientPortion = parseFloat((total * 0.3).toFixed(2));
    const postedAmount = d.status === 'COMPLETED' ? total : parseFloat((total * 0.8).toFixed(2));
    const unapplied = parseFloat((total - postedAmount).toFixed(2));
    const creditCards = parseFloat((total * 0.4).toFixed(2));
    const checks = parseFloat((total * 0.35).toFixed(2));
    const efts = parseFloat((total - creditCards - checks).toFixed(2));
    const insurance = INSURANCES[Math.floor(Math.random() * INSURANCES.length)];
    const provider = PROVIDERS[Math.floor(Math.random() * PROVIDERS.length)];
    const cdtCode = CDT_CODES[Math.floor(Math.random() * CDT_CODES.length)];
    const depositDate = daysAgo(d.daysAgo);
    const submittedBy = d.locationId === locationOHM.id ? coordOHM : coordSmile;

    const deposit = await prisma.deposit.create({
      data: {
        tenantId: tenant.id,
        depositId,
        locationId: d.locationId,
        officeId: d.officeId,
        locationName: d.locationName,
        officeName: d.officeName,
        depositDate,
        depositTotal: total,
        actualDeposit: total,
        postedAmount,
        unapplied,
        status: d.status,
        creditCards,
        efts,
        checks,
        patient: `Patient ${String.fromCharCode(65 + createdDeposits.length)}`,
        dos: daysAgo(d.daysAgo + 1),
        billedAmt: parseFloat((total * 1.2).toFixed(2)),
        insurancePaid,
        patientPortion,
        cdtCodes: cdtCode,
        provider,
        insurance,
        remarks: d.status === 'DENIED'
          ? 'Claim denied: missing pre-authorization.'
          : d.status === 'UNDER_APPEAL'
          ? 'Appeal filed on ' + daysAgo(d.daysAgo - 5).toLocaleDateString()
          : null,
        submittedById: submittedBy.id,
        submittedByEmail: submittedBy.email,
      },
    });

    createdDeposits.push(deposit);
  }
  console.log(`  ✓ Created ${createdDeposits.length} sample deposits`);

  // ─── Sample Comments ──────────────────────────────────────────────────────
  await prisma.comment.create({
    data: {
      tenantId: tenant.id,
      depositId: createdDeposits[0].id,
      userId: coordOHM.id,
      userName: coordOHM.name,
      text: 'Deposit submitted for daily batch. All items reconciled.',
    },
  });

  await prisma.comment.create({
    data: {
      tenantId: tenant.id,
      depositId: createdDeposits[0].id,
      userId: managerUser.id,
      userName: managerUser.name,
      text: 'Received and under review.',
    },
  });

  await prisma.comment.create({
    data: {
      tenantId: tenant.id,
      depositId: createdDeposits[7].id, // DENIED deposit
      userId: coordSmile.id,
      userName: coordSmile.name,
      text: 'Received denial. Gathering pre-auth documentation for appeal.',
    },
  });
  console.log(`  ✓ Created 3 sample comments`);

  // ─── Audit Logs ───────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: adminUser.id,
        userName: adminUser.name,
        action: 'TENANT_SEEDED',
        entityType: 'Tenant',
        entityId: tenant.id,
        metadata: { seedVersion: '1.0.0' },
      },
      {
        tenantId: tenant.id,
        userId: adminUser.id,
        userName: adminUser.name,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: managerUser.id,
        metadata: { email: managerUser.email, role: 'MANAGER' },
      },
    ],
  });
  console.log(`  ✓ Created audit log entries`);

  // ─── Sample Access Request ────────────────────────────────────────────────
  await prisma.accessRequest.create({
    data: {
      tenantId: tenant.id,
      name: 'Jane Dentist',
      email: 'jane@example-clinic.com',
      roleHint: 'COORDINATOR',
      reason: 'I am a billing coordinator at a partner clinic and need access to submit deposits.',
      status: 'PENDING',
    },
  });
  console.log(`  ✓ Created 1 pending access request`);

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log('\n✅ Seed completed successfully!\n');
  console.log('══════════════════════════════════════════════');
  console.log('Tenant:  Lux Dental Marketing (slug: lux-dental)');
  console.log('Login URL: http://localhost:5173 (or your CLIENT_URL)');
  console.log('');
  console.log('Test Credentials:');
  console.log('  Admin:      admin@luxdental.com   / Admin@123456');
  console.log('  Manager:    manager@luxdental.com / Manager@123456');
  console.log('  Coordinator: coord.ohm@luxdental.com / Coord@123456');
  console.log('══════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
