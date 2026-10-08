import React from 'react';
import { Heart, Star, ShoppingCart, Zap } from 'lucide-react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart, toggleWishlist, isWishlisted } = useShop();
  const wishlisted = isWishlisted(product.id);

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-200 flex flex-col p-4 relative cursor-pointer"
    >
      {/* Top Badges */}
      <div className="flex items-center justify-between w-full mb-2">
        {product.discountPercent >= 20 ? (
          <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">
            {product.discountPercent}% OFF
          </span>
        ) : <span />}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`p-1.5 rounded-full transition-transform active:scale-75 ${
            wishlisted
              ? 'text-red-500 bg-red-50'
              : 'text-gray-300 hover:text-red-500 hover:bg-gray-50'
          }`}
          title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500' : ''}`} />
        </button>
      </div>

      {/* Image Container */}
      <div className="w-full h-44 flex items-center justify-center p-2 mb-3 overflow-hidden">
        <img
          src={product.image}
          alt={product.title}
          className="max-h-full max-w-full object-contain group-hover:scale-108 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Brand & Title */}
      <div className="flex-1 flex flex-col">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
          {product.brand}
        </span>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-[#2874f0] transition-colors mb-2">
          {product.title}
        </h3>

        {/* Ratings & Vyuma Assured */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 bg-[#388e3c] text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
            <span>{product.rating}</span>
            <Star className="w-2.5 h-2.5 fill-white" />
          </div>
          <span className="text-[11px] text-gray-500">
            ({product.ratingCount >= 1000 ? `${(product.ratingCount / 1000).toFixed(1)}k` : product.ratingCount})
          </span>

          {product.isAssured && (
            <span className="text-[10px] font-extrabold italic text-[#2874f0] ml-auto flex items-center gap-0.5">
              VYUMA <span className="text-[#ffe500] font-black">★</span>
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="mt-auto pt-2 border-t border-gray-50 flex items-baseline gap-2">
          <span className="text-base sm:text-lg font-bold text-gray-900">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
          <span className="text-green-700 font-medium">Free Delivery</span>
          <span className="text-gray-400 text-[10px]">{product.fastDelivery.split(' ')[0]}</span>
        </div>
      </div>

      {/* Quick Add To Cart on Hover */}
      <div className="mt-3 pt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product, 1);
          }}
          className="w-full bg-[#f1f3f6] hover:bg-[#2874f0] text-gray-700 hover:text-white text-xs font-semibold py-2 rounded transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
};
