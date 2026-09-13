import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { roundCurrency } from '@credit-shop/shared-types';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getExecutiveMetrics() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Total Store-wide Outstanding
    const creditAccounts = await this.prisma.creditAccount.findMany({
      select: { cachedOutstanding: true },
    });
    const totalOutstanding = creditAccounts.reduce(
      (sum, acc) => sum + Number(acc.cachedOutstanding),
      0,
    );

    // 2. Today's Orders & Sales
    const todayOrders = await this.prisma.order.findMany({
      where: {
        orderDate: { gte: startOfToday, lte: endOfToday },
      },
    });

    const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.grandTotal), 0);
    const todayCreditGenerated = todayOrders.reduce((sum, o) => sum + Number(o.creditAmount), 0);
    const todayImmediateCollections = todayOrders.reduce((sum, o) => sum + Number(o.immediatePaid), 0);

    // 3. Today's Repayments
    const todayPayments = await this.prisma.payment.findMany({
      where: {
        paymentDate: { gte: startOfToday, lte: endOfToday },
      },
    });
    const todayRepayments = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const todayTotalCollections = roundCurrency(todayImmediateCollections + todayRepayments);

    // 4. Counts
    const totalCustomers = await this.prisma.customer.count({ where: { isActive: true } });
    const totalVillages = await this.prisma.village.count();

    // 5. Village Breakdown
    const villages = await this.prisma.village.findMany({
      include: {
        customers: {
          select: {
            creditAccount: {
              select: { cachedOutstanding: true },
            },
          },
        },
      },
    });

    const villageBreakdown = villages.map((v) => {
      const vOut = v.customers.reduce((sum, c) => sum + Number(c.creditAccount?.cachedOutstanding || 0), 0);
      return {
        villageId: v.id,
        villageName: v.name,
        customerCount: v.customers.length,
        totalOutstanding: roundCurrency(vOut),
      };
    }).sort((a, b) => b.totalOutstanding - a.totalOutstanding);

    // 6. Top Debtors
    const topDebtors = await this.prisma.customer.findMany({
      where: {
        isActive: true,
        creditAccount: { cachedOutstanding: { gt: 0 } },
      },
      include: {
        village: true,
        creditAccount: true,
      },
      orderBy: { creditAccount: { cachedOutstanding: 'desc' } },
      take: 5,
    });

    return {
      kpis: {
        totalOutstanding: roundCurrency(totalOutstanding),
        todaySales: roundCurrency(todaySales),
        todayCreditGenerated: roundCurrency(todayCreditGenerated),
        todayCollections: todayTotalCollections,
        totalCustomers,
        totalVillages,
        todayOrdersCount: todayOrders.length,
      },
      villageBreakdown,
      topDebtors: topDebtors.map((d) => ({
        id: d.id,
        customerCode: d.customerCode,
        fullName: d.fullName,
        phone: d.phone,
        villageName: d.village.name,
        currentOutstanding: Number(d.creditAccount?.cachedOutstanding || 0),
        creditLimit: Number(d.creditAccount?.creditLimit || d.creditLimit),
      })),
      timestamp: new Date().toISOString(),
    };
  }
}
