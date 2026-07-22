import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { financialSettings: true },
    });

    if (!tenant) {
      throw new NotFoundException('Toko tidak ditemukan');
    }

    return {
      name: tenant.name,
      subdomain: tenant.subdomain,
      financialSettings: tenant.financialSettings || {
        savingsType: 'FIXED',
        savingsValue: 0,
        profitShareJuragan: 100,
        profitSharePenjaga: 0,
      }
    };
  }

  async updateSettings(tenantId: string, userId: string, data: any) {
    const { name, subdomain, savingsType, savingsValue, profitShareJuragan, profitSharePenjaga, password } = data;

    // Update Tenant
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: name !== undefined ? name : undefined,
        subdomain: subdomain !== undefined ? subdomain : undefined,
      },
    });

    if (password) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: password, // Gunakan hashing (misal bcrypt) di produksi
        }
      });
    }

    // Update or Create FinancialSettings
    const existing = await this.prisma.financialSetting.findUnique({
      where: { tenantId },
    });

    if (existing) {
      await this.prisma.financialSetting.update({
        where: { tenantId },
        data: {
          savingsType: savingsType !== undefined ? savingsType : undefined,
          savingsValue: savingsValue !== undefined ? Number(savingsValue) : undefined,
          profitShareJuragan: profitShareJuragan !== undefined ? Number(profitShareJuragan) : undefined,
          profitSharePenjaga: profitSharePenjaga !== undefined ? Number(profitSharePenjaga) : undefined,
        }
      });
    } else {
      await this.prisma.financialSetting.create({
        data: {
          tenantId,
          savingsType: savingsType || 'FIXED',
          savingsValue: Number(savingsValue) || 0,
          profitShareJuragan: Number(profitShareJuragan) || 100,
          profitSharePenjaga: Number(profitSharePenjaga) || 0,
        }
      });
    }

    return this.getSettings(tenantId);
  }
}
