import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { roundCurrency } from '@credit-shop/shared-types';

@Injectable()
export class AiToolsService {
  constructor(private prisma: PrismaService) {}

  async getVillageSummary(villageId: string) {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      include: {
        customers: {
          include: { creditAccount: true },
        },
      },
    });

    if (!village) {
      throw new NotFoundException(`Village ${villageId} not found`);
    }

    const totalCustomers = village.customers.length;
    const totalOutstanding = village.customers.reduce(
      (sum, c) => sum + Number(c.creditAccount?.cachedOutstanding || 0),
      0,
    );
    const debtors = village.customers.filter((c) => Number(c.creditAccount?.cachedOutstanding || 0) > 0);

    return {
      toolName: 'get_village_summary',
      villageId: village.id,
      villageName: village.name,
      totalCustomers,
      activeDebtorsCount: debtors.length,
      totalOutstanding: roundCurrency(totalOutstanding),
      averageDebtPerDebtor: debtors.length > 0 ? roundCurrency(totalOutstanding / debtors.length) : 0,
      debtorsList: debtors.map((d) => ({
        customerId: d.id,
        name: d.fullName,
        phone: d.phone,
        outstanding: Number(d.creditAccount?.cachedOutstanding || 0),
      })),
    };
  }

  async getCustomerBalance(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        village: true,
        creditAccount: true,
        orders: {
          where: { outstandingBalance: { gt: 0 } },
          orderBy: { orderDate: 'asc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }

    return {
      toolName: 'get_customer_balance',
      customerId: customer.id,
      customerCode: customer.customerCode,
      name: customer.fullName,
      phone: customer.phone,
      villageName: customer.village.name,
      currentOutstanding: Number(customer.creditAccount?.cachedOutstanding || 0),
      creditLimit: Number(customer.creditAccount?.creditLimit || customer.creditLimit),
      unpaidOrdersCount: customer.orders.length,
      unpaidOrders: customer.orders.map((o) => ({
        orderId: o.id,
        orderNumber: o.orderNumber,
        orderDate: o.orderDate,
        grandTotal: Number(o.grandTotal),
        outstandingBalance: Number(o.outstandingBalance),
      })),
    };
  }

  async getOverdueCustomers(minDays: number = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - minDays);

    const unpaidOrders = await this.prisma.order.findMany({
      where: {
        outstandingBalance: { gt: 0 },
        orderDate: { lte: thresholdDate },
      },
      include: {
        customer: {
          include: {
            village: true,
            creditAccount: true,
          },
        },
      },
      orderBy: { orderDate: 'asc' },
    });

    return {
      toolName: 'get_overdue_customers',
      minDaysOverdue: minDays,
      thresholdDate: thresholdDate.toISOString(),
      overdueOrdersCount: unpaidOrders.length,
      orders: unpaidOrders.map((o) => ({
        orderId: o.id,
        orderNumber: o.orderNumber,
        orderDate: o.orderDate,
        outstandingBalance: Number(o.outstandingBalance),
        customerName: o.customer.fullName,
        customerPhone: o.customer.phone,
        villageName: o.customer.village.name,
        totalCustomerOutstanding: Number(o.customer.creditAccount?.cachedOutstanding || 0),
      })),
    };
  }
}
