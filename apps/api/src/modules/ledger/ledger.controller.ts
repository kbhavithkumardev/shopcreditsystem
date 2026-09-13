import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { CreateAdjustmentDto, ReverseTransactionDto } from './ledger.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleType } from '@credit-shop/shared-types';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Financial Ledger')
@ApiBearerAuth()
@Controller('ledger')
@UseGuards(RolesGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('entries')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER, RoleType.COLLECTION_AGENT)
  @ApiOperation({ summary: 'Get append-only ledger transaction entries' })
  @ApiQuery({ name: 'customerId', required: false })
  async findLedgerEntries(@Query('customerId') customerId?: string) {
    return this.ledgerService.findLedgerEntries({ customerId });
  }

  @Get('statement/:customerId')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER, RoleType.COLLECTION_AGENT)
  @ApiOperation({ summary: 'Generate detailed customer financial statement with running balance' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getCustomerStatement(
    @Param('customerId') customerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ledgerService.getCustomerStatement(customerId, startDate, endDate);
  }

  @Get('reconciliation')
  @Roles(RoleType.OWNER)
  @ApiOperation({ summary: 'Run full-database financial reconciliation check (Owner only)' })
  async reconcileBalances() {
    return this.ledgerService.reconcileAllCustomerBalances();
  }

  @Post('adjustment')
  @Roles(RoleType.OWNER)
  @ApiOperation({ summary: 'Create auditable ledger adjustment (Owner only)' })
  async createAdjustment(@Body() dto: CreateAdjustmentDto, @CurrentUser('id') userId: string) {
    return this.ledgerService.createAdjustment(dto, userId);
  }

  @Post('reversal')
  @Roles(RoleType.OWNER)
  @ApiOperation({ summary: 'Reverse a past ledger transaction (Owner only)' })
  async reverseTransaction(@Body() dto: ReverseTransactionDto, @CurrentUser('id') userId: string) {
    return this.ledgerService.reverseTransaction(dto, userId);
  }
}
