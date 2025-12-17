import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Expense,
  CreateExpenseRequest,
  GroupBalance,
  UserBalance,
  Settlement,
} from '@divvai/shared';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async getGroupExpenses(groupId: string, userId: string): Promise<Expense[]> {
    // Verify user is a member
    await this.verifyGroupMembership(groupId, userId);

    const expenses = await this.prisma.expense.findMany({
      where: { groupId },
      include: {
        paidByUser: true,
        items: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return expenses.map((e) => ({
      ...e,
      amount: Number(e.amount),
      items: e.items.map((item) => ({
        ...item,
        amount: Number(item.amount),
      })),
    })) as Expense[];
  }

  async createExpense(
    groupId: string,
    createExpenseDto: CreateExpenseRequest,
    userId: string,
  ): Promise<Expense> {
    // Verify user is a member
    await this.verifyGroupMembership(groupId, userId);

    // Validate amounts
    const totalAmount = createExpenseDto.items.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    if (Math.abs(totalAmount - createExpenseDto.amount) > 0.01) {
      throw new BadRequestException(
        'Sum of item amounts must equal total expense amount',
      );
    }

    const expense = await this.prisma.expense.create({
      data: {
        groupId,
        paidBy: userId,
        amount: new Decimal(createExpenseDto.amount),
        currency: createExpenseDto.currency,
        description: createExpenseDto.description,
        category: createExpenseDto.category,
        date: new Date(createExpenseDto.date),
        items: {
          create: createExpenseDto.items.map((item) => ({
            userId: item.userId,
            amount: new Decimal(item.amount),
          })),
        },
      },
      include: {
        paidByUser: true,
        items: {
          include: {
            user: true,
          },
        },
      },
    });

    return {
      ...expense,
      amount: Number(expense.amount),
      items: expense.items.map((item) => ({
        ...item,
        amount: Number(item.amount),
      })),
    } as Expense;
  }

  async getGroupBalance(groupId: string, userId: string): Promise<GroupBalance> {
    // Verify user is a member
    await this.verifyGroupMembership(groupId, userId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!group) {
      throw new ForbiddenException('Group not found');
    }

    // Get all expenses for the group
    const expenses = await this.prisma.expense.findMany({
      where: { groupId },
      include: {
        paidByUser: true,
        items: {
          include: {
            user: true,
          },
        },
      },
    });

    // Get all settlements
    const settlements = await this.prisma.settlement.findMany({
      where: { groupId },
      include: {
        fromUser: true,
        toUser: true,
      },
    });

    // Calculate balances for each user
    const userBalances = new Map<string, UserBalance>();

    // Initialize balances for all members
    group.members.forEach((member: { userId: string; user: { name: string; picture: string | null } | null }) => {
      userBalances.set(member.userId, {
        userId: member.userId,
        userName: member.user?.name || 'Unknown',
        userPicture: member.user?.picture || undefined,
        totalOwed: 0,
        totalOwing: 0,
        netBalance: 0,
      });
    });

    // Calculate from expenses
    expenses.forEach((expense: { paidBy: string; amount: Decimal; items: Array<{ userId: string; amount: Decimal }> }) => {
      const paidBy = expense.paidBy;
      const paidAmount = Number(expense.amount);

      // Add to paidBy's totalOwed
      if (userBalances.has(paidBy)) {
        const balance = userBalances.get(paidBy)!;
        balance.totalOwed += paidAmount;
      }

      // Subtract from each item user's totalOwing
      expense.items.forEach((item: { userId: string; amount: Decimal }) => {
        const itemUserId = item.userId;
        const itemAmount = Number(item.amount);

        if (userBalances.has(itemUserId)) {
          const balance = userBalances.get(itemUserId)!;
          balance.totalOwing += itemAmount;
        }
      });
    });

    // Adjust for settlements
    settlements
      .filter((s: { status: string }) => s.status === 'completed')
      .forEach((settlement: { fromUserId: string; toUserId: string; amount: Decimal }) => {
        const fromBalance = userBalances.get(settlement.fromUserId);
        const toBalance = userBalances.get(settlement.toUserId);
        const amount = Number(settlement.amount);

        if (fromBalance) {
          fromBalance.totalOwing -= amount;
        }
        if (toBalance) {
          toBalance.totalOwed -= amount;
        }
      });

    // Calculate net balances
    userBalances.forEach((balance) => {
      balance.netBalance = balance.totalOwed - balance.totalOwing;
    });

    return {
      groupId,
      groupName: group.name,
      balances: Array.from(userBalances.values()),
      settlements: settlements.map((s) => ({
        ...s,
        amount: Number(s.amount),
      })) as Settlement[],
    };
  }

  async createSettlement(
    groupId: string,
    settlementDto: { toUserId: string; amount: number; currency: string },
    userId: string,
  ): Promise<void> {
    // Verify user is a member
    await this.verifyGroupMembership(groupId, userId);

    await this.prisma.settlement.create({
      data: {
        groupId,
        fromUserId: userId,
        toUserId: settlementDto.toUserId,
        amount: new Decimal(settlementDto.amount),
        currency: settlementDto.currency,
        status: 'pending',
      },
    });
  }

  private async verifyGroupMembership(groupId: string, userId: string): Promise<void> {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }
  }
}

