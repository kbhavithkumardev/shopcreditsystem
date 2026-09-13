import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '@credit-shop/shared-types';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Owner Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER)
  @ApiOperation({ summary: 'Get owner executive KPI metrics, collections, sales, and top debtors' })
  async getMetrics() {
    return this.dashboardService.getExecutiveMetrics();
  }
}
