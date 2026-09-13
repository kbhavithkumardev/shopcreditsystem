'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  CreditCard,
  Banknote,
  ArrowRight,
} from 'lucide-react';
import { apiFetch, formatINR } from '@/lib/api';

export default function POSPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cart, setCart] = useState<any[]>([]);

  // Calculation parameters
  const [discountTotal, setDiscountTotal] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [immediatePaid, setImmediatePaid] = useState(0);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [orderNotes, setOrderNotes] = useState('');

  // Product search state
  const [productSearch, setProductSearch] = useState('');

  // Modal / Success State
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [cList, pList] = await Promise.all([
        apiFetch<any[]>('/customers'),
        apiFetch<any[]>('/products'),
      ]);
      setCustomers(cList);
      setProducts(pList);
    } catch (e) {
      console.error(e);
    }
  }

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  function addToCart(product: any) {
    const existing = cart.find((i) => i.productId === product.id);
    if (existing) {
      setCart(
        cart.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          unitPrice: product.unitPrice,
          unit: product.unit,
          quantity: 1,
        },
      ]);
    }
  }

  function updateQuantity(index: number, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    const next = [...cart];
    next[index].quantity = quantity;
    setCart(next);
  }

  function removeFromCart(index: number) {
    setCart(cart.filter((_, i) => i !== index));
  }

  // Financial Invariant Computations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal + otherCharges);
  const creditAmount = Math.max(0, grandTotal - immediatePaid);

  const currentOutstanding = selectedCustomer?.currentOutstanding || 0;
  const creditLimit = selectedCustomer?.creditLimit || 0;
  const projectedOutstanding = currentOutstanding + creditAmount;
  const isOverLimit = creditLimit > 0 && projectedOutstanding > creditLimit;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('Please select a customer for this order');
      return;
    }
    if (cart.length === 0) {
      alert('Cart is empty. Add products before completing checkout.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch<any>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: cart.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          discountTotal,
          taxTotal,
          otherCharges,
          immediatePaid,
          paymentMode,
          notes: orderNotes || undefined,
        }),
      });

      setCreatedOrder(res);
      // Reset form
      setCart([]);
      setImmediatePaid(0);
      setDiscountTotal(0);
      setOrderNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(productSearch.toLowerCase())) ||
    (p.barcode && p.barcode.includes(productSearch)),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">POS & Credit Sale Checkout</h1>
        <p className="text-sm text-slate-500">
          Create purchase orders, record immediate cash/UPI down-payments, and defer remainder to customer ledger.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Selection & Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Selector Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Select Customer *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Choose Customer (Organized Village-Wise) --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.villageName}) - Phone: {c.phone} [Owed: ₹{c.currentOutstanding}]
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
                <div>
                  <span className="font-bold">{selectedCustomer.fullName}</span> ({selectedCustomer.villageName})
                  <div className="text-[11px] text-emerald-800">Current Debt: <strong>{formatINR(selectedCustomer.currentOutstanding)}</strong></div>
                </div>
                <div className="text-right">
                  <div>Credit Limit: <strong>{formatINR(selectedCustomer.creditLimit)}</strong></div>
                  <div className="font-semibold text-emerald-700">Available: {formatINR(Math.max(0, selectedCustomer.creditLimit - selectedCustomer.currentOutstanding))}</div>
                </div>
              </div>
            )}
          </div>

          {/* Product Catalog Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Select Products to Add
              </label>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700">{p.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{p.category || 'Grocery'} • {p.unit}</div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-900 text-sm">{formatINR(p.unitPrice)}</span>
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Split Payment (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 sticky top-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" /> Current Bill ({cart.length} items)
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Clear Bill
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {cart.map((item, index) => (
                <div key={item.productId} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                  <div className="flex-1 pr-2">
                    <div className="font-semibold text-slate-900">{item.productName}</div>
                    <div className="text-slate-400">{formatINR(item.unitPrice)} / {item.unit}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(index, parseFloat(e.target.value) || 0)}
                      className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-center font-bold text-slate-900"
                    />
                    <span className="font-bold text-slate-900 w-16 text-right">
                      {formatINR(item.quantity * item.unitPrice)}
                    </span>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Cart is empty. Click on products to add.
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={discountTotal}
                  onChange={(e) => setDiscountTotal(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-0.5 border border-slate-300 rounded text-right text-xs"
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Tax / GST (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={taxTotal}
                  onChange={(e) => setTaxTotal(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-0.5 border border-slate-300 rounded text-right text-xs"
                />
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-base text-slate-950 font-extrabold">{formatINR(grandTotal)}</span>
              </div>
            </div>

            {/* Split Payment Controls */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Split Payment: Down Payment vs. Credit
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-900 mb-1">
                  Immediate Down-Payment (Cash/UPI)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={immediatePaid}
                    onChange={(e) => setImmediatePaid(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none"
                  />
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold text-amber-950 pt-2 border-t border-amber-200">
                <span>Deferred to Credit Ledger:</span>
                <span className="text-sm font-extrabold text-amber-900">{formatINR(creditAmount)}</span>
              </div>
            </div>

            {/* Credit Limit Alert */}
            {isOverLimit && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Credit Limit Exceeded:</strong> Projected balance (₹{projectedOutstanding}) will exceed customer credit limit (₹{creditLimit}).
                </div>
              </div>
            )}

            {/* Submit Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0 || !selectedCustomerId}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" /> Complete Bill & Post to Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {createdOrder && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Order Completed Successfully!</h2>
            <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl space-y-1.5 font-mono text-left">
              <div>Order #: <strong>{createdOrder.orderNumber}</strong></div>
              <div>Grand Total: <strong>{formatINR(createdOrder.grandTotal)}</strong></div>
              <div>Immediate Paid: <strong>{formatINR(createdOrder.immediatePaid)}</strong></div>
              <div>Credit Remaining: <strong className="text-amber-700">{formatINR(createdOrder.creditAmount)}</strong></div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCreatedOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
              >
                New Sale
              </button>
              <Link
                href={`/dashboard/customers/${createdOrder.customerId}`}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors inline-flex items-center justify-center gap-1"
              >
                View Customer 360° <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
