import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './orders.dto';
import {
  calculateOrderTotals,
  roundCurrency,
  OrderStatus,
  PaymentStatus,
  PaymentMode,
  TransactionType,
} from '@credit-shop/shared-types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { customerId?: string; status?: string; paymentStatus?: string }) {
    const where: any = {};
    if (query?.customerId) where.customerId = query.customerId;
    if (query?.status) where.status = query.status;
    if (query?.paymentStatus) where.paymentStatus = query.paymentStatus;

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        customer: {
          include: {
            village: { select: { id: true, name: true } },
          },
        },
        items: true,
        allocations: {
          include: { payment: true },
        },
      },
      orderBy: { orderDate: 'desc' },
    });

    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      customerName: o.customer.fullName,
      customerPhone: o.customer.phone,
      villageName: o.customer.village.name,
      orderDate: o.orderDate,
      status: o.status,
      subtotal: Number(o.subtotal),
      discountTotal: Number(o.discountTotal),
      taxTotal: Number(o.taxTotal),
      otherCharges: Number(o.otherCharges),
      grandTotal: Number(o.grandTotal),
      immediatePaid: Number(o.immediatePaid),
      creditAmount: Number(o.creditAmount),
      allocatedPaid: Number(o.allocatedPaid),
      outstandingBalance: Number(o.outstandingBalance),
      paymentStatus: o.paymentStatus,
      notes: o.notes,
      items: o.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.lineTotal),
      })),
      createdAt: o.createdAt,
    }));
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          include: { village: true },
        },
        items: true,
        allocations: {
          include: { payment: true },
        },
        ledgerEntries: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customer.fullName,
      customerPhone: order.customer.phone,
      villageName: order.customer.village.name,
      orderDate: order.orderDate,
      status: order.status,
      subtotal: Number(order.subtotal),
      discountTotal: Number(order.discountTotal),
      taxTotal: Number(order.taxTotal),
      otherCharges: Number(order.otherCharges),
      grandTotal: Number(order.grandTotal),
      immediatePaid: Number(order.immediatePaid),
      creditAmount: Number(order.creditAmount),
      allocatedPaid: Number(order.allocatedPaid),
      outstandingBalance: Number(order.outstandingBalance),
      paymentStatus: order.paymentStatus,
      notes: order.notes,
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.lineTotal),
      })),
      payments: order.allocations.map((p) => ({
        paymentId: p.paymentId,
        receiptNumber: p.payment.receiptNumber,
        allocatedAmount: Number(p.amount),
        paymentDate: p.payment.paymentDate,
        mode: p.payment.mode,
      })),
      createdAt: order.createdAt,
    };
  }

  async create(dto: CreateOrderDto, userId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      include: { creditAccount: true },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    // Calculate subtotal from items
    let subtotal = 0;
    const computedItems = dto.items.map((item) => {
      const qty = roundCurrency(item.quantity);
      const price = roundCurrency(item.unitPrice);
      const lineTotal = roundCurrency(qty * price);
      subtotal = roundCurrency(subtotal + lineTotal);
      return {
        productId: item.productId,
        productName: item.productName,
        quantity: qty,
        unitPrice: price,
        lineTotal,
      };
    });

    const calculated = calculateOrderTotals({
      subtotal,
      discountTotal: dto.discountTotal,
      taxTotal: dto.taxTotal,
      otherCharges: dto.otherCharges,
      immediatePaid: dto.immediatePaid,
    });

    const currentOutstanding = Number(customer.creditAccount?.cachedOutstanding || 0);
    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const idempotencyKey = dto.idempotencyKey || `order-idem-${uuidv4()}`;

    let initialPaymentStatus: PaymentStatus = PaymentStatus.PENDING;
    if (calculated.immediatePaid >= calculated.grandTotal) {
      initialPaymentStatus = PaymentStatus.PAID;
    } else if (calculated.immediatePaid > 0) {
      initialPaymentStatus = PaymentStatus.PARTIAL;
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          orderDate: new Date(),
          status: OrderStatus.CONFIRMED,
          subtotal: calculated.subtotal,
          discountTotal: calculated.discountTotal,
          taxTotal: calculated.taxTotal,
          otherCharges: calculated.otherCharges,
          grandTotal: calculated.grandTotal,
          immediatePaid: calculated.immediatePaid,
          creditAmount: calculated.creditAmount,
          allocatedPaid: 0.00,
          outstandingBalance: calculated.creditAmount,
          paymentStatus: initialPaymentStatus,
          notes: dto.notes,
          createdById: userId,
          items: {
            create: computedItems,
          },
        },
        include: { items: true },
      });

      // 2. If immediate down-payment was made at checkout, record Payment & Allocation
      if (calculated.immediatePaid > 0) {
        const receiptNumber = `RCP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        const paymentMode = dto.paymentMode || PaymentMode.CASH;

        await tx.payment.create({
          data: {
            receiptNumber,
            customerId: customer.id,
            amount: calculated.immediatePaid,
            paymentDate: new Date(),
            mode: paymentMode,
            referenceNumber: dto.paymentReference || 'IMMEDIATE_CHECKOUT_PAYMENT',
            idempotencyKey: `pay-${order.id}-${uuidv4()}`,
            notes: `Immediate down-payment for Order #${orderNumber}`,
            recordedById: userId,
            allocations: {
              create: {
                orderId: order.id,
                amount: calculated.immediatePaid,
              },
            },
          },
        });
      }

      // 3. Record Ledger Entry if Credit was generated
      if (calculated.creditAmount > 0) {
        const existingEntries = await tx.ledgerEntry.findMany({
          where: { customerId: customer.id },
          select: { debitAmount: true, creditAmount: true },
        });
        const currentSum = existingEntries.reduce(
          (sum, e) => sum + Number(e.debitAmount) - Number(e.creditAmount),
          0,
        );
        const derivedOutstanding = roundCurrency(currentSum + calculated.creditAmount);
        const positiveOutstanding = Math.max(0, derivedOutstanding);

        await tx.ledgerEntry.create({
          data: {
            customerId: customer.id,
            orderId: order.id,
            type: TransactionType.SALE_CREDIT,
            debitAmount: calculated.creditAmount,
            creditAmount: 0.00,
            runningBalance: positiveOutstanding,
            description: `Credit sale for Order #${orderNumber} (Grand Total: ₹${calculated.grandTotal}, Down-Payment: ₹${calculated.immediatePaid})`,
            idempotencyKey,
            createdById: userId,
          },
        });

        // 4. Atomically update Customer Credit Account
        await tx.creditAccount.update({
          where: { customerId: customer.id },
          data: {
            cachedOutstanding: positiveOutstanding,
            lastTransactionAt: new Date(),
            version: { increment: 1 },
          },
        });
      }

      // 5. Audit Log
      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            customerId: customer.id,
            action: 'ORDER_CREATED',
            entityType: 'Order',
            entityId: order.id,
            newValues: JSON.stringify({ order, calculated }),
          },
        });
      }

      return order;
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, userId?: string) {
    const order = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: dto.status },
      });

      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            customerId: order.customerId,
            action: `ORDER_STATUS_${dto.status}`,
            entityType: 'Order',
            entityId: id,
            oldValues: JSON.stringify({ status: order.status }),
            newValues: JSON.stringify({ status: dto.status, reason: dto.reason }),
          },
        });
      }

      return updated;
    });
  }
}
