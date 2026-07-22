import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GlobalRole } from '@prisma/client';

@Controller('api/v1/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.settingsService.getSettings(tenantId);
  }

  @Put()
  async updateSettings(@Req() req: any, @Body() data: any) {
    const tenantId = req.user.tenantId;
    const userId = req.user.sub;
    
    // Pastikan yang mengubah setting hanya JURAGAN (owner)
    if (req.user.tenantRole !== 'JURAGAN' && req.user.role !== GlobalRole.SUPER_ADMIN) {
      throw new Error('Hanya Juragan yang dapat mengubah pengaturan');
    }

    return this.settingsService.updateSettings(tenantId, userId, data);
  }
}
