import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PortalService } from './portal.service';
import { InitiateOnlinePaymentDto, ConfirmOnlinePaymentDto } from './portal.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '@credit-shop/shared-types';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Customer Self-Service Portal')
@ApiBearerAuth()
@Controller('portal')
@UseGuards(RolesGuard)
@Roles(RoleType.CUSTOMER)
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current customer profile & live outstanding balance' })
  async getProfile(@CurrentUser('id') customerId: string) {
    return this.portalService.getCustomerProfile(customerId);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get past purchase orders for the authenticated customer' })
  async getOrders(@CurrentUser('id') customerId: string) {
    return this.portalService.getCustomerOrders(customerId);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get past payment receipts for the authenticated customer' })
  async getPayments(@CurrentUser('id') customerId: string) {
    return this.portalService.getCustomerPayments(customerId);
  }

  @Get('statement')
  @ApiOperation({ summary: 'Get full credit & payment ledger statement for customer' })
  async getStatement(@CurrentUser('id') customerId: string) {
    return this.portalService.getCustomerStatement(customerId);
  }

  @Post('pay/initiate')
  @ApiOperation({ summary: 'Initiate online repayment session' })
  async initiatePayment(
    @CurrentUser('id') customerId: string,
    @Body() dto: InitiateOnlinePaymentDto,
  ) {
    return this.portalService.initiatePayment(customerId, dto);
  }

  @Post('pay/confirm')
  @ApiOperation({ summary: 'Confirm online payment completion from gateway webhook or callback' })
  async confirmPayment(
    @CurrentUser('id') customerId: string,
    @Body() dto: ConfirmOnlinePaymentDto,
  ) {
    return this.portalService.confirmPayment(customerId, dto);
  }
}
