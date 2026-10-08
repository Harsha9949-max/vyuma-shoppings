import React from 'react';
import {
  Sparkles,
  Truck,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  PackageX,
  PlusCircle,
  ShoppingBag,
} from 'lucide-react';
import { CategorySlug, Product } from '../types';
import { BannerCarousel } from './BannerCarousel';
import { DealsOfTheDay } from './DealsOfTheDay';
import { ProductCard } from './ProductCard';
import { CATEGORIES } from '../data/initialProducts';
import { useAuth, MASTER_ADMIN_EMAIL } from '../context/AuthContext';

interface HomeViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onSelectCategory: (category: CategorySlug) => void;
  onViewAllCatalog: () => void;
  onOpenAiAssistant: () => void;
  onOpenAdminPanel?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  onSelectProduct,
  onSelectCategory,
  onViewAllCatalog,
  onOpenAiAssistant,
  onOpenAdminPanel,
}) => {
  const { user, isAdmin } = useAuth();

  // Find products grouped by available categories that actually have inventory
  const categoriesWithProducts = CATEGORIES.filter((cat) =>
    products.some((p) => p.category === cat.id)
  );

  const hasDeals = products.some((p) => p.isDealOfTheDay || p.discountPercent > 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner Carousel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <BannerCarousel onSelectCategory={onSelectCategory} />
      </div>

      {/* Trust Badges Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-2xs border border-gray-100 py-3.5 px-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-700">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-[#2874f0] shrink-0" />
            <div>
              <p className="font-bold text-gray-900">Free Express Delivery</p>
              <p className="text-[11px] text-gray-500">Fast doorstep shipping</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RotateCcw className="w-6 h-6 text-[#2874f0] shrink-0" />
            <div>
              <p className="font-bold text-gray-900">7 Days Easy Return</p>
              <p className="text-[11px] text-gray-500">Doorstep pickup & refund</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#2874f0] shrink-0" />
            <div>
              <p className="font-bold text-gray-900">100% Genuine</p>
              <p className="text-[11px] text-gray-500">Verified authentic inventory</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-[#2874f0] shrink-0" />
            <div>
              <p className="font-bold text-gray-900">Razorpay Payments</p>
              <p className="text-[11px] text-gray-500">UPI, Cards, NetBanking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deals of the Day (Only if genuine deals exist in catalog) */}
      {hasDeals && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DealsOfTheDay
            products={products}
            onSelectProduct={onSelectProduct}
            onViewAll={onViewAllCatalog}
          />
        </div>
      )}

      {/* When NO products are yet in the database: Clean Authentic State */}
      {products.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center shadow-xs">
            <div className="w-16 h-16 bg-blue-50 text-[#2874f0] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Store Catalog
            </h3>
            <p className="text-sm text-gray-600 max-w-lg mx-auto mb-6">
              All inventory in Vyuma is verified and stored in Firebase Firestore. No products have been published yet.
            </p>

            {isAdmin && onOpenAdminPanel ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto mb-6 text-left">
                <p className="text-xs font-bold text-amber-900 mb-1">
                  Master Admin Access Active ({MASTER_ADMIN_EMAIL})
                </p>
                <p className="text-[11px] text-amber-800 mb-3">
                  You are authorized to add genuine products, manage stock, and monitor orders in real-time.
                </p>
                <button
                  onClick={onOpenAdminPanel}
                  className="w-full bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-xs py-2.5 px-4 rounded transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add First Product to Catalog</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">
                  New inventory is added regularly by authorized administrators.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => onSelectCategory(cat.id)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-full transition cursor-pointer"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Render Category Sections ONLY for categories that have real products */
        categoriesWithProducts.map((cat) => {
          const categoryProducts = products.filter((p) => p.category === cat.id).slice(0, 4);
          if (categoryProducts.length === 0) return null;

          return (
            <div key={cat.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-lg shadow-xs border border-gray-100 p-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                      {cat.name}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {cat.bannerTitle}
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectCategory(cat.id)}
                    className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-xs uppercase px-4 py-2 rounded-sm shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {categoryProducts.map((p) => (
                    <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
                  ))}
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Informative Assurance Mid-Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 text-center md:text-left">
            <span className="bg-[#ffe500] text-blue-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded tracking-wider uppercase">
              VYUMA STORE
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Verified Shopping with Razorpay Protection
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              100% genuine products, live order tracking, and encrypted checkout via Razorpay payments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAiAssistant}
              className="bg-[#ffe500] hover:bg-yellow-400 text-blue-900 font-bold text-xs sm:text-sm px-5 py-2.5 rounded shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-blue-900" />
              <span>Ask Vyuma AI</span>
            </button>
            <button
              onClick={onViewAllCatalog}
              className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded transition cursor-pointer"
            >
              View Catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
