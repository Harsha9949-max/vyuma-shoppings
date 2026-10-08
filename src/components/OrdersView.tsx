import React from 'react';
import { Package, Truck, CheckCircle2, Clock, MapPin, ShoppingBag } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';

interface OrdersViewProps {
  onExploreProducts: () => void;
  onSelectProduct: (product: Product) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  onExploreProducts,
  onSelectProduct,
}) => {
  const { orders } = useShop();

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
          <p className="text-xs text-gray-500">Live order tracking synced with Firestore</p>
        </div>
        <span className="text-xs bg-blue-100 text-[#2874f0] font-bold px-3 py-1 rounded-full">
          {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
        </span>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden"
          >
            {/* Order Header Bar */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-4">
                <div>
                  <span className="block text-gray-400 text-[10px] uppercase font-bold">
                    Order ID
                  </span>
                  <span className="font-bold text-gray-900">#{order.id}</span>
                </div>
                <div>
                  <span className="block text-gray-400 text-[10px] uppercase font-bold">
                    Placed On
                  </span>
                  <span className="font-medium text-gray-700">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <span className="block text-gray-400 text-[10px] uppercase font-bold text-right">
                    Total Amount
                  </span>
                  <span className="font-bold text-gray-900">
                    ₹{order.finalPayable.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded text-[11px]">
                  {order.paymentStatus === 'PAID' ? 'PAID' : 'COD PENDING'}
                </span>
              </div>
            </div>

            {/* Tracking Progress Bar */}
            <div className="px-6 py-4 border-b border-gray-100 bg-blue-50/20">
              <div className="flex items-center justify-between max-w-xl mx-auto relative text-xs">
                {/* Connecting Line */}
                <div className="absolute top-3.5 left-6 right-6 h-1 bg-green-500 -z-0"></div>

                <div className="flex flex-col items-center relative z-10">
                  <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 mt-1">Confirmed</span>
                </div>

                <div className="flex flex-col items-center relative z-10">
                  <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 mt-1">Packed</span>
                </div>

                <div className="flex flex-col items-center relative z-10">
                  <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 mt-1">Shipped</span>
                </div>

                <div className="flex flex-col items-center relative z-10">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-[#2874f0] mt-1">Expected in 2 Days</span>
                </div>
              </div>
            </div>

            {/* Items in Order */}
            <div className="divide-y divide-gray-100 px-6">
              {order.items.map((item) => (
                <div key={item.productId} className="py-4 flex items-center gap-4">
                  <div
                    onClick={() => onSelectProduct(item.product)}
                    className="w-16 h-16 shrink-0 p-1 border border-gray-100 rounded flex items-center justify-center cursor-pointer hover:border-blue-300"
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

            {/* Address Footer */}
            <div className="bg-gray-50/70 px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>
                  Delivering to: <strong>{order.shippingAddress.fullName}</strong> ({order.shippingAddress.city},{' '}
                  {order.shippingAddress.pincode})
                </span>
              </div>
              <span className="text-gray-500">Payment: {order.paymentMethod}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
