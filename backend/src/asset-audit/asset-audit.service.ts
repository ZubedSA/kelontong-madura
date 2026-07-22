import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssetAuditService {
  constructor(private prisma: PrismaService) {}

  async createAudit(data: any, user: any) {
    if (!data.tenantUserId || data.modalAwal === undefined || data.uangFisik === undefined || data.nilaiBarang === undefined) {
      throw new BadRequestException('Data audit tidak lengkap');
    }

    const totalAset = data.uangFisik + data.nilaiBarang;
    const selisih = totalAset - data.modalAwal;

    const audit = await this.prisma.assetAudit.create({
      data: {
        tenantId: user.tenantId,
        tenantUserId: data.tenantUserId,
        modalAwal: data.modalAwal,
        uangFisik: data.uangFisik,
        nilaiBarang: data.nilaiBarang,
        totalAset,
        selisih,
        porsiJuragan: data.porsiJuragan || 0,
        porsiPenjaga: data.porsiPenjaga || 0,
        hakJuragan: data.hakJuragan || 0,
        hakPenjaga: data.hakPenjaga || 0,
      },
      include: {
        tenantUser: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    return {
      success: true,
      message: 'Riwayat audit berhasil disimpan',
      data: audit,
    };
  }

  async getAudits(user: any) {
    const audits = await this.prisma.assetAudit.findMany({
      where: { tenantId: user.tenantId },
      include: {
        tenantUser: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { auditDate: 'desc' }
    });

    return {
      success: true,
      data: audits,
    };
  }
}
