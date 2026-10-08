import React from 'react';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';

interface WishlistViewProps {
  onExploreProducts: () => void;
  onSelectProduct: (product: Product) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  onExploreProducts,
  onSelectProduct,
}) => {
  const { products, wishlist, toggleWishlist, addToCart } = useShop();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  if (wishlistedProducts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-12 flex flex-col items-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
            <Heart className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your Wishlist is Empty</h2>
          <p className="text-sm text-gray-500 max-w-md mb-6">
            Tap the heart icon on any product to save it here for later.
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
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">My Wishlist</h1>
          <p className="text-xs text-gray-500">Items you've bookmarked for later</p>
        </div>
        <span className="text-xs bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full">
          {wishlistedProducts.length} Items
        </span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 shadow-xs overflow-hidden">
        {wishlistedProducts.map((prod) => (
          <div
            key={prod.id}
            className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 justify-between"
          >
            <div className="flex items-center gap-4 flex-1">
              <div
                onClick={() => onSelectProduct(prod)}
                className="w-20 h-20 shrink-0 p-1 border border-gray-100 rounded flex items-center justify-center cursor-pointer hover:border-blue-300"
              >
                <img
                  src={prod.image}
                  alt={prod.title}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {prod.brand}
                </span>
                <h3
                  onClick={() => onSelectProduct(prod)}
                  className="text-sm font-semibold text-gray-900 hover:text-[#2874f0] cursor-pointer line-clamp-1"
                >
                  {prod.title}
                </h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-bold text-gray-900">
                    ₹{prod.price.toLocaleString('en-IN')}
                  </span>
                  {prod.originalPrice > prod.price && (
                    <span className="text-xs text-gray-400 line-through">
                      ₹{prod.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className="text-xs font-bold text-green-700">
                    {prod.discountPercent}% off
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  addToCart(prod, 1);
                  toggleWishlist(prod);
                }}
                className="bg-[#2874f0] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-1.5 transition cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Move to Cart</span>
              </button>

              <button
                onClick={() => toggleWishlist(prod)}
                className="p-2 text-gray-400 hover:text-red-500 rounded transition cursor-pointer"
                title="Remove from Wishlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
