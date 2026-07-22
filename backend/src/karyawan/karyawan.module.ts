import { Module } from '@nestjs/common';
import { KaryawanController } from './karyawan.controller';
import { KaryawanService } from './karyawan.service';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [KaryawanController],
  providers: [KaryawanService],
})
export class KaryawanModule {}
