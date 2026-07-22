import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { ShiftStatus, SummaryStatus, TransactionType } from '@prisma/client';

@Injectable()
export class ShiftService {
  constructor(private readonly prisma: PrismaService) {}

  async openShift(openShiftDto: OpenShiftDto, user: any) {
    const tenantId = user.tenantId;
    if (!tenantId) throw new BadRequestException('User tidak terikat dengan Tenant mana pun');

    let targetWarungId = openShiftDto.warungId;

    if (!targetWarungId) {
      const firstWarung = await this.prisma.warung.findFirst({
        where: { tenantId }
      });
      if (!firstWarung) throw new BadRequestException('Belum ada warung yang terdaftar untuk tenant ini');
      targetWarungId = firstWarung.id;
    }

    // Cek apakah sudah ada shift yang open untuk warung ini
    const existingShift = await this.prisma.shift.findFirst({
      where: {
        tenantId,
        warungId: targetWarungId,
        status: ShiftStatus.OPEN,
      },
    });

    if (existingShift) {
      throw new BadRequestException('Masih ada shift yang belum ditutup di warung ini');
    }

    // Ambil tenantUserId dari tabel TenantUser
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenantId,
          userId: user.sub,
        },
      },
    });

    if (!tenantUser) throw new NotFoundException('Karyawan tidak ditemukan di tenant ini');

    const newShift = await this.prisma.shift.create({
      data: {
        tenantId,
        warungId: targetWarungId,
        tenantUserId: tenantUser.id,
        status: ShiftStatus.OPEN,
      },
    });

    return {
      success: true,
      message: 'Shift berhasil dibuka',
      data: newShift,
    };
  }

  async closeShift(shiftId: string, user: any) {
    const tenantId = user.tenantId;
    
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, tenantId },
      include: { transactions: true, warung: true }
    });

    if (!shift) throw new NotFoundException('Shift tidak ditemukan');
    if (shift.status === ShiftStatus.CLOSED) throw new BadRequestException('Shift sudah ditutup');

    // Kalkulasi
    let totalIncome = 0;
    let totalRestock = 0;
    let totalExpense = 0;

    shift.transactions.forEach(tx => {
      if (tx.type === TransactionType.INCOME) totalIncome += tx.amount;
      if (tx.type === TransactionType.RESTOCK) totalRestock += tx.amount;
      if (tx.type === TransactionType.EXPENSE) totalExpense += tx.amount;
    });

    // Ambil aturan tabungan dari Juragan
    const settings = await this.prisma.financialSetting.findUnique({
      where: { tenantId }
    });

    let targetSavings = 0;
    if (settings) {
      if (settings.savingsType === 'PERCENTAGE') {
        targetSavings = totalIncome * (settings.savingsValue / 100);
      } else {
        targetSavings = settings.savingsValue;
      }
    }

    // Gunakan Transaction DB untuk atomicity
    const result = await this.prisma.$transaction(async (prisma) => {
      // 1. Tutup Shift
      const closedShift = await prisma.shift.update({
        where: { id: shiftId },
        data: {
          status: ShiftStatus.CLOSED,
          endTime: new Date(),
        }
      });

      // 2. Buat Rekapan (Daily Summary)
      const summary = await prisma.dailySummary.create({
        data: {
          tenantId,
          warungId: shift.warungId,
          summaryDate: new Date(),
          totalIncome,
          totalRestock,
          totalExpense,
          targetSavings,
          status: SummaryStatus.FINAL,
        }
      });

      return { closedShift, summary };
    });

    return {
      success: true,
      message: 'Shift ditutup. Segera sisihkan uang tabungan.',
      data: {
        shift: result.closedShift,
        summary: result.summary,
        instruction: `Hari ini simpan Rp ${targetSavings.toLocaleString('id-ID')} ke tabungan Juragan.`
      }
    };
  }

  async getActiveShift(user: any) {
    const tenantId = user.tenantId;
    
    // Cari Penjaga
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenantId,
          userId: user.sub,
        },
      },
    });

    if (!tenantUser) {
      return { success: true, data: null };
    }

    const activeShift = await this.prisma.shift.findFirst({
      where: {
        tenantId,
        tenantUserId: tenantUser.id,
        status: ShiftStatus.OPEN,
      },
      include: { transactions: true, warung: true }
    });

    const settings = await this.prisma.financialSetting.findUnique({
      where: { tenantId }
    });

    return {
      success: true,
      data: activeShift,
      settings: settings
    };
  }
}
