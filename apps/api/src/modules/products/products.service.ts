import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto, UpdateProductDto } from './products.dto';
import { roundCurrency } from '@credit-shop/shared-types';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { category?: string; search?: string }) {
    const where: any = { isActive: true };

    if (query?.category) {
      where.category = query.category;
    }

    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { code: { contains: s, mode: 'insensitive' } },
        { barcode: { contains: s } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      barcode: p.barcode,
      category: p.category,
      unit: p.unit,
      unitPrice: Number(p.unitPrice),
      costPrice: p.costPrice ? Number(p.costPrice) : null,
      isActive: p.isActive,
      createdAt: p.createdAt,
    }));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return {
      id: product.id,
      name: product.name,
      code: product.code,
      barcode: product.barcode,
      category: product.category,
      unit: product.unit,
      unitPrice: Number(product.unitPrice),
      costPrice: product.costPrice ? Number(product.costPrice) : null,
      isActive: product.isActive,
      createdAt: product.createdAt,
    };
  }

  async create(dto: CreateProductDto) {
    const unitPrice = roundCurrency(dto.unitPrice);
    const costPrice = dto.costPrice ? roundCurrency(dto.costPrice) : null;

    let code = dto.code;
    if (!code) {
      const count = await this.prisma.product.count();
      code = `PRD-${String(count + 1).padStart(4, '0')}`;
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        code,
        barcode: dto.barcode,
        category: dto.category,
        unit: dto.unit || 'unit',
        unitPrice,
        costPrice,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        barcode: dto.barcode,
        category: dto.category,
        unit: dto.unit,
        unitPrice: dto.unitPrice !== undefined ? roundCurrency(dto.unitPrice) : undefined,
        costPrice: dto.costPrice !== undefined ? roundCurrency(dto.costPrice) : undefined,
        isActive: dto.isActive,
      },
    });
  }
}
