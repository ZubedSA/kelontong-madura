import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ShiftStatus } from '@prisma/client';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTransactionDto: CreateTransactionDto, user: any) {
    const tenantId = user.tenantId;
    if (!tenantId) throw new BadRequestException('User tidak terikat dengan Tenant');

    // Pastikan shift masih open
    const shift = await this.prisma.shift.findFirst({
      where: {
        id: createTransactionDto.shiftId,
        tenantId,
      },
    });

    if (!shift) throw new NotFoundException('Shift tidak ditemukan');
    if (shift.status !== ShiftStatus.OPEN) {
      throw new BadRequestException('Tidak bisa menambah transaksi pada shift yang sudah ditutup');
    }

    if (createTransactionDto.type === 'INCOME') {
      const existingIncome = await this.prisma.transaction.findFirst({
        where: {
          shiftId: shift.id,
          type: 'INCOME',
          tenantId,
        }
      });

      if (existingIncome) {
        const transaction = await this.prisma.transaction.update({
          where: { id: existingIncome.id },
          data: {
            amount: createTransactionDto.amount,
            description: createTransactionDto.description,
            isEdited: true
          }
        });
        return {
          success: true,
          message: 'Total Omzet Harian berhasil diupdate',
          data: transaction,
        };
      }
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        tenantId,
        warungId: shift.warungId,
        shiftId: shift.id,
        type: createTransactionDto.type,
        amount: createTransactionDto.amount,
        description: createTransactionDto.description,
      },
    });

    return {
      success: true,
      message: 'Transaksi berhasil disimpan',
      data: transaction,
    };
  }

  async getTransactionsByShift(shiftId: string, user: any) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        shiftId,
        tenantId: user.tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: transactions,
    };
  }

  async getAllTransactions(user: any) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        tenantId: user.tenantId,
      },
      include: {
        shift: {
          include: {
            tenantUser: {
              include: {
                user: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: transactions,
    };
  }

  async updateTransaction(id: string, updateData: any, user: any) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id }
    });

    if (!transaction || transaction.tenantId !== user.tenantId) {
      throw new NotFoundException('Transaksi tidak ditemukan');
    }

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        amount: updateData.amount !== undefined ? Number(updateData.amount) : undefined,
        description: updateData.description !== undefined ? updateData.description : undefined,
        isEdited: true, // Tandai sebagai diedit
      }
    });

    return {
      success: true,
      message: 'Transaksi berhasil diupdate',
      data: updated,
    };
  }
}
