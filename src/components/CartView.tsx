import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  ArrowRight,
  ShoppingBag,
  Tag,
  CheckCircle2,
  X,
  Sparkles,
  Truck,
} from 'lucide-react';
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
    cartCouponDiscount,
    cartDeliveryFee,
    cartPackagingFee,
    cartFinalPayable,
    cartTotalSavings,
    coupons,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    storeSettings,
  } = useShop();

  const { user, setAuthModalOpen } = useAuth();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showCouponsModal, setShowCouponsModal] = useState(false);

  const handleApply = (codeToApply?: string) => {
    const code = codeToApply || couponInput;
    if (!code.trim()) return;
    setCouponError(null);
    const res = applyCoupon(code);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponInput('');
      setShowCouponsModal(false);
    }
  };

  const threshold = storeSettings.freeShippingThreshold || 500;
  const currentActual = cartTotalMRP - cartTotalDiscount;
  const needMoreForFreeShipping = Math.max(0, threshold - currentActual);

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-12 flex flex-col items-center">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-[#2874f0]">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your Cart is Empty!</h2>
          <p className="text-sm text-gray-500 max-w-md mb-6">
            Explore our verified collection of smartphones, electronics, fashion, and essentials to add items to your cart.
          </p>
          <button
            onClick={onExploreProducts}
            className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-sm px-8 py-3 rounded-md shadow-md transition cursor-pointer"
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
          
          {/* Free Delivery Goal Banner */}
          {needMoreForFreeShipping > 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>
                  Add <strong>₹{needMoreForFreeShipping.toLocaleString('en-IN')}</strong> more to unlock <strong>FREE Delivery</strong>!
                </span>
              </div>
              <button
                onClick={onExploreProducts}
                className="text-xs font-bold text-[#2874f0] hover:underline cursor-pointer"
              >
                + Add More
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Congratulations! Your order qualifies for <strong>FREE Express Delivery</strong> across India.</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex items-center justify-between">
            <h1 className="text-base font-bold text-gray-900">
              Shopping Cart ({cartItemCount} {cartItemCount === 1 ? 'item' : 'items'})
            </h1>
            <span className="text-xs text-gray-500">
              Direct dispatch from Vyuma verified warehouse
            </span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-xs overflow-hidden">
            {cart.map((item, idx) => (
              <div key={idx} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
                {/* Product Image */}
                <div
                  onClick={() => onSelectProduct(item.product)}
                  className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center p-2 border border-gray-100 rounded-lg cursor-pointer group bg-white"
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

                    {/* Variant badge if applicable */}
                    {item.selectedVariant && (
                      <div className="mt-1">
                        <span className="inline-block text-[11px] bg-blue-50 text-[#2874f0] font-bold px-2 py-0.5 rounded border border-blue-100">
                          Variant: {item.selectedVariant.name}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">Seller: {item.product.seller}</span>
                      {item.product.isAssured && (
                        <span className="text-[10px] font-black italic text-[#2874f0] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          VYUMA ★ Assured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-base font-bold text-gray-900">
                      ₹{((item.selectedVariant ? item.selectedVariant.price : item.product.price) * item.quantity).toLocaleString('en-IN')}
                    </span>
                    {(item.selectedVariant ? item.selectedVariant.originalPrice : item.product.originalPrice) >
                      (item.selectedVariant ? item.selectedVariant.price : item.product.price) && (
                      <>
                        <span className="text-xs text-gray-400 line-through">
                          ₹{((item.selectedVariant ? item.selectedVariant.originalPrice : item.product.originalPrice) * item.quantity).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-bold text-green-700">
                          {item.product.discountPercent}% off
                        </span>
                      </>
                    )}
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center gap-6 mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                        className="p-1.5 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                        title="Decrease Quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3.5 py-1 text-xs font-bold text-gray-900 min-w-8 text-center">
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
                  <p className="text-green-700 font-semibold text-[11px] mt-0.5">Free Express Shipping</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Price Breakdown Sidebar (4 cols) */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          
          {/* Coupon Redemption Box */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#2874f0]" />
                <span>Apply Promo Coupon</span>
              </h2>
              <button
                onClick={() => setShowCouponsModal(true)}
                className="text-[11px] font-bold text-[#2874f0] hover:underline cursor-pointer"
              >
                View Available ({coupons.filter(c => c.isActive).length})
              </button>
            </div>

            {appliedCoupon ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-black text-emerald-800 text-xs flex items-center gap-1">
                    ✓ {appliedCoupon.code} Applied
                  </span>
                  <p className="text-[10px] text-emerald-700">
                    You saved ₹{cartCouponDiscount.toLocaleString('en-IN')} with this coupon!
                  </p>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                  title="Remove Coupon"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="e.g. VYUMA100"
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono uppercase font-bold focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0]"
                  />
                  <button
                    onClick={() => handleApply()}
                    className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer shadow-xs"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
                )}
              </div>
            )}
          </div>

          {/* Price Details Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-3 border-b border-gray-100">
              Price Details
            </h2>

            <div className="space-y-3 py-4 text-xs text-gray-700 border-b border-gray-100">
              <div className="flex justify-between">
                <span>Price ({cartItemCount} items)</span>
                <span>₹{cartTotalMRP.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-green-700 font-medium">
                <span>Catalog Discount</span>
                <span>- ₹{cartTotalDiscount.toLocaleString('en-IN')}</span>
              </div>

              {cartCouponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>- ₹{cartCouponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

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
              <span className="text-xl font-black text-[#2874f0]">
                ₹{cartFinalPayable.toLocaleString('en-IN')}
              </span>
            </div>

            {cartTotalSavings > 0 && (
              <div className="py-3 text-xs font-bold text-green-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>You will save ₹{cartTotalSavings.toLocaleString('en-IN')} on this order!</span>
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
              className="w-full mt-2 bg-[#fb641b] hover:bg-[#e85b16] text-white py-3.5 rounded-lg font-bold text-sm tracking-wide shadow-md transition flex items-center justify-center gap-2 cursor-pointer uppercase"
            >
              <span>{user ? 'Proceed to Checkout' : 'Login to Place Order'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600">
            <ShieldCheck className="w-5 h-5 text-gray-500 shrink-0" />
            <span>Safe and Secure Payments. 7-Day Replacement Guarantee on Vyuma.</span>
          </div>
        </div>

      </div>

      {/* Available Coupons Modal */}
      {showCouponsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#2874f0]" />
                <span>Available Promotional Coupons</span>
              </h3>
              <button
                onClick={() => setShowCouponsModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {coupons.filter(c => c.isActive).map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-lg border border-gray-200 hover:border-blue-300 bg-gray-50/50 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="font-mono font-black text-xs text-[#2874f0] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {c.code}
                    </span>
                    <p className="text-xs font-semibold text-gray-800 mt-1">{c.description}</p>
                    <p className="text-[10px] text-gray-500">
                      Min order: ₹{c.minOrderValue.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <button
                    onClick={() => handleApply(c.code)}
                    className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-md transition cursor-pointer shadow-xs shrink-0"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
