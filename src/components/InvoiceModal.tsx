import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Building } from 'lucide-react';
import { Order } from '../types';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = order.invoiceNumber || `INV-2026-${order.id.replace('VYM-', '')}`;
  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Calculate GST Breakdown (18% inclusive)
  const taxableAmount = Math.round(order.finalPayable / 1.18);
  const totalGst = order.finalPayable - taxableAmount;
  const cgst = Math.round(totalGst / 2);
  const sgst = Math.round(totalGst / 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white text-gray-900 rounded-xl shadow-2xl overflow-hidden my-4 border border-gray-200 flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Controls Bar */}
        <div className="bg-[#172337] px-6 py-3.5 flex items-center justify-between text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Tax Invoice</span>
            <span className="text-xs bg-blue-900 text-blue-200 font-mono px-2 py-0.5 rounded">
              #{order.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#2874f0] hover:bg-blue-600 text-white text-xs font-bold px-3.5 py-1.5 rounded transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div className="p-8 overflow-y-auto flex-1 text-xs text-gray-800 space-y-6 print:p-0 print:m-0" id="printable-invoice">
          
          {/* Header & Seller Info */}
          <div className="flex justify-between items-start pb-6 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black text-[#2874f0] tracking-wider">VYUMA</span>
                <span className="text-[10px] bg-[#ffe500] text-blue-950 font-black px-1.5 py-0.2 rounded uppercase">
                  RETAIL
                </span>
              </div>
              <p className="font-bold text-gray-900">Vyuma Retail Private Limited</p>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                Plot 42, Electronic City Phase 1<br />
                Bengaluru, Karnataka - 560100, India<br />
                GSTIN: 29AABCU9603R1ZM • PAN: AABCU9603R<br />
                CIN: U51909KA2024PTC184201
              </p>
            </div>

            <div className="text-right">
              <span className="text-base font-black text-gray-900 block mb-1">TAX INVOICE</span>
              <p className="text-[11px] text-gray-600">
                <strong>Invoice No:</strong> {invoiceNumber}<br />
                <strong>Invoice Date:</strong> {invoiceDate}<br />
                <strong>Order ID:</strong> #{order.id}<br />
                <strong>State Code:</strong> 29 (Karnataka)
              </p>
            </div>
          </div>

          {/* Customer Billing & Shipping Address */}
          <div className="grid grid-cols-2 gap-6 pb-6 border-b border-gray-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Billed To (Customer):
              </span>
              <p className="font-bold text-gray-900">{order.shippingAddress.fullName}</p>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                {order.shippingAddress.addressLine}<br />
                {order.shippingAddress.locality && `${order.shippingAddress.locality}, `}
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}<br />
                Phone: {order.shippingAddress.mobile}<br />
                Email: {order.userEmail}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Shipping & Consignment Address:
              </span>
              <p className="font-bold text-gray-900">{order.shippingAddress.fullName}</p>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                {order.shippingAddress.addressLine}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}<br />
                Courier: {order.courierPartner || 'Vyuma Express Delivery'}<br />
                AWB / Tracking: {order.trackingNumber || 'TRK-IN-VERIFIED'}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-[10px] uppercase font-bold border-y border-gray-200">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Taxable Val</th>
                  <th className="py-2.5 px-3 text-right">GST (18%)</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[11px]">
                {order.items.map((item, idx) => {
                  const unitPrice = item.selectedVariant ? item.selectedVariant.price : item.product.price;
                  const itemTotal = unitPrice * item.quantity;
                  const itemTaxable = Math.round(itemTotal / 1.18);
                  const itemGst = itemTotal - itemTaxable;

                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-3 px-3 text-gray-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-gray-900 block">{item.product.title}</span>
                        <span className="text-[10px] text-gray-500">
                          Brand: {item.product.brand} • SKU: {item.product.sku || item.product.id}
                          {item.selectedVariant && ` • Variant: ${item.selectedVariant.name}`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                      <td className="py-3 px-3 text-right">₹{unitPrice.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right">₹{itemTaxable.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right text-gray-500">₹{itemGst.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">
                        ₹{itemTotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pricing Summary & Calculations */}
          <div className="flex justify-between items-start pt-4 border-t border-gray-200">
            <div className="space-y-2 max-w-sm">
              <div className="p-3 bg-gray-50 rounded border border-gray-200 text-[11px]">
                <span className="font-bold text-gray-900 block mb-1">Payment Information:</span>
                <p className="text-gray-600">
                  Method: <strong>{order.paymentMethod}</strong> • Status: <strong>{order.paymentStatus}</strong><br />
                  Gateway Ref: <span className="font-mono text-gray-800">{order.razorpayPaymentId || 'N/A'}</span>
                </p>
              </div>

              {order.couponCode && (
                <p className="text-[10px] text-green-700 font-bold">
                  ✓ Promotional discount applied with code: {order.couponCode} (-₹{order.couponDiscount})
                </p>
              )}
            </div>

            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal:</span>
                <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-700 font-medium">
                  <span>Catalog Discount:</span>
                  <span>- ₹{order.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {order.couponDiscount && order.couponDiscount > 0 ? (
                <div className="flex justify-between text-green-700 font-medium">
                  <span>Coupon Discount:</span>
                  <span>- ₹{order.couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charges:</span>
                <span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Packaging Fee:</span>
                <span>₹{order.packagingFee}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-[10px] pt-1 border-t border-gray-100">
                <span>Includes IGST / CGST+SGST (18%):</span>
                <span>₹{totalGst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-gray-900 text-sm font-black text-gray-900">
                <span>Total Amount Paid:</span>
                <span className="text-[#2874f0]">₹{order.finalPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms & Signatory */}
          <div className="pt-6 border-t border-gray-200 flex justify-between items-end text-[10px] text-gray-500">
            <div>
              <p className="font-bold text-gray-700 mb-1">Declaration & Terms:</p>
              <p className="max-w-md leading-relaxed">
                This is a computer-generated tax invoice and does not require physical signature.<br />
                All disputes are subject to Bengaluru jurisdiction. Genuine marketplace guarantee by VYUMA.
              </p>
            </div>

            <div className="text-right">
              <div className="w-28 h-10 border-b border-gray-400 mx-auto mb-1 flex items-end justify-center font-serif italic text-gray-600 text-xs">
                Vyuma Authorized
              </div>
              <span className="block font-bold text-gray-800">For Vyuma Retail Pvt Ltd</span>
              <span className="text-[9px] text-gray-400">Authorized Signatory</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
