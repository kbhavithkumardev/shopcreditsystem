import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdjustmentDto {
  @ApiProperty({ example: 'cust-uuid-123' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 200.00, description: 'Positive amount to credit or debit' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'DISCOUNT_ADJUSTMENT', enum: ['DISCOUNT_ADJUSTMENT', 'BAD_DEBT_WRITEOFF', 'MANUAL_ADJUSTMENT'] })
  @IsString()
  @IsNotEmpty()
  adjustmentType: string;

  @ApiProperty({ example: 'DEBIT', enum: ['DEBIT', 'CREDIT'], description: 'DEBIT increases customer debt, CREDIT decreases it' })
  @IsString()
  @IsNotEmpty()
  direction: 'DEBIT' | 'CREDIT';

  @ApiProperty({ example: 'Owner goodwill discount on festival bulk purchase' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ReverseTransactionDto {
  @ApiProperty({ example: 'ledger-entry-uuid' })
  @IsString()
  @IsNotEmpty()
  ledgerEntryId: string;

  @ApiProperty({ example: 'Duplicate payment entry error by cashier' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
