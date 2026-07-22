import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AssetAuditService } from './asset-audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/audits')
export class AssetAuditController {
  constructor(private readonly auditService: AssetAuditService) {}

  @Post()
  createAudit(@Body() createData: any, @CurrentUser() user: any) {
    return this.auditService.createAudit(createData, user);
  }

  @Get()
  getAudits(@CurrentUser() user: any) {
    return this.auditService.getAudits(user);
  }
}
