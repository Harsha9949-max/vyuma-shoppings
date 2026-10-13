import React, { useState } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ShoppingBag,
  FileText,
  XCircle,
  RotateCcw,
  Tag,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { Order, Product } from '../types';
import { InvoiceModal } from './InvoiceModal';

interface OrdersViewProps {
  onExploreProducts: () => void;
  onSelectProduct: (product: Product) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  onExploreProducts,
  onSelectProduct,
}) => {
  const { orders, updateOrderStatus, showToast } = useShop();
  const { user } = useAuth();
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Return modal state
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState<string>('Defective or Damaged Product');

  const handleCancelOrder = async (order: Order) => {
    if (confirm(`Are you sure you want to cancel Order #${order.id}?`)) {
      if (user?.uid) {
        await updateOrderStatus(order.id, user.uid, 'CANCELLED', 'REFUNDED');
        showToast(`Order #${order.id} has been cancelled successfully.`);
      }
    }
  };

  const handleConfirmReturn = async () => {
    if (!returnOrderId || !user?.uid) return;
    const order = orders.find((o) => o.id === returnOrderId);
    if (!order) return;

    await updateOrderStatus(
      order.id,
      user.uid,
      order.orderStatus,
      order.paymentStatus,
      order.trackingNumber,
      [...(order.internalNotes || []), `Return requested by customer. Reason: ${returnReason}`]
    );

    showToast(`Return request initiated for Order #${order.id}. Pickup scheduled!`);
    setReturnOrderId(null);
  };

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-12 flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-[#2874f0]">
            <Package className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Orders Placed Yet</h2>
          <p className="text-sm text-gray-500 max-w-md mb-6">
            You haven't placed any orders on Vyuma yet. Start shopping now to explore amazing discounts!
          </p>
          <button
            onClick={onExploreProducts}
            className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-sm px-6 py-2.5 rounded-sm shadow-md transition cursor-pointer"
          >
            Explore Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">My Orders</h1>
          <p className="text-xs text-gray-500">Live order tracking synced with Firestore database</p>
        </div>
        <span className="text-xs bg-blue-100 text-[#2874f0] font-bold px-3 py-1 rounded-full">
          {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
        </span>
      </div>

      <div className="space-y-6">
        {orders.map((order) => {
          const isCancelled = order.orderStatus === 'CANCELLED';
          const isDelivered = order.orderStatus === 'DELIVERED';
          const canCancel = order.orderStatus === 'CONFIRMED' || order.orderStatus === 'PACKED';

          return (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden"
            >
              {/* Order Header Bar */}
              <div className="bg-gray-50 px-6 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-5">
                  <div>
                    <span className="block text-gray-400 text-[10px] uppercase font-bold">
                      Order ID
                    </span>
                    <span className="font-black text-gray-900">#{order.id}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-[10px] uppercase font-bold">
                      Placed On
                    </span>
                    <span className="font-medium text-gray-700">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {order.couponCode && (
                    <div className="hidden sm:block">
                      <span className="block text-gray-400 text-[10px] uppercase font-bold">
                        Coupon Saved
                      </span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {order.couponCode} (-₹{order.couponDiscount})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="block text-gray-400 text-[10px] uppercase font-bold">
                      Final Payable
                    </span>
                    <span className="font-black text-[#2874f0] text-sm">
                      ₹{order.finalPayable.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <span
                    className={`font-bold px-2.5 py-1 rounded text-[11px] ${
                      order.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.paymentStatus === 'REFUNDED'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {order.paymentStatus === 'PAID'
                      ? 'PAID (Razorpay)'
                      : order.paymentStatus === 'REFUNDED'
                      ? 'REFUNDED'
                      : 'COD PENDING'}
                  </span>

                  {/* Print Invoice Button */}
                  <button
                    onClick={() => setSelectedInvoiceOrder(order)}
                    className="p-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-xs"
                    title="View Tax Invoice"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#2874f0]" />
                    <span className="hidden sm:inline">Invoice</span>
                  </button>
                </div>
              </div>

              {/* Tracking Progress Bar */}
              {!isCancelled ? (
                <div className="px-6 py-4 border-b border-gray-100 bg-blue-50/20">
                  <div className="flex items-center justify-between max-w-xl mx-auto relative text-xs">
                    {/* Connecting Line */}
                    <div className="absolute top-3.5 left-6 right-6 h-1 bg-gray-200 -z-0">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width:
                            order.orderStatus === 'CONFIRMED'
                              ? '25%'
                              : order.orderStatus === 'PACKED'
                              ? '50%'
                              : order.orderStatus === 'SHIPPED'
                              ? '75%'
                              : '100%',
                        }}
                      ></div>
                    </div>

                    <div className="flex flex-col items-center relative z-10">
                      <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-800 mt-1">Confirmed</span>
                    </div>

                    <div className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                          ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-800 mt-1">Packed</span>
                    </div>

                    <div className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                          ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-800 mt-1">Shipped</span>
                    </div>

                    <div className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                          order.orderStatus === 'DELIVERED'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 text-white animate-pulse'
                        }`}
                      >
                        {order.orderStatus === 'DELIVERED' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-[#2874f0] mt-1">
                        {order.orderStatus === 'DELIVERED' ? 'Delivered' : order.estimatedDelivery}
                      </span>
                    </div>
                  </div>

                  {order.trackingNumber && (
                    <div className="mt-3 text-center text-[11px] text-gray-500 font-mono">
                      Tracking No: <span className="font-bold text-gray-800">{order.trackingNumber}</span> (
                      {order.courierPartner || 'Vyuma Express'})
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-6 py-3 bg-rose-50 border-b border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  <span>This order has been cancelled and any paid amount is queued for gateway refund.</span>
                </div>
              )}

              {/* Items in Order */}
              <div className="divide-y divide-gray-100 px-6">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-4 flex items-center gap-4">
                    <div
                      onClick={() => onSelectProduct(item.product)}
                      className="w-16 h-16 shrink-0 p-1 border border-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-300"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4
                        onClick={() => onSelectProduct(item.product)}
                        className="text-xs sm:text-sm font-semibold text-gray-900 hover:text-[#2874f0] cursor-pointer truncate"
                      >
                        {item.product.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Qty: {item.quantity} • ₹{item.product.price.toLocaleString('en-IN')} each
                        {item.selectedVariant && (
                          <span className="ml-2 font-medium text-blue-700">({item.selectedVariant.name})</span>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer & Actions */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    Delivering to: <strong>{order.shippingAddress.fullName}</strong> ({order.shippingAddress.city},{' '}
                    {order.shippingAddress.pincode})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {canCancel && (
                    <button
                      onClick={() => handleCancelOrder(order)}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold px-3 py-1.5 rounded border border-rose-200 transition cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  )}

                  {isDelivered && (
                    <button
                      onClick={() => setReturnOrderId(order.id)}
                      className="text-xs text-[#2874f0] hover:bg-blue-50 font-bold px-3 py-1.5 rounded border border-blue-200 transition cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Return / Replace</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedInvoiceOrder(order)}
                    className="text-xs bg-[#2874f0] hover:bg-blue-600 text-white font-bold px-3.5 py-1.5 rounded transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Download Invoice</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Return Request Modal */}
      {returnOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-gray-900 mb-1">Request Return / Replacement</h3>
            <p className="text-xs text-gray-500 mb-4">
              Order #{returnOrderId} is eligible for a 7-day hassle-free reverse pickup.
            </p>

            <div className="space-y-3 mb-5">
              <label className="block text-xs font-semibold text-gray-700">Reason for Return</label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900"
              >
                <option value="Defective or Damaged Product">Defective or Damaged Product</option>
                <option value="Different Item Delivered">Different Item Delivered</option>
                <option value="Size or Fit Issue">Size or Fit Issue</option>
                <option value="Quality not as expected">Quality not as expected</option>
                <option value="No longer needed">No longer needed</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmReturn}
                className="flex-1 bg-[#2874f0] hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer"
              >
                Submit Return Request
              </button>
              <button
                onClick={() => setReturnOrderId(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Tax Invoice Modal */}
      <InvoiceModal
        order={selectedInvoiceOrder}
        isOpen={Boolean(selectedInvoiceOrder)}
        onClose={() => setSelectedInvoiceOrder(null)}
      />
    </div>
  );
};
