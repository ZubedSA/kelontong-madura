import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ShiftModule } from './shift/shift.module';
import { TransactionModule } from './transaction/transaction.module';
import { AssetAuditModule } from './asset-audit/asset-audit.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { KaryawanModule } from './karyawan/karyawan.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [PrismaModule, AuthModule, ShiftModule, TransactionModule, AssetAuditModule, DashboardModule, KaryawanModule, SettingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
