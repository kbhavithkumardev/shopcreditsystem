import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { CreateCollectionCycleDto, UpdateCollectionEntryDto } from './collections.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleType } from '@credit-shop/shared-types';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Collection Cycles & Village Sheets')
@ApiBearerAuth()
@Controller('collections')
@UseGuards(RolesGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('cycles')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER, RoleType.COLLECTION_AGENT)
  @ApiOperation({ summary: 'Get all collection cycles with progress metrics' })
  async findAllCycles() {
    return this.collectionsService.findAllCycles();
  }

  @Get('cycles/:id')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER, RoleType.COLLECTION_AGENT)
  @ApiOperation({ summary: 'Get single collection cycle breakdown with all entries' })
  async findOneCycle(@Param('id') id: string) {
    return this.collectionsService.findOneCycle(id);
  }

  @Get('cycles/:cycleId/villages/:villageId')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER, RoleType.COLLECTION_AGENT)
  @ApiOperation({ summary: 'Generate field collection sheet for a specific village in a cycle' })
  async getVillageCollectionSheet(
    @Param('cycleId') cycleId: string,
    @Param('villageId') villageId: string,
  ) {
    return this.collectionsService.getVillageCollectionSheet(cycleId, villageId);
  }

  @Post('cycles')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER)
  @ApiOperation({ summary: 'Create a new collection cycle and auto-populate village debtor lists' })
  async createCycle(@Body() dto: CreateCollectionCycleDto, @CurrentUser('id') userId: string) {
    return this.collectionsService.createCycle(dto, userId);
  }

  @Put('entries/:entryId')
  @Roles(RoleType.OWNER, RoleType.SHOP_MANAGER, RoleType.COLLECTION_AGENT)
  @ApiOperation({ summary: 'Update field collection status or customer promise date' })
  async updateEntry(
    @Param('entryId') entryId: string,
    @Body() dto: UpdateCollectionEntryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.collectionsService.updateEntry(entryId, dto, userId);
  }
}
