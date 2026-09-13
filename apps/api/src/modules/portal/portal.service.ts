import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { LedgerService } from '../ledger/ledger.service';
import { InitiateOnlinePaymentDto, ConfirmOnlinePaymentDto } from './portal.dto';
import { PaymentMode, roundCurrency } from '@credit-shop/shared-types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PortalService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private ledgerService: LedgerService,
  ) {}

  async getCustomerProfile(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        village: true,
        creditAccount: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    return {
      id: customer.id,
      customerCode: customer.customerCode,
      fullName: customer.fullName,
      phone: customer.phone,
      villageName: customer.village.name,
      creditLimit: Number(customer.creditAccount?.creditLimit || customer.creditLimit),
      currentOutstanding: Number(customer.creditAccount?.cachedOutstanding || 0),
    };
  }

  async getCustomerOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { orderDate: 'desc' },
    });
  }

  async getCustomerPayments(customerId: string) {
    return this.prisma.payment.findMany({
      where: { customerId },
      include: { allocations: true },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async getCustomerStatement(customerId: string) {
    return this.ledgerService.getCustomerStatement(customerId);
  }

  async initiatePayment(customerId: string, dto: InitiateOnlinePaymentDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { creditAccount: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const outstanding = Number(customer.creditAccount?.cachedOutstanding || 0);
    const amount = roundCurrency(dto.amount);

    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const paymentOrderId = `PAY-SESSION-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      sessionId: paymentOrderId,
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      amount,
      currentOutstanding: outstanding,
      currency: 'INR',
      notes: dto.notes,
      gatewayUrl: `/portal/pay/checkout?session=${paymentOrderId}`,
    };
  }

  async confirmPayment(customerId: string, dto: ConfirmOnlinePaymentDto) {
    const payment = await this.paymentsService.recordPayment(
      {
        customerId,
        amount: dto.amount,
        mode: PaymentMode.ONLINE_GATEWAY,
        referenceNumber: dto.gatewayTransactionId,
        idempotencyKey: `online-pay-${dto.gatewayTransactionId}`,
        notes: dto.notes || 'Customer online self-service repayment',
      },
      customerId,
    );

    return {
      status: 'SUCCESS',
      message: 'Payment verified and credited to your account ledger',
      receiptNumber: (payment as any).receiptNumber,
      amount: (payment as any).amount,
      newOutstanding: (payment as any).newOutstanding,
    };
  }
}
