import { IsString, IsNotEmpty, IsOptional, IsEmail, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  phoneOrEmail: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class CustomerLoginDto {
  @ApiProperty({ example: '+919811111111' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: '1234' })
  @IsString()
  @IsOptional()
  pinOrOtp?: string;
}

export class RegisterUserDto {
  @ApiProperty({ example: 'manager@creditshop.local' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+919876543299' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Vijay Manager' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'SHOP_MANAGER' })
  @IsString()
  @IsNotEmpty()
  role: string;
}
