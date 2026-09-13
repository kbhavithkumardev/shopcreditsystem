import { Module } from '@nestjs/common';
import { AiToolsService } from './ai-tools.service';
import { AiToolsController } from './ai-tools.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [AiToolsController],
  providers: [AiToolsService, PrismaService],
  exports: [AiToolsService],
})
export class AiToolsModule {}
