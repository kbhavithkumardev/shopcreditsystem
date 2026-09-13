import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RecordPaymentDto, AllocationStrategy } from './payments.dto';
import {
  roundCurrency,
  allocatePaymentFIFO,
  TransactionType,
  PaymentStatus,
} from '@credit-shop/shared-types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { customerId?: string; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (query?.customerId) where.customerId = query.customerId;
    if (query?.startDate || query?.endDate) {
      where.paymentDate = {};
      if (query.startDate) where.paymentDate.gte = new Date(query.startDate);
      if (query.endDate) where.paymentDate.lte = new Date(query.endDate);
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        customer: {
          include: {
            village: { select: { id: true, name: true } },
          },
        },
        allocations: {
          include: { order: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return payments.map((p) => ({
      id: p.id,
      receiptNumber: p.receiptNumber,
      customerId: p.customerId,
      customerName: p.customer.fullName,
      customerPhone: p.customer.phone,
      villageName: p.customer.village.name,
      amount: Number(p.amount),
      paymentDate: p.paymentDate,
      mode: p.mode,
      referenceNumber: p.referenceNumber,
      notes: p.notes,
      allocations: p.allocations.map((a) => ({
        orderId: a.orderId,
        orderNumber: a.order.orderNumber,
        allocatedAmount: Number(a.amount),
      })),
      createdAt: p.createdAt,
    }));
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        customer: {
          include: { village: true },
        },
        allocations: {
          include: { order: true },
        },
        ledgerEntries: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return {
      id: payment.id,
      receiptNumber: payment.receiptNumber,
      customerId: payment.customerId,
      customerName: payment.customer.fullName,
      customerPhone: payment.customer.phone,
      villageName: payment.customer.village.name,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate,
      mode: payment.mode,
      referenceNumber: payment.referenceNumber,
      notes: payment.notes,
      allocations: payment.allocations.map((a) => ({
        orderId: a.orderId,
        orderNumber: a.order.orderNumber,
        allocatedAmount: Number(a.amount),
      })),
      ledgerEntries: payment.ledgerEntries,
      createdAt: payment.createdAt,
    };
  }

  async recordPayment(dto: RecordPaymentDto, userId?: string) {
    const paymentAmount = roundCurrency(dto.amount);
    if (paymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      include: { creditAccount: true },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    const idempotencyKey = dto.idempotencyKey || `payment-idem-${uuidv4()}`;

    // Check idempotency
    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
    });
    if (existingPayment) {
      return this.findOne(existingPayment.id);
    }

    const receiptNumber = `RCP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const strategy = dto.strategy || AllocationStrategy.FIFO;

    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch current unpaid orders for this customer
      const unpaidOrders = await tx.order.findMany({
        where: {
          customerId: customer.id,
          outstandingBalance: { gt: 0 },
        },
        orderBy: { orderDate: 'asc' },
      });

      // 2. Determine allocation breakdown
      const plannedAllocations: { orderId: string; amount: number }[] = [];

      if (strategy === AllocationStrategy.SPECIFIC_ORDER) {
        if (!dto.targetOrderId) {
          throw new BadRequestException('targetOrderId is required when strategy is SPECIFIC_ORDER');
        }
        const targetOrder = unpaidOrders.find((o) => o.id === dto.targetOrderId);
        if (!targetOrder) {
          throw new NotFoundException(`Unpaid order with ID ${dto.targetOrderId} not found for this customer`);
        }
        const alloc = Math.min(paymentAmount, Number(targetOrder.outstandingBalance));
        plannedAllocations.push({ orderId: targetOrder.id, amount: roundCurrency(alloc) });
      } else if (strategy === AllocationStrategy.MANUAL_SPLIT) {
        if (!dto.manualAllocations || dto.manualAllocations.length === 0) {
          throw new BadRequestException('manualAllocations array is required for MANUAL_SPLIT');
        }
        let allocatedSum = 0;
        for (const ma of dto.manualAllocations) {
          const ord = unpaidOrders.find((o) => o.id === ma.orderId);
          if (!ord) {
            throw new NotFoundException(`Unpaid order with ID ${ma.orderId} not found`);
          }
          if (ma.amount > Number(ord.outstandingBalance)) {
            throw new BadRequestException(`Allocation ₹${ma.amount} exceeds order #${ord.orderNumber} balance ₹${ord.outstandingBalance}`);
          }
          allocatedSum = roundCurrency(allocatedSum + ma.amount);
          plannedAllocations.push({ orderId: ma.orderId, amount: roundCurrency(ma.amount) });
        }
        if (allocatedSum > paymentAmount) {
          throw new BadRequestException(`Total allocated (₹${allocatedSum}) cannot exceed total payment (₹${paymentAmount})`);
        }
      } else {
        // FIFO allocation
        if (unpaidOrders.length > 0) {
          const fifoResult = allocatePaymentFIFO(
            paymentAmount,
            unpaidOrders.map((o) => ({
              orderId: o.id,
              orderNumber: o.orderNumber,
              orderDate: o.orderDate,
              outstandingBalance: Number(o.outstandingBalance),
            })),
          );
          for (const alloc of fifoResult.allocations) {
            plannedAllocations.push({ orderId: alloc.orderId, amount: alloc.allocatedAmount });
          }
        }
      }

      // 3. Create Payment record
      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          customerId: customer.id,
          amount: paymentAmount,
          paymentDate: new Date(),
          mode: dto.mode,
          referenceNumber: dto.referenceNumber,
          idempotencyKey,
          notes: dto.notes,
          recordedById: userId,
        },
      });

      // 4. Create Allocations and update Order balances
      for (const alloc of plannedAllocations) {
        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            orderId: alloc.orderId,
            amount: alloc.amount,
          },
        });

        const targetOrder = unpaidOrders.find((o) => o.id === alloc.orderId)!;
        const newAllocatedPaid = roundCurrency(Number(targetOrder.allocatedPaid) + alloc.amount);
        const newOutstanding = roundCurrency(Number(targetOrder.outstandingBalance) - alloc.amount);
        const newPaymentStatus = newOutstanding <= 0 ? PaymentStatus.PAID : PaymentStatus.PARTIAL;

        await tx.order.update({
          where: { id: alloc.orderId },
          data: {
            allocatedPaid: newAllocatedPaid,
            outstandingBalance: newOutstanding,
            paymentStatus: newPaymentStatus,
          },
        });
      }

      // 5. Update Customer's overall outstanding and create Ledger Entry
      const currentCustOutstanding = Number(customer.creditAccount?.cachedOutstanding || 0);
      const newCustOutstanding = roundCurrency(Math.max(0, currentCustOutstanding - paymentAmount));

      await tx.ledgerEntry.create({
        data: {
          customerId: customer.id,
          paymentId: payment.id,
          type: TransactionType.PAYMENT,
          debitAmount: 0.00,
          creditAmount: paymentAmount,
          runningBalance: newCustOutstanding,
          description: `Payment received via ${dto.mode} (Receipt: #${receiptNumber})`,
          referenceId: dto.referenceNumber,
          idempotencyKey: `ledger-pay-${payment.id}-${uuidv4()}`,
          createdById: userId,
        },
      });

      await tx.creditAccount.update({
        where: { customerId: customer.id },
        data: {
          cachedOutstanding: newCustOutstanding,
          lastTransactionAt: new Date(),
          version: { increment: 1 },
        },
      });

      // 6. Audit Log
      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            customerId: customer.id,
            action: 'PAYMENT_RECORDED',
            entityType: 'Payment',
            entityId: payment.id,
            newValues: {
              receiptNumber,
              amount: paymentAmount,
              mode: dto.mode,
              plannedAllocations,
              newOutstanding: newCustOutstanding,
            },
          },
        });
      }

      return {
        id: payment.id,
        receiptNumber: payment.receiptNumber,
        customerId: payment.customerId,
        amount: paymentAmount,
        mode: payment.mode,
        allocations: plannedAllocations,
        previousOutstanding: currentCustOutstanding,
        newOutstanding: newCustOutstanding,
        paymentDate: payment.paymentDate,
      };
    });
  }
}
