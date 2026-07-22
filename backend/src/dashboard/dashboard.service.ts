import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getJuraganSummary(user: any, month?: number, year?: number) {
    const tenantId = user.tenantId;

    const now = new Date();
    const targetMonth = month !== undefined ? month : now.getMonth() + 1; // 1-12
    const targetYear = year !== undefined ? year : now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const summaries = await this.prisma.dailySummary.findMany({
      where: {
        tenantId,
        summaryDate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let monthlySavings = 0;

    summaries.forEach(s => {
      monthlyIncome += s.totalIncome;
      monthlyExpense += s.totalExpense;
      monthlySavings += s.targetSavings;
    });

    return {
      success: true,
      data: {
        monthlyIncome,
        monthlyExpense,
        monthlySavings,
        totalDaysRecorded: summaries.length
      }
    };
  }

  async getJuraganStats(user: any) {
    const tenantId = user.tenantId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Dapatkan data hari ini dari DailySummary atau jumlahkan transaksi manual
    // Karena DailySummary biasanya dibuat saat tutup shift, untuk stats harian (real-time) kita cek Transaksi hari ini
    const todayTransactions = await this.prisma.transaction.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startOfDay
        }
      }
    });

    let todayIncome = 0;
    let todayExpense = 0;
    
    todayTransactions.forEach(t => {
      if (t.type === 'INCOME') todayIncome += t.amount;
      if (t.type === 'EXPENSE') todayExpense += t.amount;
    });

    // Dapatkan target tabungan harian dari financial setting
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { financialSettings: true }
    });

    const savingsType = tenant?.financialSettings?.savingsType || 'FIXED';
    const savingsValue = tenant?.financialSettings?.savingsValue || 0;
    
    let targetSavings = 0;
    if (savingsType === 'PERCENTAGE') {
      targetSavings = todayIncome * (savingsValue / 100);
    } else {
      targetSavings = savingsValue;
    }

    return {
      success: true,
      data: {
        todayIncome,
        todayExpense,
        targetSavings
      }
    };
  }

  async getDailySummaries(user: any, limit: number = 30) {
    const tenantId = user.tenantId;

    const summaries = await this.prisma.dailySummary.findMany({
      where: {
        tenantId
      },
      orderBy: { summaryDate: 'desc' },
      take: limit
    });

    return {
      success: true,
      data: summaries
    };
  }

  async updateDailySummary(id: string, updateData: any, user: any) {
    const summary = await this.prisma.dailySummary.findUnique({
      where: { id }
    });

    if (!summary || summary.tenantId !== user.tenantId) {
      throw new Error('Daily summary tidak ditemukan');
    }

    const updated = await this.prisma.dailySummary.update({
      where: { id },
      data: {
        targetSavings: updateData.targetSavings !== undefined ? Number(updateData.targetSavings) : undefined,
        isEdited: true, // Tandai sebagai diedit
      }
    });

    return {
      success: true,
      message: 'Tabungan harian berhasil diupdate',
      data: updated,
    };
  }

  async getSalaryHistory(user: any) {
    const tenantId = user.tenantId;

    const history = await this.prisma.salaryHistory.findMany({
      where: { tenantId },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    return {
      success: true,
      data: history
    };
  }

  async saveSalaryHistory(user: any, data: any) {
    const tenantId = user.tenantId;
    const { month, year, totalSavings, porsiJuragan, porsiPenjaga, gajiPenjaga, hakJuragan } = data;

    // Gunakan upsert untuk membuat atau mengupdate jika sudah ada
    const saved = await this.prisma.salaryHistory.upsert({
      where: {
        tenantId_month_year: {
          tenantId,
          month: Number(month),
          year: Number(year),
        }
      },
      update: {
        totalSavings: Number(totalSavings),
        porsiJuragan: Number(porsiJuragan),
        porsiPenjaga: Number(porsiPenjaga),
        gajiPenjaga: Number(gajiPenjaga),
        hakJuragan: Number(hakJuragan),
      },
      create: {
        tenantId,
        month: Number(month),
        year: Number(year),
        totalSavings: Number(totalSavings),
        porsiJuragan: Number(porsiJuragan),
        porsiPenjaga: Number(porsiPenjaga),
        gajiPenjaga: Number(gajiPenjaga),
        hakJuragan: Number(hakJuragan),
      }
    });

    return {
      success: true,
      message: 'Laporan gaji berhasil disimpan',
      data: saved
    };
  }
}
