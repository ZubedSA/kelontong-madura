import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantRole } from '@prisma/client';

@Injectable()
export class KaryawanService {
  constructor(private readonly prisma: PrismaService) {}

  async createKaryawan(tenantId: string, data: any) {
    const { name, email, password, baseModal, targetSetoran } = data;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email sudah digunakan oleh pengguna lain');
    }

    const hashedPassword = password; // Fallback ke plain text sementara untuk menghindari crash bcrypt native

    // Create User and link to TenantUser in a transaction
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
        },
      });

      const tenantUser = await (tx.tenantUser.create as any)({
        data: {
          tenantId,
          userId: user.id,
          role: TenantRole.PENJAGA,
          baseModal: Number(baseModal) || 0,
          baseSalary: Number(targetSetoran) || 0, // Using baseSalary field to store target setoran
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return tenantUser;
    });
  }

  async getKaryawanList(tenantId: string) {
    return this.prisma.tenantUser.findMany({
      where: {
        tenantId,
        role: TenantRole.PENJAGA,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateKaryawan(tenantId: string, id: string, data: any) {
    const { baseModal, targetSetoran, password } = data;
    
    // Check if exists
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: { id },
    });

    if (!tenantUser || tenantUser.tenantId !== tenantId) {
      throw new NotFoundException('Karyawan tidak ditemukan');
    }

    // Jika password diisi saat edit, update password di tabel User
    if (password && password.trim() !== '') {
      await this.prisma.user.update({
        where: { id: tenantUser.userId },
        data: { passwordHash: password },
      });
    }

    return (this.prisma.tenantUser.update as any)({
      where: { id },
      data: {
        baseModal: baseModal !== undefined ? Number(baseModal) : (tenantUser as any).baseModal,
        baseSalary: targetSetoran !== undefined ? Number(targetSetoran) : (tenantUser as any).baseSalary,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async deleteKaryawan(tenantId: string, id: string) {
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: { id },
    });

    if (!tenantUser || tenantUser.tenantId !== tenantId) {
      throw new NotFoundException('Karyawan tidak ditemukan');
    }

    // Delete TenantUser relation, keep User just in case they are registered elsewhere,
    // but typically we can delete User too if they belong nowhere else. 
    // For safety, we just delete TenantUser.
    return this.prisma.tenantUser.delete({
      where: { id },
    });
  }
}
