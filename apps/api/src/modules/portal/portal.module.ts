import { Module } from '@nestjs/common';
import { PortalService } from './portal.service';
import { PortalController } from './portal.controller';
import { PrismaService } from '../../database/prisma.service';
import { PaymentsModule } from '../payments/payments.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [PaymentsModule, LedgerModule],
  controllers: [PortalController],
  providers: [PortalService, PrismaService],
  exports: [PortalService],
})
export class PortalModule {}
