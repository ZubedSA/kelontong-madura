import { Controller, Post, Body, Param, UseGuards, Put, Get } from '@nestjs/common';
import { ShiftService } from './shift.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/shifts')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Get('active')
  getActiveShift(@CurrentUser() user: any) {
    return this.shiftService.getActiveShift(user);
  }

  @Post('open')
  openShift(@Body() openShiftDto: OpenShiftDto, @CurrentUser() user: any) {
    return this.shiftService.openShift(openShiftDto, user);
  }

  @Put(':id/close')
  closeShift(@Param('id') id: string, @CurrentUser() user: any) {
    return this.shiftService.closeShift(id, user);
  }
}
