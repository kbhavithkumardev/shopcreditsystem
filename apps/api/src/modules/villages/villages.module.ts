import { Module } from '@nestjs/common';
import { VillagesService } from './villages.service';
import { VillagesController } from './villages.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [VillagesController],
  providers: [VillagesService, PrismaService],
  exports: [VillagesService],
})
export class VillagesModule {}
