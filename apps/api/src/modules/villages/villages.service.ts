import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateVillageDto, UpdateVillageDto } from './villages.dto';

@Injectable()
export class VillagesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const villages = await this.prisma.village.findMany({
      include: {
        customers: {
          select: {
            id: true,
            creditAccount: {
              select: {
                cachedOutstanding: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return villages.map((v) => {
      const customerCount = v.customers.length;
      const totalOutstanding = v.customers.reduce((acc, c) => {
        return acc + Number(c.creditAccount?.cachedOutstanding || 0);
      }, 0);

      return {
        id: v.id,
        name: v.name,
        code: v.code,
        taluk: v.taluk,
        district: v.district,
        pincode: v.pincode,
        notes: v.notes,
        customerCount,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        createdAt: v.createdAt,
      };
    });
  }

  async findOne(id: string) {
    const village = await this.prisma.village.findUnique({
      where: { id },
      include: {
        customers: {
          include: {
            creditAccount: true,
          },
          orderBy: { fullName: 'asc' },
        },
      },
    });

    if (!village) {
      throw new NotFoundException(`Village with ID ${id} not found`);
    }

    const totalOutstanding = village.customers.reduce((acc, c) => {
      return acc + Number(c.creditAccount?.cachedOutstanding || 0);
    }, 0);

    return {
      ...village,
      customerCount: village.customers.length,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    };
  }

  async create(dto: CreateVillageDto) {
    const existing = await this.prisma.village.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException(`Village with name "${dto.name}" already exists`);
    }

    return this.prisma.village.create({
      data: {
        name: dto.name,
        code: dto.code,
        taluk: dto.taluk,
        district: dto.district,
        pincode: dto.pincode,
        notes: dto.notes,
      },
    });
  }

  async update(id: string, dto: UpdateVillageDto) {
    await this.findOne(id);
    return this.prisma.village.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    const village = await this.findOne(id);
    if (village.customerCount > 0) {
      throw new BadRequestException(
        `Cannot delete village "${village.name}" because it has ${village.customerCount} associated customers`,
      );
    }
    return this.prisma.village.delete({
      where: { id },
    });
  }
}
