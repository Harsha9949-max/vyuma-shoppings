import React, { useState, useMemo } from 'react';
import { Filter, X, RotateCcw, Check } from 'lucide-react';
import { CategorySlug, Product } from '../types';
import { ProductCard } from './ProductCard';
import { useShop } from '../context/ShopContext';
import { CATEGORIES } from '../data/initialProducts';

interface CatalogViewProps {
  onSelectProduct: (product: Product) => void;
}

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

export const CatalogView: React.FC<CatalogViewProps> = ({ onSelectProduct }) => {
  const {
    products,
    currentSearch,
    setCurrentSearch,
    selectedCategory,
    setSelectedCategory,
  } = useShop();

  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [minRating, setMinRating] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<string>('all');
  const [onlyAssured, setOnlyAssured] = useState<boolean>(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Available brands in the current product set
  const allBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.brand));
    return Array.from(set).sort();
  }, [products]);

  // Filtering and Sorting
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Category filter
      if (selectedCategory !== 'all' && prod.category !== selectedCategory) {
        return false;
      }

      // Search term
      if (currentSearch.trim()) {
        const query = currentSearch.toLowerCase();
        const matchesTitle = prod.title.toLowerCase().includes(query);
        const matchesBrand = prod.brand.toLowerCase().includes(query);
        const matchesCat = prod.category.toLowerCase().includes(query);
        const matchesSubcat = prod.subcategory.toLowerCase().includes(query);
        if (!matchesTitle && !matchesBrand && !matchesCat && !matchesSubcat) {
          return false;
        }
      }

      // Rating
      if (minRating > 0 && prod.rating < minRating) {
        return false;
      }

      // Assured
      if (onlyAssured && !prod.isAssured) {
        return false;
      }

      // Brand
      if (selectedBrand !== 'all' && prod.brand !== selectedBrand) {
        return false;
      }

      // Price Range
      if (priceRange === 'under-1k' && prod.price > 1000) return false;
      if (priceRange === '1k-5k' && (prod.price <= 1000 || prod.price > 5000)) return false;
      if (priceRange === '5k-25k' && (prod.price <= 5000 || prod.price > 25000)) return false;
      if (priceRange === '25k-75k' && (prod.price <= 25000 || prod.price > 75000)) return false;
      if (priceRange === 'above-75k' && prod.price <= 75000) return false;

      return true;
    });
  }, [products, selectedCategory, currentSearch, minRating, onlyAssured, selectedBrand, priceRange]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
    }
    return list;
  }, [filteredProducts, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setCurrentSearch('');
    setMinRating(0);
    setPriceRange('all');
    setOnlyAssured(false);
    setSelectedBrand('all');
    setSortBy('relevance');
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    currentSearch !== '' ||
    minRating > 0 ||
    priceRange !== 'all' ||
    onlyAssured ||
    selectedBrand !== 'all';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">
            {selectedCategory !== 'all'
              ? CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'Products'
              : currentSearch
              ? `Search Results for "${currentSearch}"`
              : 'All Products'}
          </h1>
          <p className="text-xs text-gray-500">
            Showing {sortedProducts.length} of {products.length} products
          </p>
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          className="md:hidden flex items-center gap-1.5 bg-white border border-gray-300 px-3 py-1.5 rounded text-xs font-semibold"
        >
          <Filter className="w-4 h-4 text-[#2874f0]" />
          <span>Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Sidebar Filters */}
        <aside
          className={`${
            mobileFilterOpen ? 'block' : 'hidden'
          } md:block bg-white rounded-lg border border-gray-200 p-5 shadow-xs space-y-6 sticky top-20`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Filters
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-[#2874f0] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">
              Categories
            </h4>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left py-1 px-2 rounded cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-blue-50 font-bold text-[#2874f0]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                All Categories
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left py-1 px-2 rounded cursor-pointer capitalize ${
                    selectedCategory === cat.id
                      ? 'bg-blue-50 font-bold text-[#2874f0]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">
              Price Range
            </h4>
            <div className="space-y-1.5 text-xs text-gray-600">
              {[
                { id: 'all', label: 'All Prices' },
                { id: 'under-1k', label: 'Under ₹1,000' },
                { id: '1k-5k', label: '₹1,000 - ₹5,000' },
                { id: '5k-25k', label: '₹5,000 - ₹25,000' },
                { id: '25k-75k', label: '₹25,000 - ₹75,000' },
                { id: 'above-75k', label: 'Above ₹75,000' },
              ].map((range) => (
                <label key={range.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={priceRange === range.id}
                    onChange={() => setPriceRange(range.id)}
                    className="text-[#2874f0] focus:ring-[#2874f0]"
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Customer Rating */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">
              Customer Ratings
            </h4>
            <div className="space-y-1.5 text-xs text-gray-600">
              {[
                { rating: 4, label: '4★ & above' },
                { rating: 3, label: '3★ & above' },
                { rating: 0, label: 'All Ratings' },
              ].map((r) => (
                <label key={r.rating} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ratingFilter"
                    checked={minRating === r.rating}
                    onChange={() => setMinRating(r.rating)}
                    className="text-[#2874f0] focus:ring-[#2874f0]"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">
              Brand
            </h4>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-[#2874f0]"
            >
              <option value="all">All Brands</option>
              {allBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Vyuma Assured Toggle */}
          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyAssured}
                onChange={(e) => setOnlyAssured(e.target.checked)}
                className="w-4 h-4 text-[#2874f0] rounded focus:ring-[#2874f0]"
              />
              <span className="text-[#2874f0] font-black italic">VYUMA ★</span>
              <span>Assured Only</span>
            </label>
          </div>
        </aside>

        {/* Main Products Grid */}
        <div className="md:col-span-3 space-y-4">
          {/* Sorting Bar */}
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-gray-600">Sort By:</span>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'relevance', label: 'Relevance' },
                { id: 'price-asc', label: 'Price -- Low to High' },
                { id: 'price-desc', label: 'Price -- High to Low' },
                { id: 'rating', label: 'Highest Rated' },
                { id: 'newest', label: 'Newest First' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id as SortOption)}
                  className={`px-3 py-1.5 rounded transition font-medium cursor-pointer ${
                    sortBy === opt.id
                      ? 'bg-[#2874f0] text-white font-bold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards */}
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onSelect={onSelectProduct}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-base font-bold text-gray-800 mb-1">
                No products found matching your filters.
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Try loosening your filters or searching with different keywords.
              </p>
              <button
                onClick={resetFilters}
                className="bg-[#2874f0] text-white text-xs font-bold px-4 py-2 rounded shadow-xs"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
