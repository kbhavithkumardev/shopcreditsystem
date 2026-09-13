import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, CustomerLoginDto, RegisterUserDto } from './auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '@credit-shop/shared-types';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login for Shop Owner and Staff' })
  @ApiResponse({ status: 200, description: 'User authenticated successfully' })
  async login(@Body() dto: LoginDto) {
    return this.authService.validateAndLoginUser(dto);
  }

  @Public()
  @Post('customer/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Phone-first OTP login for Customer Self-Service Portal' })
  @ApiResponse({ status: 200, description: 'Customer authenticated successfully' })
  async customerLogin(@Body() dto: CustomerLoginDto) {
    return this.authService.customerLogin(dto);
  }

  @Post('users/register')
  @UseGuards(RolesGuard)
  @Roles(RoleType.OWNER)
  @ApiOperation({ summary: 'Register new staff user (Owner only)' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async registerUser(@Body() dto: RegisterUserDto) {
    return this.authService.registerUser(dto);
  }
}
