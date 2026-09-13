import { IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitiateOnlinePaymentDto {
  @ApiProperty({ example: 1500.00, description: 'Amount customer wishes to pay online' })
  @IsNumber()
  @Min(1.00)
  amount: number;

  @ApiPropertyOptional({ example: 'Payment towards monthly grocery credit' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ConfirmOnlinePaymentDto {
  @ApiProperty({ example: 'pay_online_txn_123456' })
  @IsString()
  gatewayTransactionId: string;

  @ApiProperty({ example: 1500.00 })
  @IsNumber()
  @Min(1.00)
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
