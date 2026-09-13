import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, CheckDuplicateCustomerDto, PaperBookMigrationDto } from './customers.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleType } from '@credit-shop/shared-types';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER, RoleType.COLLECTION_AGENT)
  @ApiOperation({ summary: 'List all customers with filters for village and search' })
  @ApiQuery({ name: 'villageId', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(@Query('villageId') villageId?: string, @Query('search') search?: string) {
    return this.customersService.findAll({ villageId, search });
  }

  @Get(':id')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER, RoleType.COLLECTION_AGENT)
  @ApiOperation({ summary: 'Get basic customer details by ID' })
  async findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/360')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER, RoleType.COLLECTION_AGENT)
  @ApiOperation({ summary: 'Get complete Customer 360° profile, orders, payments, and ledger history' })
  async findCustomer360(@Param('id') id: string) {
    return this.customersService.findCustomer360(id);
  }

  @Post('check-duplicate')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER)
  @ApiOperation({ summary: 'Check for duplicate customers by phone or name' })
  async checkDuplicate(@Body() dto: CheckDuplicateCustomerDto) {
    return this.customersService.checkDuplicates(dto);
  }

  @Post()
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER)
  @ApiOperation({ summary: 'Create a new customer with a zero-balance credit account' })
  async create(@Body() dto: CreateCustomerDto, @CurrentUser('id') userId: string) {
    return this.customersService.create(dto, userId);
  }

  @Post('migrate-paper-book')
  @Roles(RoleType.OWNER)
  @ApiOperation({ summary: 'Paper-Book Migration: Import customer with opening credit balance (Owner only)' })
  async migrateFromPaperBook(@Body() dto: PaperBookMigrationDto, @CurrentUser('id') userId: string) {
    return this.customersService.migrateFromPaperBook(dto, userId);
  }

  @Put(':id')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER)
  @ApiOperation({ summary: 'Update customer details' })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @CurrentUser('id') userId: string) {
    return this.customersService.update(id, dto, userId);
  }
}
