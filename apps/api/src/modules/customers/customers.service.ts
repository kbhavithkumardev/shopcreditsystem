import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, CheckDuplicateCustomerDto, PaperBookMigrationDto } from './customers.dto';
import { TransactionType, roundCurrency } from '@credit-shop/shared-types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { villageId?: string; search?: string }) {
    const where: any = { isActive: true };

    if (query?.villageId) {
      where.villageId = query.villageId;
    }

    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { fullName: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s } },
        { customerCode: { contains: s, mode: 'insensitive' } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        village: { select: { id: true, name: true } },
        creditAccount: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return customers.map((c) => ({
      id: c.id,
      customerCode: c.customerCode,
      fullName: c.fullName,
      phone: c.phone,
      alternatePhone: c.alternatePhone,
      email: c.email,
      address: c.address,
      villageId: c.villageId,
      villageName: c.village.name,
      creditLimit: Number(c.creditAccount?.creditLimit || c.creditLimit),
      currentOutstanding: Number(c.creditAccount?.cachedOutstanding || 0),
      tags: c.tags,
      notes: c.notes,
      isActive: c.isActive,
      createdAt: c.createdAt,
    }));
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        village: true,
        creditAccount: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return {
      id: customer.id,
      customerCode: customer.customerCode,
      fullName: customer.fullName,
      phone: customer.phone,
      alternatePhone: customer.alternatePhone,
      email: customer.email,
      address: customer.address,
      villageId: customer.villageId,
      villageName: customer.village.name,
      creditLimit: Number(customer.creditAccount?.creditLimit || customer.creditLimit),
      currentOutstanding: Number(customer.creditAccount?.cachedOutstanding || 0),
      tags: customer.tags,
      notes: customer.notes,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
    };
  }

  async findCustomer360(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        village: true,
        creditAccount: true,
        orders: {
          orderBy: { orderDate: 'desc' },
          include: { items: true },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        ledgerEntries: {
          orderBy: { createdAt: 'desc' },
        },
        collectionEntries: {
          include: { collectionCycle: true },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const totalPurchases = customer.orders.reduce((sum, o) => sum + Number(o.grandTotal), 0);
    const totalPaid = customer.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const currentOutstanding = Number(customer.creditAccount?.cachedOutstanding || 0);
    const creditLimit = Number(customer.creditAccount?.creditLimit || customer.creditLimit);
    const availableCredit = Math.max(0, creditLimit - currentOutstanding);

    const unpaidOrders = customer.orders.filter(
      (o) => o.paymentStatus !== 'PAID' && Number(o.outstandingBalance) > 0,
    );

    return {
      profile: {
        id: customer.id,
        customerCode: customer.customerCode,
        fullName: customer.fullName,
        phone: customer.phone,
        alternatePhone: customer.alternatePhone,
        email: customer.email,
        address: customer.address,
        villageId: customer.villageId,
        villageName: customer.village.name,
        creditLimit,
        currentOutstanding,
        availableCredit,
        tags: customer.tags,
        notes: customer.notes,
        createdAt: customer.createdAt,
      },
      summary: {
        totalPurchases: roundCurrency(totalPurchases),
        totalPaid: roundCurrency(totalPaid),
        currentOutstanding: roundCurrency(currentOutstanding),
        creditLimit: roundCurrency(creditLimit),
        availableCredit: roundCurrency(availableCredit),
        totalOrdersCount: customer.orders.length,
        unpaidOrdersCount: unpaidOrders.length,
        lastOrderDate: customer.orders[0]?.orderDate || null,
        lastPaymentDate: customer.payments[0]?.paymentDate || null,
      },
      recentOrders: customer.orders.slice(0, 10),
      recentPayments: customer.payments.slice(0, 10),
      ledgerTimeline: customer.ledgerEntries.slice(0, 20),
      collectionHistory: customer.collectionEntries,
    };
  }

  async checkDuplicates(dto: CheckDuplicateCustomerDto) {
    const existingByPhone = await this.prisma.customer.findUnique({
      where: { phone: dto.phone },
      include: { village: true },
    });

    const normalizedName = dto.fullName.trim().toLowerCase();
    const similarNames = await this.prisma.customer.findMany({
      where: {
        fullName: { contains: normalizedName, mode: 'insensitive' },
      },
      include: { village: true },
    });

    const isDuplicate = !!existingByPhone || similarNames.length > 0;

    return {
      isDuplicate,
      exactPhoneMatch: existingByPhone
        ? {
            id: existingByPhone.id,
            fullName: existingByPhone.fullName,
            phone: existingByPhone.phone,
            villageName: existingByPhone.village.name,
          }
        : null,
      similarNameMatches: similarNames.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        phone: s.phone,
        villageName: s.village.name,
      })),
    };
  }

  async create(dto: CreateCustomerDto, userId?: string) {
    // Check phone uniqueness
    const existing = await this.prisma.customer.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new ConflictException(`A customer with phone number ${dto.phone} already exists`);
    }

    // Auto-generate customerCode if missing
    let code = dto.customerCode;
    if (!code) {
      const count = await this.prisma.customer.count();
      code = `CUST-${String(count + 1).padStart(4, '0')}`;
    }

    const creditLimit = dto.creditLimit ?? 0;

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          villageId: dto.villageId,
          customerCode: code!,
          fullName: dto.fullName,
          phone: dto.phone,
          alternatePhone: dto.alternatePhone,
          email: dto.email,
          address: dto.address,
          creditLimit,
          notes: dto.notes,
          tags: dto.tags || [],
        },
        include: { village: true },
      });

      const creditAccount = await tx.creditAccount.create({
        data: {
          customerId: customer.id,
          creditLimit,
          cachedOutstanding: 0.00,
        },
      });

      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            customerId: customer.id,
            action: 'CUSTOMER_CREATED',
            entityType: 'Customer',
            entityId: customer.id,
            newValues: { customer, creditAccount },
          },
        });
      }

      return {
        ...customer,
        currentOutstanding: 0.00,
      };
    });
  }

  async migrateFromPaperBook(dto: PaperBookMigrationDto, userId?: string) {
    const existing = await this.prisma.customer.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new ConflictException(`Customer with phone ${dto.phone} already exists`);
    }

    const count = await this.prisma.customer.count();
    const code = `CUST-${String(count + 1).padStart(4, '0')}`;
    const openingBal = roundCurrency(dto.openingBalance);
    const creditLimit = dto.creditLimit ?? Math.max(openingBal * 1.5, 10000);

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          villageId: dto.villageId,
          customerCode: code,
          fullName: dto.fullName,
          phone: dto.phone,
          creditLimit,
          tags: ['Migrated From Paper Book'],
          notes: `Opening balance migrated from: ${dto.sourceReference || 'Physical Notebook'}`,
        },
        include: { village: true },
      });

      const creditAccount = await tx.creditAccount.create({
        data: {
          customerId: customer.id,
          creditLimit,
          cachedOutstanding: openingBal,
          lastTransactionAt: new Date(dto.effectiveDate),
        },
      });

      if (openingBal > 0) {
        await tx.ledgerEntry.create({
          data: {
            customerId: customer.id,
            type: TransactionType.OPENING_BALANCE,
            debitAmount: openingBal,
            creditAmount: 0.00,
            runningBalance: openingBal,
            description: `Paper-Book Migration: Opening balance as of ${dto.effectiveDate}`,
            referenceId: dto.sourceReference || 'PHYSICAL_NOTEBOOK',
            idempotencyKey: `migrate-${customer.id}-${uuidv4()}`,
            createdById: userId,
            createdAt: new Date(dto.effectiveDate),
          },
        });
      }

      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            customerId: customer.id,
            action: 'PAPER_BOOK_MIGRATION',
            entityType: 'Customer',
            entityId: customer.id,
            newValues: {
              openingBalance: openingBal,
              sourceReference: dto.sourceReference,
              effectiveDate: dto.effectiveDate,
            },
          },
        });
      }

      return {
        ...customer,
        currentOutstanding: openingBal,
        creditLimit,
      };
    });
  }

  async update(id: string, dto: UpdateCustomerDto, userId?: string) {
    const existing = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.customer.update({
        where: { id },
        data: {
          villageId: dto.villageId,
          fullName: dto.fullName,
          phone: dto.phone,
          alternatePhone: dto.alternatePhone,
          email: dto.email,
          address: dto.address,
          notes: dto.notes,
          tags: dto.tags,
          creditLimit: dto.creditLimit !== undefined ? dto.creditLimit : undefined,
        },
        include: { village: true, creditAccount: true },
      });

      if (dto.creditLimit !== undefined) {
        await tx.creditAccount.update({
          where: { customerId: id },
          data: { creditLimit: dto.creditLimit },
        });
      }

      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            customerId: id,
            action: 'CUSTOMER_UPDATED',
            entityType: 'Customer',
            entityId: id,
            oldValues: existing,
            newValues: updated,
          },
        });
      }

      return updated;
    });
  }
}
