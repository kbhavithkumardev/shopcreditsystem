import { RoleType, OrderStatus, PaymentStatus, PaymentMode, TransactionType, CollectionCycleStatus, CollectionEntryStatus } from './enums';

export interface UserDto {
  id: string;
  email?: string | null;
  phone: string;
  fullName: string;
  role: RoleType;
  isActive: boolean;
  createdAt: string;
}

export interface VillageDto {
  id: string;
  name: string;
  code?: string | null;
  taluk?: string | null;
  district?: string | null;
  pincode?: string | null;
  notes?: string | null;
  customerCount?: number;
  totalOutstanding?: number;
  createdAt: string;
}

export interface CustomerDto {
  id: string;
  villageId: string;
  villageName?: string;
  customerCode: string;
  fullName: string;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  address?: string | null;
  creditLimit: number;
  currentOutstanding: number;
  notes?: string | null;
  tags: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Customer360Dto extends CustomerDto {
  totalPurchases: number;
  totalPaid: number;
  totalOrders: number;
  lastOrderDate?: string | null;
  lastPaymentDate?: string | null;
  availableCredit: number;
  unpaidOrdersCount: number;
}

export interface ProductDto {
  id: string;
  name: string;
  code?: string | null;
  barcode?: string | null;
  category?: string | null;
  unit: string;
  unitPrice: number;
  costPrice?: number | null;
  isActive: boolean;
}

export interface OrderItemDto {
  id?: string;
  productId?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  villageName?: string;
  orderDate: string;
  status: OrderStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  otherCharges: number;
  grandTotal: number;
  immediatePaid: number;
  creditAmount: number;
  allocatedPaid: number;
  outstandingBalance: number;
  paymentStatus: PaymentStatus;
  notes?: string | null;
  items: OrderItemDto[];
  createdAt: string;
}

export interface PaymentDto {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName?: string;
  amount: number;
  paymentDate: string;
  mode: PaymentMode;
  referenceNumber?: string | null;
  notes?: string | null;
  allocations?: {
    orderId: string;
    orderNumber: string;
    amount: number;
  }[];
  createdAt: string;
}

export interface LedgerEntryDto {
  id: string;
  entryNumber: string;
  customerId: string;
  customerName?: string;
  orderId?: string | null;
  paymentId?: string | null;
  type: TransactionType;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
  description: string;
  referenceId?: string | null;
  createdAt: string;
}

export interface CollectionCycleDto {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: CollectionCycleStatus;
  totalTarget: number;
  totalCollected: number;
  remainingTarget: number;
  collectionPercentage: number;
  villagesCount: number;
  customersCount: number;
}

export interface VillageCollectionSheetDto {
  villageId: string;
  villageName: string;
  totalCustomers: number;
  totalOutstanding: number;
  totalExpected: number;
  totalCollected: number;
  remainingDue: number;
  collectionPercentage: number;
  entries: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    openingOutstanding: number;
    expectedTarget: number;
    collectedAmount: number;
    remainingDue: number;
    status: CollectionEntryStatus;
    promiseDate?: string | null;
    notes?: string | null;
  }[];
}
