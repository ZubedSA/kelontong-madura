import { Controller, Post, Body, Get, Put, Param, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto, @CurrentUser() user: any) {
    return this.transactionService.create(createTransactionDto, user);
  }

  @Get('shift/:shiftId')
  getByShift(@Param('shiftId') shiftId: string, @CurrentUser() user: any) {
    return this.transactionService.getTransactionsByShift(shiftId, user);
  }

  @Get()
  getAll(@CurrentUser() user: any) {
    return this.transactionService.getAllTransactions(user);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: any, @CurrentUser() user: any) {
    return this.transactionService.updateTransaction(id, updateData, user);
  }
}
