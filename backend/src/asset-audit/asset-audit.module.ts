import { Module } from '@nestjs/common';
import { AssetAuditController } from './asset-audit.controller';
import { AssetAuditService } from './asset-audit.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AssetAuditController],
  providers: [AssetAuditService],
  exports: [AssetAuditService],
})
export class AssetAuditModule {}
