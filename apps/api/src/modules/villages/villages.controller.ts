import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VillagesService } from './villages.service';
import { CreateVillageDto, UpdateVillageDto } from './villages.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '@credit-shop/shared-types';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Villages')
@ApiBearerAuth()
@Controller('villages')
@UseGuards(RolesGuard)
export class VillagesController {
  constructor(private readonly villagesService: VillagesService) {}

  @Get()
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER, RoleType.COLLECTION_AGENT)
  @ApiOperation({ summary: 'Get all villages with customer count & aggregate outstanding' })
  async findAll() {
    return this.villagesService.findAll();
  }

  @Get(':id')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER, RoleType.COLLECTION_AGENT)
  @ApiOperation({ summary: 'Get single village details with customer list' })
  async findOne(@Param('id') id: string) {
    return this.villagesService.findOne(id);
  }

  @Post()
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER)
  @ApiOperation({ summary: 'Create a new village' })
  async create(@Body() dto: CreateVillageDto) {
    return this.villagesService.create(dto);
  }

  @Put(':id')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER)
  @ApiOperation({ summary: 'Update village details' })
  async update(@Param('id') id: string, @Body() dto: UpdateVillageDto) {
    return this.villagesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleType.OWNER)
  @ApiOperation({ summary: 'Delete village if empty (Owner only)' })
  async delete(@Param('id') id: string) {
    return this.villagesService.delete(id);
  }
}
