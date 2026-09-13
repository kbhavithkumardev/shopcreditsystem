/**
 * Financial Calculation & Invariant Validation Utility
 * Enforces Zero Silent Financial Inconsistency across backend and frontend.
 */

export function roundCurrency(amount: number | string): number {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numeric)) {
    throw new Error(`Invalid monetary amount: ${amount}`);
  }
  return Math.round((numeric + Number.EPSILON) * 100) / 100;
}

export interface OrderCalculationInput {
  subtotal: number;
  discountTotal?: number;
  taxTotal?: number;
  otherCharges?: number;
  immediatePaid?: number;
}

export interface OrderCalculationResult {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  otherCharges: number;
  grandTotal: number;
  immediatePaid: number;
  creditAmount: number;
  outstandingBalance: number;
}

/**
 * Calculates Grand Total, Credit Remainder, and Outstanding for an Order
 * Formula: GrandTotal = Subtotal - DiscountTotal + TaxTotal + OtherCharges
 * Formula: CreditAmount = GrandTotal - ImmediatePaid
 */
export function calculateOrderTotals(input: OrderCalculationInput): OrderCalculationResult {
  const subtotal = roundCurrency(input.subtotal);
  const discountTotal = roundCurrency(input.discountTotal ?? 0);
  const taxTotal = roundCurrency(input.taxTotal ?? 0);
  const otherCharges = roundCurrency(input.otherCharges ?? 0);
  const immediatePaid = roundCurrency(input.immediatePaid ?? 0);

  if (subtotal < 0) {
    throw new Error('Order subtotal cannot be negative');
  }
  if (discountTotal < 0) {
    throw new Error('Discount cannot be negative');
  }
  if (immediatePaid < 0) {
    throw new Error('Immediate payment cannot be negative');
  }

  const grandTotal = roundCurrency(subtotal - discountTotal + taxTotal + otherCharges);
  if (grandTotal < 0) {
    throw new Error(`Calculated grand total cannot be negative (Calculated: ${grandTotal})`);
  }

  if (immediatePaid > grandTotal) {
    throw new Error(`Immediate payment (${immediatePaid}) cannot exceed grand total (${grandTotal})`);
  }

  const creditAmount = roundCurrency(grandTotal - immediatePaid);
  const outstandingBalance = creditAmount;

  return {
    subtotal,
    discountTotal,
    taxTotal,
    otherCharges,
    grandTotal,
    immediatePaid,
    creditAmount,
    outstandingBalance,
  };
}

export interface UnpaidOrder {
  orderId: string;
  orderNumber: string;
  orderDate: Date | string;
  outstandingBalance: number;
}

export interface AllocationResult {
  orderId: string;
  orderNumber: string;
  allocatedAmount: number;
  previousOutstanding: number;
  remainingOutstanding: number;
}

export interface MultiOrderAllocationOutput {
  allocations: AllocationResult[];
  totalAllocated: number;
  unallocatedAmount: number;
}

/**
 * Allocates a payment amount across unpaid orders using FIFO (Oldest Due First) strategy.
 */
export function allocatePaymentFIFO(
  paymentAmount: number,
  unpaidOrders: UnpaidOrder[]
): MultiOrderAllocationOutput {
  const roundedPayment = roundCurrency(paymentAmount);
  if (roundedPayment <= 0) {
    throw new Error('Payment amount must be greater than zero for allocation');
  }

  // Sort by order date ascending (FIFO)
  const sortedOrders = [...unpaidOrders].sort((a, b) => {
    const dateA = new Date(a.orderDate).getTime();
    const dateB = new Date(b.orderDate).getTime();
    return dateA - dateB;
  });

  let remainingPayment = roundedPayment;
  const allocations: AllocationResult[] = [];

  for (const order of sortedOrders) {
    if (remainingPayment <= 0) break;

    const currentDue = roundCurrency(order.outstandingBalance);
    if (currentDue <= 0) continue;

    const allocAmount = roundCurrency(Math.min(remainingPayment, currentDue));
    const newRemainingDue = roundCurrency(currentDue - allocAmount);

    allocations.push({
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      allocatedAmount: allocAmount,
      previousOutstanding: currentDue,
      remainingOutstanding: newRemainingDue,
    });

    remainingPayment = roundCurrency(remainingPayment - allocAmount);
  }

  const totalAllocated = roundCurrency(roundedPayment - remainingPayment);

  return {
    allocations,
    totalAllocated,
    unallocatedAmount: remainingPayment,
  };
}

export interface LedgerBalanceEntry {
  debitAmount: number | string;
  creditAmount: number | string;
}

/**
 * Authoritative Customer Balance Derivation:
 * Outstanding Balance = Sum(Debits) - Sum(Credits)
 */
export function deriveOutstandingBalanceFromLedger(entries: LedgerBalanceEntry[]): number {
  let balance = 0;
  for (const entry of entries) {
    const debit = roundCurrency(entry.debitAmount);
    const credit = roundCurrency(entry.creditAmount);
    balance = roundCurrency(balance + (debit - credit));
  }
  return balance;
}
