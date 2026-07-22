import { Controller, Get, Put, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('juragan/summary')
  getJuraganSummary(
    @CurrentUser() user: any,
    @Query('month') month?: string,
    @Query('year') year?: string
  ) {
    const m = month ? parseInt(month, 10) : undefined;
    const y = year ? parseInt(year, 10) : undefined;
    return this.dashboardService.getJuraganSummary(user, m, y);
  }
  @Get('juragan/stats')
  getJuraganStats(@CurrentUser() user: any) {
    return this.dashboardService.getJuraganStats(user);
  }

  @Get('juragan/daily-summaries')
  getDailySummaries(@CurrentUser() user: any) {
    return this.dashboardService.getDailySummaries(user);
  }

  @Put('juragan/daily-summaries/:id')
  updateDailySummary(@Param('id') id: string, @Body() updateData: any, @CurrentUser() user: any) {
    return this.dashboardService.updateDailySummary(id, updateData, user);
  }

  @Get('juragan/salary-history')
  getSalaryHistory(@CurrentUser() user: any) {
    return this.dashboardService.getSalaryHistory(user);
  }

  @Post('juragan/salary-history')
  saveSalaryHistory(@CurrentUser() user: any, @Body() data: any) {
    return this.dashboardService.saveSalaryHistory(user, data);
  }
}
