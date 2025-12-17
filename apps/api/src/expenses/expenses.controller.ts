import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ExpensesService } from './expenses.service';
import { CreateExpenseRequest, Expense, GroupBalance } from '@divvai/shared';
import { User } from '@divvai/shared';

@Controller('groups/:groupId')
@UseGuards(AuthGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get('expenses')
  async getExpenses(
    @Param('groupId') groupId: string,
    @CurrentUser() user: User,
  ): Promise<{ data: Expense[] }> {
    const expenses = await this.expensesService.getGroupExpenses(groupId, user.id);
    return { data: expenses };
  }

  @Post('expenses')
  async createExpense(
    @Param('groupId') groupId: string,
    @Body() createExpenseDto: CreateExpenseRequest,
    @CurrentUser() user: User,
  ): Promise<{ data: Expense }> {
    const expense = await this.expensesService.createExpense(
      groupId,
      createExpenseDto,
      user.id,
    );
    return { data: expense };
  }

  @Get('balance')
  async getBalance(
    @Param('groupId') groupId: string,
    @CurrentUser() user: User,
  ): Promise<{ data: GroupBalance }> {
    const balance = await this.expensesService.getGroupBalance(groupId, user.id);
    return { data: balance };
  }

  @Post('settlements')
  async createSettlement(
    @Param('groupId') groupId: string,
    @Body() createSettlementDto: { toUserId: string; amount: number; currency: string },
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.expensesService.createSettlement(
      groupId,
      {
        toUserId: createSettlementDto.toUserId,
        amount: createSettlementDto.amount,
        currency: createSettlementDto.currency,
      },
      user.id,
    );
    return { message: 'Settlement created successfully' };
  }
}

