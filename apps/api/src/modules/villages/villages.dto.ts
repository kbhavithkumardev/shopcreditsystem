import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVillageDto {
  @ApiProperty({ example: 'Rampur' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'VIL-RAMPUR' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: 'East Taluk' })
  @IsString()
  @IsOptional()
  taluk?: string;

  @ApiPropertyOptional({ example: 'Central District' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ example: '560001' })
  @IsString()
  @IsOptional()
  pincode?: string;

  @ApiPropertyOptional({ example: 'Agricultural village near river' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateVillageDto {
  @ApiPropertyOptional({ example: 'Rampur North' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'VIL-RAM-N' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: 'East Taluk' })
  @IsString()
  @IsOptional()
  taluk?: string;

  @ApiPropertyOptional({ example: 'Central District' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ example: '560001' })
  @IsString()
  @IsOptional()
  pincode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
