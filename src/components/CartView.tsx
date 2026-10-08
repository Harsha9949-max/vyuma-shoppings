import React from 'react';
import { Trash2, Plus, Minus, ShieldCheck, ArrowRight, ShoppingBag } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';

interface CartViewProps {
  onProceedToCheckout: () => void;
  onExploreProducts: () => void;
  onSelectProduct: (product: Product) => void;
}

export const CartView: React.FC<CartViewProps> = ({
  onProceedToCheckout,
  onExploreProducts,
  onSelectProduct,
}) => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    cartItemCount,
    cartTotalMRP,
    cartTotalDiscount,
    cartDeliveryFee,
    cartPackagingFee,
    cartFinalPayable,
    cartTotalSavings,
  } = useShop();

  const { user, setAuthModalOpen } = useAuth();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-12 flex flex-col items-center">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-[#2874f0]">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your Cart is Empty!</h2>
          <p className="text-sm text-gray-500 max-w-md mb-6">
            Explore our curated collection of electronics, fashion, and home essentials to add items to your cart.
          </p>
          <button
            onClick={onExploreProducts}
            className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-sm px-8 py-3 rounded-sm shadow-md transition cursor-pointer"
          >
            Shop Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs flex items-center justify-between">
            <h1 className="text-base font-bold text-gray-900">
              Shopping Cart ({cartItemCount} {cartItemCount === 1 ? 'item' : 'items'})
            </h1>
            <span className="text-xs text-gray-500">
              All items are eligible for fast delivery
            </span>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 shadow-xs overflow-hidden">
            {cart.map((item) => (
              <div key={item.productId} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
                {/* Product Image */}
                <div
                  onClick={() => onSelectProduct(item.product)}
                  className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center p-2 border border-gray-100 rounded-md cursor-pointer group"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.title}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {item.product.brand}
                    </span>
                    <h3
                      onClick={() => onSelectProduct(item.product)}
                      className="text-sm font-semibold text-gray-900 hover:text-[#2874f0] cursor-pointer line-clamp-2 leading-snug"
                    >
                      {item.product.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">Seller: {item.product.seller}</span>
                      {item.product.isAssured && (
                        <span className="text-[10px] font-black italic text-[#2874f0]">
                          VYUMA ★
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-base font-bold text-gray-900">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                    {item.product.originalPrice > item.product.price && (
                      <>
                        <span className="text-xs text-gray-400 line-through">
                          ₹{(item.product.originalPrice * item.quantity).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-bold text-green-700">
                          {item.product.discountPercent}% off
                        </span>
                      </>
                    )}
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex items-center gap-6 mt-4 pt-2 border-t border-gray-50">
                    <div className="flex items-center border border-gray-300 rounded">
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                        className="p-1.5 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                        title="Decrease Quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                        className="p-1.5 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                        title="Increase Quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-xs font-semibold text-gray-600 hover:text-red-600 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                {/* Delivery Notice */}
                <div className="text-right sm:w-40 shrink-0 text-xs">
                  <p className="text-gray-700 font-medium">Delivery by {item.product.fastDelivery.split(' ')[0]}</p>
                  <p className="text-green-700 font-semibold text-[11px] mt-0.5">Free Delivery</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Price Breakdown Sidebar (4 cols) */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-3 border-b border-gray-100">
              Price Details
            </h2>

            <div className="space-y-3 py-4 text-xs text-gray-700 border-b border-gray-100">
              <div className="flex justify-between">
                <span>Price ({cartItemCount} items)</span>
                <span>₹{cartTotalMRP.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-green-700 font-medium">
                <span>Discount</span>
                <span>- ₹{cartTotalDiscount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="text-green-700 font-medium">
                  {cartDeliveryFee === 0 ? 'FREE' : `₹${cartDeliveryFee}`}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Secured Packaging Fee</span>
                <span>₹{cartPackagingFee}</span>
              </div>
            </div>

            {/* Total Payable */}
            <div className="flex justify-between items-baseline py-4 border-b border-gray-100 text-sm font-bold text-gray-900">
              <span>Total Amount</span>
              <span className="text-lg font-black text-gray-900">
                ₹{cartFinalPayable.toLocaleString('en-IN')}
              </span>
            </div>

            {cartTotalSavings > 0 && (
              <div className="py-3 text-xs font-bold text-green-700">
                You will save ₹{cartTotalSavings.toLocaleString('en-IN')} on this order!
              </div>
            )}

            <button
              onClick={() => {
                if (!user) {
                  setAuthModalOpen(true);
                } else {
                  onProceedToCheckout();
                }
              }}
              className="w-full mt-2 bg-[#fb641b] hover:bg-[#e85b16] text-white py-3.5 rounded font-bold text-sm tracking-wide shadow-md transition flex items-center justify-center gap-2 cursor-pointer uppercase"
            >
              <span>{user ? 'Place Order' : 'Login to Place Order'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
            <ShieldCheck className="w-5 h-5 text-gray-500 shrink-0" />
            <span>Safe and Secure Payments. Easy returns. 100% Authentic products on Vyuma.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
