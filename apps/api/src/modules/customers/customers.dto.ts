import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'vil-uuid-123' })
  @IsString()
  @IsNotEmpty()
  villageId: string;

  @ApiPropertyOptional({ example: 'CUST-RAM-005' })
  @IsString()
  @IsOptional()
  customerCode?: string;

  @ApiProperty({ example: 'Anand Kumar' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+919844444444' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: '+919844444445' })
  @IsString()
  @IsOptional()
  alternatePhone?: string;

  @ApiPropertyOptional({ example: 'anand@example.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'House #45, Near Temple, Rampur' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 20000.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  creditLimit?: number;

  @ApiPropertyOptional({ example: 'Farmer - Cotton Harvest' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: ['Farmer', 'Harvest Credit'] })
  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class UpdateCustomerDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  villageId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  alternatePhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  creditLimit?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class CheckDuplicateCustomerDto {
  @ApiProperty({ example: 'Anand Kumar' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+919844444444' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'vil-uuid-123' })
  @IsString()
  @IsOptional()
  villageId?: string;
}

export class PaperBookMigrationDto {
  @ApiProperty({ example: 'vil-uuid-123' })
  @IsString()
  @IsNotEmpty()
  villageId: string;

  @ApiProperty({ example: 'Ravi Patel' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+919811111111' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 12500.00 })
  @IsNumber()
  @Min(0)
  openingBalance: number;

  @ApiProperty({ example: '2026-08-31' })
  @IsDateString()
  effectiveDate: string;

  @ApiPropertyOptional({ example: 'NOTEBOOK-RED-BOOK-PAGE-45' })
  @IsString()
  @IsOptional()
  sourceReference?: string;

  @ApiPropertyOptional({ example: 25000.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  creditLimit?: number;
}
