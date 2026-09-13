import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCollectionCycleDto, UpdateCollectionEntryDto } from './collections.dto';
import { roundCurrency, CollectionCycleStatus, CollectionEntryStatus } from '@credit-shop/shared-types';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async findAllCycles() {
    const cycles = await this.prisma.collectionCycle.findMany({
      include: {
        villages: {
          include: { village: true },
        },
        entries: true,
      },
      orderBy: { startDate: 'desc' },
    });

    return cycles.map((c) => {
      const totalTarget = c.entries.reduce((sum, e) => sum + Number(e.expectedTarget), 0);
      const totalCollected = c.entries.reduce((sum, e) => sum + Number(e.collectedAmount), 0);
      const remainingTarget = roundCurrency(Math.max(0, totalTarget - totalCollected));
      const collectionPercentage = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

      return {
        id: c.id,
        title: c.title,
        startDate: c.startDate,
        endDate: c.endDate,
        status: c.status,
        notes: c.notes,
        totalTarget: roundCurrency(totalTarget),
        totalCollected: roundCurrency(totalCollected),
        remainingTarget,
        collectionPercentage,
        villagesCount: c.villages.length,
        customersCount: c.entries.length,
        villages: c.villages.map((v) => ({
          id: v.villageId,
          name: v.village.name,
        })),
        createdAt: c.createdAt,
      };
    });
  }

  async findOneCycle(id: string) {
    const cycle = await this.prisma.collectionCycle.findUnique({
      where: { id },
      include: {
        villages: {
          include: { village: true },
        },
        entries: {
          include: {
            customer: {
              include: {
                village: true,
                creditAccount: true,
              },
            },
          },
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException(`Collection cycle with ID ${id} not found`);
    }

    const totalTarget = cycle.entries.reduce((sum, e) => sum + Number(e.expectedTarget), 0);
    const totalCollected = cycle.entries.reduce((sum, e) => sum + Number(e.collectedAmount), 0);
    const remainingTarget = roundCurrency(Math.max(0, totalTarget - totalCollected));
    const collectionPercentage = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

    return {
      id: cycle.id,
      title: cycle.title,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      status: cycle.status,
      notes: cycle.notes,
      totalTarget: roundCurrency(totalTarget),
      totalCollected: roundCurrency(totalCollected),
      remainingTarget,
      collectionPercentage,
      villages: cycle.villages.map((v) => v.village),
      entries: cycle.entries.map((e) => ({
        id: e.id,
        customerId: e.customerId,
        customerName: e.customer.fullName,
        customerPhone: e.customer.phone,
        villageId: e.customer.villageId,
        villageName: e.customer.village.name,
        openingOutstanding: Number(e.openingOutstanding),
        currentLiveOutstanding: Number(e.customer.creditAccount?.cachedOutstanding || 0),
        expectedTarget: Number(e.expectedTarget),
        collectedAmount: Number(e.collectedAmount),
        remainingDue: Number(e.remainingDue),
        status: e.status,
        promiseDate: e.promiseDate,
        notes: e.notes,
      })),
    };
  }

  async getVillageCollectionSheet(cycleId: string, villageId: string) {
    const cycle = await this.prisma.collectionCycle.findUnique({
      where: { id: cycleId },
    });
    if (!cycle) {
      throw new NotFoundException(`Collection cycle ${cycleId} not found`);
    }

    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
    });
    if (!village) {
      throw new NotFoundException(`Village ${villageId} not found`);
    }

    const entries = await this.prisma.collectionEntry.findMany({
      where: {
        collectionCycleId: cycleId,
        customer: { villageId },
      },
      include: {
        customer: {
          include: { creditAccount: true },
        },
      },
      orderBy: { customer: { fullName: 'asc' } },
    });

    const totalOutstanding = entries.reduce(
      (sum, e) => sum + Number(e.customer.creditAccount?.cachedOutstanding || 0),
      0,
    );
    const totalExpected = entries.reduce((sum, e) => sum + Number(e.expectedTarget), 0);
    const totalCollected = entries.reduce((sum, e) => sum + Number(e.collectedAmount), 0);
    const remainingDue = roundCurrency(Math.max(0, totalExpected - totalCollected));
    const collectionPercentage = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    return {
      cycleId,
      cycleTitle: cycle.title,
      villageId,
      villageName: village.name,
      totalCustomers: entries.length,
      totalOutstanding: roundCurrency(totalOutstanding),
      totalExpected: roundCurrency(totalExpected),
      totalCollected: roundCurrency(totalCollected),
      remainingDue,
      collectionPercentage,
      entries: entries.map((e) => ({
        entryId: e.id,
        customerId: e.customerId,
        customerCode: e.customer.customerCode,
        customerName: e.customer.fullName,
        customerPhone: e.customer.phone,
        openingOutstanding: Number(e.openingOutstanding),
        currentLiveOutstanding: Number(e.customer.creditAccount?.cachedOutstanding || 0),
        expectedTarget: Number(e.expectedTarget),
        collectedAmount: Number(e.collectedAmount),
        remainingDue: Number(e.remainingDue),
        status: e.status,
        promiseDate: e.promiseDate,
        notes: e.notes,
      })),
    };
  }

  async createCycle(dto: CreateCollectionCycleDto, userId?: string) {
    if (!dto.villageIds || dto.villageIds.length === 0) {
      throw new BadRequestException('At least one village must be selected for the collection cycle');
    }

    // Fetch all customers in these villages who have outstanding debt
    const customers = await this.prisma.customer.findMany({
      where: {
        villageId: { in: dto.villageIds },
        isActive: true,
      },
      include: {
        creditAccount: true,
      },
    });

    const entriesData = customers
      .filter((c) => Number(c.creditAccount?.cachedOutstanding || 0) > 0)
      .map((c) => {
        const out = Number(c.creditAccount?.cachedOutstanding || 0);
        return {
          customerId: c.id,
          openingOutstanding: out,
          expectedTarget: out, // Default target is full outstanding
          collectedAmount: 0.00,
          remainingDue: out,
          status: CollectionEntryStatus.PENDING,
        };
      });

    return this.prisma.$transaction(async (tx) => {
      const cycle = await tx.collectionCycle.create({
        data: {
          title: dto.title,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          status: CollectionCycleStatus.ACTIVE,
          notes: dto.notes,
          villages: {
            create: dto.villageIds.map((vId) => ({ villageId: vId })),
          },
          entries: {
            create: entriesData,
          },
        },
        include: {
          villages: true,
          entries: true,
        },
      });

      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            action: 'COLLECTION_CYCLE_CREATED',
            entityType: 'CollectionCycle',
            entityId: cycle.id,
            newValues: JSON.stringify({
              title: dto.title,
              villagesCount: dto.villageIds.length,
              customersTargeted: entriesData.length,
            }),
          },
        });
      }

      return cycle;
    });
  }

  async updateEntry(entryId: string, dto: UpdateCollectionEntryDto, userId?: string) {
    const entry = await this.prisma.collectionEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException(`Collection entry ${entryId} not found`);
    }

    const updated = await this.prisma.collectionEntry.update({
      where: { id: entryId },
      data: {
        status: dto.status,
        promiseDate: dto.promiseDate ? new Date(dto.promiseDate) : undefined,
        notes: dto.notes,
        expectedTarget: dto.expectedTarget !== undefined ? roundCurrency(dto.expectedTarget) : undefined,
      },
    });

    return updated;
  }
}
