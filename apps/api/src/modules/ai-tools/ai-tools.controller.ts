import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AiToolsService } from './ai-tools.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '@credit-shop/shared-types';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('AI & Intelligence Tools')
@ApiBearerAuth()
@Controller('ai-tools')
@UseGuards(RolesGuard)
export class AiToolsController {
  constructor(private readonly aiToolsService: AiToolsService) {}

  @Get('village-summary/:villageId')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER)
  @ApiOperation({ summary: 'Tool: get_village_summary (Authoritative village credit analysis)' })
  async getVillageSummary(@Param('villageId') villageId: string) {
    return this.aiToolsService.getVillageSummary(villageId);
  }

  @Get('customer-balance/:customerId')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER)
  @ApiOperation({ summary: 'Tool: get_customer_balance (Authoritative customer debt & unpaid orders)' })
  async getCustomerBalance(@Param('customerId') customerId: string) {
    return this.aiToolsService.getCustomerBalance(customerId);
  }

  @Get('overdue-customers')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER)
  @ApiOperation({ summary: 'Tool: get_overdue_customers (List orders pending past N days)' })
  @ApiQuery({ name: 'minDays', required: false })
  async getOverdueCustomers(@Query('minDays') minDays?: string) {
    const days = minDays ? parseInt(minDays, 10) : 30;
    return this.aiToolsService.getOverdueCustomers(days);
  }
}
