import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentMode } from '@credit-shop/shared-types';

export class OrderItemInputDto {
  @ApiPropertyOptional({ example: 'prd-uuid-123' })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiProperty({ example: 'Sona Masoori Rice (25kg Bag)' })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ example: 1450.00 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'cust-uuid-123' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ type: [OrderItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @ApiPropertyOptional({ example: 0.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountTotal?: number;

  @ApiPropertyOptional({ example: 0.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxTotal?: number;

  @ApiPropertyOptional({ example: 0.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  otherCharges?: number;

  @ApiPropertyOptional({ example: 500.00, description: 'Immediate cash or UPI down payment made at checkout' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  immediatePaid?: number;

  @ApiPropertyOptional({ enum: PaymentMode, default: PaymentMode.CASH })
  @IsEnum(PaymentMode)
  @IsOptional()
  paymentMode?: PaymentMode;

  @ApiPropertyOptional({ example: 'UPI-REF-992288' })
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiPropertyOptional({ example: 'idempotency-uuid-v4' })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiPropertyOptional({ example: 'Diwali groceries delivery' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.COMPLETED })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}
