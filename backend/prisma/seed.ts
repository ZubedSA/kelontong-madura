import { PrismaClient, GlobalRole, TenantRole, ShiftStatus, TransactionType, SummaryStatus, SavingsType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper to get random number in range
function getRandomArbitrary(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// Helper to format date without shifting timezone too much
function getPastDate(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(8, 0, 0, 0);
  return d;
}

async function main() {
  console.log('Seeding data...');

  // --- CLEANUP ---
  console.log('Cleaning up existing data...');
  await prisma.transaction.deleteMany();
  await prisma.dailySummary.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.warung.deleteMany();
  await prisma.financialSetting.deleteMany();
  await prisma.tenantUser.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.user.deleteMany();
  
  // Tidak di-hash sesuai permintaan (Plaintext)
  const defaultPassword = 'password123';

  // 1. Buat Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@gmail.com',
      name: 'Super Administrator',
      passwordHash: defaultPassword,
      globalRole: GlobalRole.SUPER_ADMIN,
    },
  });
  console.log('Super Admin created:', superAdmin.email);

  // 2. Buat Juragan Dummy
  const juraganUser = await prisma.user.create({
    data: {
      email: 'juragan@gmail.com',
      name: 'Juragan Budi',
      passwordHash: defaultPassword,
      globalRole: GlobalRole.USER,
    },
  });
  console.log('Juragan created:', juraganUser.email);

  // 3. Buat Penjaga Dummy
  const penjagaUser = await prisma.user.create({
    data: {
      email: 'penjaga@gmail.com',
      name: 'Penjaga Asep',
      passwordHash: defaultPassword,
      globalRole: GlobalRole.USER,
    },
  });
  const penjagaUser2 = await prisma.user.create({
    data: {
      email: 'penjaga2@gmail.com',
      name: 'Penjaga Siti',
      passwordHash: defaultPassword,
      globalRole: GlobalRole.USER,
    },
  });
  console.log('Penjaga created');

  // 4. Buat Tenant (Perusahaan/Bisnis) untuk Juragan
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Toko Madura Indah',
      subdomain: 'toko-madura-indah',
      status: 'ACTIVE',
    },
  });
  console.log('Tenant created:', tenant.name);

  // 5. Financial Settings
  await prisma.financialSetting.create({
    data: {
      tenantId: tenant.id,
      savingsType: SavingsType.PERCENTAGE,
      savingsValue: 10, // 10% dari income
      profitShareJuragan: 60,
      profitSharePenjaga: 40,
    }
  });

  // 6. Hubungkan Users dengan Tenant
  await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: juraganUser.id,
      role: TenantRole.JURAGAN,
    },
  });

  const tenantPenjaga = await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: penjagaUser.id,
      role: TenantRole.PENJAGA,
      baseModal: 500000,
      baseSalary: 1500000,
    },
  });
  
  await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: penjagaUser2.id,
      role: TenantRole.PENJAGA,
      baseModal: 300000,
      baseSalary: 1200000,
    },
  });

  // 7. Buat Warung Fisik
  const warung = await prisma.warung.create({
    data: {
      tenantId: tenant.id,
      name: 'Warung Pusat Indah',
      address: 'Jl. Raya Madura No.1',
    }
  });
  
  // 8. Generate 30 Hari Transaksi Dummy (Bulan Terakhir)
  console.log('Generating 30 days of transactions...');
  
  for (let i = 29; i >= 0; i--) {
    const shiftDate = getPastDate(i);
    const endShiftDate = new Date(shiftDate);
    endShiftDate.setHours(22, 0, 0, 0); // Tutup jam 10 malam
    
    // Buka shift
    const shift = await prisma.shift.create({
      data: {
        tenantId: tenant.id,
        warungId: warung.id,
        tenantUserId: tenantPenjaga.id,
        startTime: shiftDate,
        endTime: endShiftDate,
        startCash: 500000,
        status: ShiftStatus.CLOSED
      }
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let totalRestock = 0;
    
    // Generate 5-15 Transaksi Income per hari
    const numIncomes = Math.floor(getRandomArbitrary(5, 15));
    for (let j = 0; j < numIncomes; j++) {
      const amount = Math.floor(getRandomArbitrary(15000, 150000));
      totalIncome += amount;
      
      const txTime = new Date(shiftDate);
      txTime.setHours(Math.floor(getRandomArbitrary(9, 21)), Math.floor(getRandomArbitrary(0, 59)), 0);
      
      await prisma.transaction.create({
        data: {
          tenantId: tenant.id,
          warungId: warung.id,
          shiftId: shift.id,
          type: TransactionType.INCOME,
          amount: amount,
          description: `Pembelian pelanggan ${j+1}`,
          createdAt: txTime
        }
      });
    }

    // Generate 1-3 Restock per hari
    const numRestock = Math.floor(getRandomArbitrary(1, 3));
    for (let j = 0; j < numRestock; j++) {
      const amount = Math.floor(getRandomArbitrary(50000, 200000));
      totalRestock += amount;
      
      const txTime = new Date(shiftDate);
      txTime.setHours(Math.floor(getRandomArbitrary(10, 15)), Math.floor(getRandomArbitrary(0, 59)), 0);
      
      await prisma.transaction.create({
        data: {
          tenantId: tenant.id,
          warungId: warung.id,
          shiftId: shift.id,
          type: TransactionType.RESTOCK,
          amount: amount,
          description: `Restock barang ${j+1}`,
          createdAt: txTime
        }
      });
    }
    
    // Generate 1 Expense
    const expenseAmount = Math.floor(getRandomArbitrary(10000, 30000));
    totalExpense += expenseAmount;
    await prisma.transaction.create({
      data: {
        tenantId: tenant.id,
        warungId: warung.id,
        shiftId: shift.id,
        type: TransactionType.EXPENSE,
        amount: expenseAmount,
        description: `Beli galon / kebersihan`,
        createdAt: shiftDate
      }
    });

    // Buat DailySummary
    const targetSavings = totalIncome * 0.1; // 10% dari income
    await prisma.dailySummary.create({
      data: {
        tenantId: tenant.id,
        warungId: warung.id,
        summaryDate: shiftDate,
        totalIncome,
        totalExpense,
        totalRestock,
        targetSavings,
        status: SummaryStatus.FINAL
      }
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
