import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { KaryawanService } from './karyawan.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/v1/karyawan')
@UseGuards(JwtAuthGuard)
export class KaryawanController {
  constructor(private readonly karyawanService: KaryawanService) {}

  @Post()
  async createKaryawan(@Req() req: any, @Body() data: any) {
    const tenantId = req.user.tenantId;
    return this.karyawanService.createKaryawan(tenantId, data);
  }

  @Get()
  async getKaryawanList(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.karyawanService.getKaryawanList(tenantId);
  }

  @Put(':id')
  async updateKaryawan(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    const tenantId = req.user.tenantId;
    return this.karyawanService.updateKaryawan(tenantId, id, data);
  }

  @Delete(':id')
  async deleteKaryawan(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.karyawanService.deleteKaryawan(tenantId, id);
  }
}
