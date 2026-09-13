import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './orders.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleType } from '@credit-shop/shared-types';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER, RoleType.COLLECTION_AGENT)
  @ApiOperation({ summary: 'List all orders with optional customer or status filtering' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false })
  async findAll(
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
  ) {
    return this.ordersService.findAll({ customerId, status, paymentStatus });
  }

  @Get(':id')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER, RoleType.COLLECTION_AGENT)
  @ApiOperation({ summary: 'Get single order details with item breakdown and payment allocations' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER)
  @ApiOperation({ summary: 'Create a new order with immediate payment split and credit remainder' })
  async create(@Body() dto: CreateOrderDto, @CurrentUser('id') userId: string) {
    return this.ordersService.create(dto, userId);
  }

  @Put(':id/status')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER)
  @ApiOperation({ summary: 'Update order lifecycle status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.updateStatus(id, dto, userId);
  }
}
