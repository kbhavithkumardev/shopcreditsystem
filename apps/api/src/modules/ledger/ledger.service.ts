import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAdjustmentDto, ReverseTransactionDto } from './ledger.dto';
import {
  roundCurrency,
  deriveOutstandingBalanceFromLedger,
  TransactionType,
} from '@credit-shop/shared-types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  async findLedgerEntries(query?: { customerId?: string }) {
    const where: any = {};
    if (query?.customerId) where.customerId = query.customerId;

    const entries = await this.prisma.ledgerEntry.findMany({
      where,
      include: {
        customer: {
          select: { id: true, fullName: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return entries.map((e) => ({
      id: e.id,
      entryNumber: e.entryNumber.toString(),
      customerId: e.customerId,
      customerName: e.customer.fullName,
      customerPhone: e.customer.phone,
      orderId: e.orderId,
      paymentId: e.paymentId,
      type: e.type,
      debitAmount: Number(e.debitAmount),
      creditAmount: Number(e.creditAmount),
      runningBalance: Number(e.runningBalance),
      description: e.description,
      referenceId: e.referenceId,
      createdAt: e.createdAt,
    }));
  }

  async getCustomerStatement(customerId: string, startDate?: string, endDate?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { village: true, creditAccount: true },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const where: any = { customerId };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const entries = await this.prisma.ledgerEntry.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    const mappedEntries = entries.map((e) => ({
      id: e.id,
      entryNumber: e.entryNumber.toString(),
      date: e.createdAt,
      type: e.type,
      debitAmount: Number(e.debitAmount),
      creditAmount: Number(e.creditAmount),
      runningBalance: Number(e.runningBalance),
      description: e.description,
      referenceId: e.referenceId,
    }));

    const calculatedOutstanding = deriveOutstandingBalanceFromLedger(
      entries.map((e) => ({
        debitAmount: Number(e.debitAmount),
        creditAmount: Number(e.creditAmount),
      })),
    );

    return {
      customer: {
        id: customer.id,
        customerCode: customer.customerCode,
        fullName: customer.fullName,
        phone: customer.phone,
        villageName: customer.village.name,
        creditLimit: Number(customer.creditAccount?.creditLimit || customer.creditLimit),
        currentOutstanding: Number(customer.creditAccount?.cachedOutstanding || 0),
      },
      statement: mappedEntries,
      derivedBalance: calculatedOutstanding,
      isReconciled: calculatedOutstanding === Number(customer.creditAccount?.cachedOutstanding || 0),
    };
  }

  /**
   * Automated Full-System Balance Reconciliation
   * Validates Sum(Debits) - Sum(Credits) === Cached Outstanding for every customer.
   */
  async reconcileAllCustomerBalances() {
    const customers = await this.prisma.customer.findMany({
      include: {
        creditAccount: true,
        ledgerEntries: true,
      },
    });

    let totalChecked = 0;
    let reconciledCount = 0;
    const discrepancies: any[] = [];

    for (const c of customers) {
      totalChecked++;
      const derivedBalance = deriveOutstandingBalanceFromLedger(
        c.ledgerEntries.map((e) => ({
          debitAmount: Number(e.debitAmount),
          creditAmount: Number(e.creditAmount),
        })),
      );
      const positiveDerived = Math.max(0, derivedBalance);
      const cached = Number(c.creditAccount?.cachedOutstanding || 0);
      const isMatched = positiveDerived === cached;

      if (isMatched) {
        reconciledCount++;
      } else {
        discrepancies.push({
          customerId: c.id,
          customerName: c.fullName,
          phone: c.phone,
          cachedOutstanding: cached,
          authoritativeLedgerBalance: positiveDerived,
          discrepancy: roundCurrency(cached - positiveDerived),
        });
      }
    }

    return {
      reconciliationStatus: discrepancies.length === 0 ? 'ALL_RECONCILED' : 'DISCREPANCY_DETECTED',
      totalCustomersChecked: totalChecked,
      reconciledCount,
      discrepancyCount: discrepancies.length,
      discrepancies,
      checkedAt: new Date().toISOString(),
    };
  }

  async createAdjustment(dto: CreateAdjustmentDto, userId?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      include: { creditAccount: true },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    const adjAmount = roundCurrency(dto.amount);
    const currentOutstanding = Number(customer.creditAccount?.cachedOutstanding || 0);

    const debitAmount = dto.direction === 'DEBIT' ? adjAmount : 0.00;
    const creditAmount = dto.direction === 'CREDIT' ? adjAmount : 0.00;

    const newOutstanding = roundCurrency(currentOutstanding + debitAmount - creditAmount);
    if (newOutstanding < 0) {
      throw new BadRequestException('Adjustment cannot result in negative customer balance');
    }

    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.ledgerEntry.create({
        data: {
          customerId: customer.id,
          type: dto.adjustmentType as TransactionType,
          debitAmount,
          creditAmount,
          runningBalance: newOutstanding,
          description: `Adjustment (${dto.direction}): ${dto.reason}`,
          idempotencyKey: `adj-${customer.id}-${uuidv4()}`,
          createdById: userId,
        },
      });

      await tx.creditAccount.update({
        where: { customerId: customer.id },
        data: {
          cachedOutstanding: newOutstanding,
          lastTransactionAt: new Date(),
          version: { increment: 1 },
        },
      });

      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            customerId: customer.id,
            action: 'LEDGER_ADJUSTMENT',
            entityType: 'LedgerEntry',
            entityId: entry.id,
            newValues: JSON.stringify({
              adjustmentType: dto.adjustmentType,
              direction: dto.direction,
              amount: adjAmount,
              reason: dto.reason,
              previousOutstanding: currentOutstanding,
              newOutstanding,
            }),
          },
        });
      }

      return entry;
    });
  }

  async reverseTransaction(dto: ReverseTransactionDto, userId?: string) {
    const original = await this.prisma.ledgerEntry.findUnique({
      where: { id: dto.ledgerEntryId },
      include: {
        customer: { include: { creditAccount: true } },
      },
    });

    if (!original) {
      throw new NotFoundException(`Ledger entry with ID ${dto.ledgerEntryId} not found`);
    }

    if (original.reversalOfId) {
      throw new BadRequestException('Cannot reverse an entry that is already a reversal');
    }

    // Check if already reversed
    const existingReversal = await this.prisma.ledgerEntry.findUnique({
      where: { reversalOfId: original.id },
    });
    if (existingReversal) {
      throw new BadRequestException('This transaction has already been reversed');
    }

    // Flip debits and credits
    const revDebit = Number(original.creditAmount);
    const revCredit = Number(original.debitAmount);
    const currentOutstanding = Number(original.customer.creditAccount?.cachedOutstanding || 0);
    const newOutstanding = roundCurrency(currentOutstanding + revDebit - revCredit);

    return this.prisma.$transaction(async (tx) => {
      const reversalEntry = await tx.ledgerEntry.create({
        data: {
          customerId: original.customerId,
          type: TransactionType.REVERSAL,
          debitAmount: revDebit,
          creditAmount: revCredit,
          runningBalance: newOutstanding,
          description: `Reversal of Entry #${original.entryNumber.toString()}: ${dto.reason}`,
          reversalOfId: original.id,
          idempotencyKey: `reversal-${original.id}-${uuidv4()}`,
          createdById: userId,
        },
      });

      await tx.creditAccount.update({
        where: { customerId: original.customerId },
        data: {
          cachedOutstanding: newOutstanding,
          lastTransactionAt: new Date(),
          version: { increment: 1 },
        },
      });

      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            customerId: original.customerId,
            action: 'TRANSACTION_REVERSED',
            entityType: 'LedgerEntry',
            entityId: reversalEntry.id,
            newValues: JSON.stringify({
              reversedEntryId: original.id,
              reason: dto.reason,
              newOutstanding,
            }),
          },
        });
      }

      return reversalEntry;
    });
  }
}
