import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        tenantUsers: {
          include: {
            tenant: true,
          }
        }
      }
    });

    if (!user) {
      throw new UnauthorizedException('Kredensial tidak valid');
    }

    // Untuk pengembangan awal, jika password belum dihash (opsional)
    // const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    const isPasswordValid = loginDto.password === user.passwordHash; // Ganti dengan bcrypt di prod

    if (!isPasswordValid) {
      throw new UnauthorizedException('Kredensial tidak valid');
    }

    // Ambil tenantId pertama sebagai default (bisa dikembangkan jika 1 user punya banyak tenant)
    const activeTenantUser = user.tenantUsers.length > 0 ? user.tenantUsers[0] : null;

    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.globalRole,
      tenantId: activeTenantUser?.tenantId,
      tenantRole: activeTenantUser?.role
    };

    return {
      success: true,
      message: 'Login berhasil',
      data: {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          globalRole: user.globalRole,
        },
        tenant: activeTenantUser ? {
          id: activeTenantUser.tenant.id,
          name: activeTenantUser.tenant.name,
          role: activeTenantUser.role
        } : null
      }
    };
  }
  async register(registerDto: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email }
    });

    if (existingUser) {
      throw new UnauthorizedException('Email sudah terdaftar');
    }

    // Gunakan transaksi untuk membuat User, Tenant, Warung, dan TenantUser sekaligus
    const result = await this.prisma.$transaction(async (prisma) => {
      // 1. Buat User
      const user = await prisma.user.create({
        data: {
          email: registerDto.email,
          name: registerDto.name,
          passwordHash: registerDto.password, // Dalam sistem nyata, gunakan bcrypt
          globalRole: 'USER'
        }
      });

      // 2. Buat Tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: `Tenant ${registerDto.name}`
        }
      });

      // 3. Buat Warung
      const warung = await prisma.warung.create({
        data: {
          tenantId: tenant.id,
          name: registerDto.warungName,
          address: 'Alamat belum diatur'
        }
      });

      // 4. Hubungkan User ke Tenant sebagai JURAGAN
      await prisma.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: 'JURAGAN'
        }
      });

      return { user, tenant, warung };
    });

    return {
      success: true,
      message: 'Pendaftaran berhasil',
      data: {
        userId: result.user.id,
        tenantId: result.tenant.id,
        warungId: result.warung.id
      }
    };
  }
}
