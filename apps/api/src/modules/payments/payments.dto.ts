import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMode } from '@credit-shop/shared-types';

export class ManualAllocationDto {
  @ApiProperty({ example: 'order-uuid-123' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 2000.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;
}

export enum AllocationStrategy {
  FIFO = 'FIFO',
  SPECIFIC_ORDER = 'SPECIFIC_ORDER',
  MANUAL_SPLIT = 'MANUAL_SPLIT',
  UNALLOCATED_ADVANCE = 'UNALLOCATED_ADVANCE',
}

export class RecordPaymentDto {
  @ApiProperty({ example: 'cust-uuid-123' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 4000.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMode, example: PaymentMode.CASH })
  @IsEnum(PaymentMode)
  mode: PaymentMode;

  @ApiPropertyOptional({ enum: AllocationStrategy, default: AllocationStrategy.FIFO })
  @IsEnum(AllocationStrategy)
  @IsOptional()
  strategy?: AllocationStrategy;

  @ApiPropertyOptional({ example: 'order-uuid-123', description: 'Used when strategy is SPECIFIC_ORDER' })
  @IsString()
  @IsOptional()
  targetOrderId?: string;

  @ApiPropertyOptional({ type: [ManualAllocationDto], description: 'Used when strategy is MANUAL_SPLIT' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManualAllocationDto)
  @IsOptional()
  manualAllocations?: ManualAllocationDto[];

  @ApiPropertyOptional({ example: 'UPI-TXN-123456789' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ example: 'payment-idempotency-uuid' })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiPropertyOptional({ example: 'Partial repayment towards August grocery credit' })
  @IsString()
  @IsOptional()
  notes?: string;
}
