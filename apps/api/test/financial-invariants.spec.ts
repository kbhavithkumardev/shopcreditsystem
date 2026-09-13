import {
  calculateOrderTotals,
  allocatePaymentFIFO,
  deriveOutstandingBalanceFromLedger,
  roundCurrency,
} from '@credit-shop/shared-types';

describe('Financial Invariants & Zero Silent Inconsistency Suite', () => {
  describe('Order Total Calculations', () => {
    it('should accurately calculate grand total and credit amount for standard split payment', () => {
      const result = calculateOrderTotals({
        subtotal: 20000.00,
        discountTotal: 500.00,
        taxTotal: 100.00,
        otherCharges: 50.00,
        immediatePaid: 5000.00,
      });

      // Grand Total = 20000 - 500 + 100 + 50 = 19650
      // Credit Amount = 19650 - 5000 = 14650
      expect(result.grandTotal).toBe(19650.00);
      expect(result.immediatePaid).toBe(5000.00);
      expect(result.creditAmount).toBe(14650.00);
      expect(result.outstandingBalance).toBe(14650.00);
    });

    it('should handle zero immediate payment (100% credit purchase)', () => {
      const result = calculateOrderTotals({
        subtotal: 3500.00,
        immediatePaid: 0.00,
      });

      expect(result.grandTotal).toBe(3500.00);
      expect(result.immediatePaid).toBe(0.00);
      expect(result.creditAmount).toBe(3500.00);
      expect(result.outstandingBalance).toBe(3500.00);
    });

    it('should handle 100% immediate payment (zero credit generated)', () => {
      const result = calculateOrderTotals({
        subtotal: 4500.00,
        immediatePaid: 4500.00,
      });

      expect(result.grandTotal).toBe(4500.00);
      expect(result.creditAmount).toBe(0.00);
      expect(result.outstandingBalance).toBe(0.00);
    });

    it('should throw an error if immediate payment exceeds grand total', () => {
      expect(() => {
        calculateOrderTotals({
          subtotal: 1000.00,
          immediatePaid: 1500.00,
        });
      }).toThrow('Immediate payment (1500) cannot exceed grand total (1000)');
    });

    it('should throw an error if subtotal is negative', () => {
      expect(() => {
        calculateOrderTotals({
          subtotal: -100.00,
        });
      }).toThrow('Order subtotal cannot be negative');
    });
  });

  describe('FIFO Payment Allocation Engine', () => {
    it('should allocate payment across multiple unpaid orders in chronological FIFO order', () => {
      const unpaidOrders = [
        {
          orderId: 'ord-1',
          orderNumber: 'ORD-001',
          orderDate: '2026-08-01',
          outstandingBalance: 10000.00,
        },
        {
          orderId: 'ord-2',
          orderNumber: 'ORD-002',
          orderDate: '2026-08-10',
          outstandingBalance: 8000.00,
        },
        {
          orderId: 'ord-3',
          orderNumber: 'ORD-003',
          orderDate: '2026-08-20',
          outstandingBalance: 7000.00,
        },
      ];

      // Payment of ₹12,000 should fully pay ORD-001 (10,000) and allocate ₹2,000 to ORD-002
      const result = allocatePaymentFIFO(12000.00, unpaidOrders);

      expect(result.totalAllocated).toBe(12000.00);
      expect(result.unallocatedAmount).toBe(0.00);
      expect(result.allocations).toHaveLength(2);

      expect(result.allocations[0].orderId).toBe('ord-1');
      expect(result.allocations[0].allocatedAmount).toBe(10000.00);
      expect(result.allocations[0].remainingOutstanding).toBe(0.00);

      expect(result.allocations[1].orderId).toBe('ord-2');
      expect(result.allocations[1].allocatedAmount).toBe(2000.00);
      expect(result.allocations[1].remainingOutstanding).toBe(6000.00);
    });

    it('should track unallocated remainder if payment exceeds total debt', () => {
      const unpaidOrders = [
        {
          orderId: 'ord-1',
          orderNumber: 'ORD-001',
          orderDate: '2026-08-01',
          outstandingBalance: 3000.00,
        },
      ];

      const result = allocatePaymentFIFO(5000.00, unpaidOrders);

      expect(result.totalAllocated).toBe(3000.00);
      expect(result.unallocatedAmount).toBe(2000.00);
      expect(result.allocations[0].remainingOutstanding).toBe(0.00);
    });
  });

  describe('Authoritative Ledger Balance Derivation', () => {
    it('should accurately calculate customer balance across debits, credits, and adjustments', () => {
      const ledgerEntries = [
        { debitAmount: 10000.00, creditAmount: 0.00 }, // Opening balance
        { debitAmount: 8000.00, creditAmount: 0.00 },  // Sale 1
        { debitAmount: 0.00, creditAmount: 3000.00 },  // Payment 1
        { debitAmount: 5000.00, creditAmount: 0.00 },  // Sale 2
        { debitAmount: 0.00, creditAmount: 2000.00 },  // Payment 2
        { debitAmount: 0.00, creditAmount: 500.00 },   // Discount adjustment
      ];

      // Sum(Debits) = 10000 + 8000 + 5000 = 23000
      // Sum(Credits) = 3000 + 2000 + 500 = 5500
      // Balance = 23000 - 5500 = 17500
      const balance = deriveOutstandingBalanceFromLedger(ledgerEntries);
      expect(balance).toBe(17500.00);
    });

    it('should handle floating point fractional amounts without decimal skew', () => {
      const entries = [
        { debitAmount: 19.99, creditAmount: 0.00 },
        { debitAmount: 29.99, creditAmount: 0.00 },
        { debitAmount: 0.00, creditAmount: 10.50 },
      ];

      const balance = deriveOutstandingBalanceFromLedger(entries);
      // 19.99 + 29.99 - 10.50 = 39.48
      expect(balance).toBe(39.48);
    });
  });
});
