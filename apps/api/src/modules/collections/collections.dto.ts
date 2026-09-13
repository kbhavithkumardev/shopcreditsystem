import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CollectionCycleStatus, CollectionEntryStatus } from '@credit-shop/shared-types';

export class CreateCollectionCycleDto {
  @ApiProperty({ example: 'October 2026 Pension & Festival Collection' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '2026-10-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-10-31' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: ['vil-uuid-1', 'vil-uuid-2'], description: 'List of village IDs to include in this cycle' })
  @IsArray()
  @IsNotEmpty()
  villageIds: string[];

  @ApiPropertyOptional({ example: 'Special collection drive for Diwali festival credit settlement' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateCollectionEntryDto {
  @ApiPropertyOptional({ enum: CollectionEntryStatus, example: CollectionEntryStatus.PROMISED })
  @IsEnum(CollectionEntryStatus)
  @IsOptional()
  status?: CollectionEntryStatus;

  @ApiPropertyOptional({ example: '2026-10-10' })
  @IsDateString()
  @IsOptional()
  promiseDate?: string;

  @ApiPropertyOptional({ example: 'Customer promised ₹5,000 on pension credit date' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 5000.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  expectedTarget?: number;
}
