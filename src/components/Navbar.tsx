import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  ChevronDown,
  Sparkles,
  MapPin,
  Heart,
  Package,
  LogOut,
  X,
  Crown,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { CATEGORIES } from '../data/initialProducts';
import { CategorySlug } from '../types';

interface NavbarProps {
  onOpenAiAssistant: () => void;
  onOpenAdminPanel: () => void;
  activeTab: 'home' | 'catalog' | 'cart' | 'orders' | 'wishlist';
  setActiveTab: (tab: 'home' | 'catalog' | 'cart' | 'orders' | 'wishlist') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAiAssistant,
  onOpenAdminPanel,
  activeTab,
  setActiveTab,
}) => {
  const { user, isAdmin, setAuthModalOpen, logout, selectedAddress } = useAuth();
  const {
    cartItemCount,
    currentSearch,
    setCurrentSearch,
    selectedCategory,
    setSelectedCategory,
    products,
    storeSettings,
  } = useShop();

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [pincode, setPincode] = useState('');
  const [editingPincode, setEditingPincode] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');

  useEffect(() => {
    if (selectedAddress?.pincode) {
      setPincode(selectedAddress.pincode);
    }
  }, [selectedAddress?.pincode]);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentSearch(searchInput);
    setShowSuggestions(false);
    setActiveTab('catalog');
  };

  const handleSelectSuggestion = (title: string) => {
    setSearchInput(title);
    setCurrentSearch(title);
    setShowSuggestions(false);
    setActiveTab('catalog');
  };

  const handleCategoryClick = (catId: CategorySlug) => {
    if (selectedCategory === catId && activeTab === 'catalog') {
      setSelectedCategory('all');
    } else {
      setSelectedCategory(catId);
      setActiveTab('catalog');
    }
  };

  const searchSuggestions = products
    .filter(
      (p) =>
        p.title.toLowerCase().includes(searchInput.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchInput.toLowerCase()) ||
        p.category.toLowerCase().includes(searchInput.toLowerCase())
    )
    .slice(0, 5);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs">
      {/* Store Announcement Ticker if active in Firestore */}
      {storeSettings.showAnnouncement && storeSettings.announcementText && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-[11px] font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-inner">
          <Megaphone className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{storeSettings.announcementText}</span>
        </div>
      )}

      {/* Top Primary Bar */}
      <div className="bg-[#2874f0] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6 shrink-0">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setCurrentSearch('');
                setSearchInput('');
                setActiveTab('home');
              }}
              className="flex flex-col text-left group cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black italic tracking-wider text-white">
                  VYUMA
                </span>
                <span className="text-[10px] font-extrabold bg-[#ffe500] text-blue-900 px-1.5 py-0.5 rounded italic">
                  PLUS
                </span>
              </div>
              <span className="text-[10px] italic text-[#f0f0f0] flex items-center gap-1 hover:text-[#ffe500] transition">
                Explore <span className="text-[#ffe500] font-semibold">Plus ★</span>
              </span>
            </button>

            {/* Pincode / Delivery location badge */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs bg-blue-700/60 hover:bg-blue-700 px-3 py-1.5 rounded cursor-pointer transition">
              <MapPin className="w-3.5 h-3.5 text-[#ffe500]" />
              {editingPincode ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincodeInput}
                    onChange={(e) => setPincodeInput(e.target.value)}
                    className="w-16 px-1 py-0.5 text-xs text-black bg-white rounded outline-none"
                    placeholder="Pincode"
                  />
                  <button
                    onClick={() => {
                      if (pincodeInput.length === 6) setPincode(pincodeInput);
                      setEditingPincode(false);
                    }}
                    className="text-[10px] bg-[#ffe500] text-blue-900 font-bold px-1.5 py-0.5 rounded"
                  >
                    Set
                  </button>
                </div>
              ) : (
                <div onClick={() => setEditingPincode(true)} className="flex items-center gap-1">
                  <span className="text-blue-100">Deliver to</span>
                  <span className="font-semibold text-white">{pincode || 'Select PIN'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div ref={searchContainerRef} className="flex-1 max-w-2xl relative">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search for Products, Brands and More"
                className="w-full bg-white text-gray-800 placeholder-gray-500 text-sm pl-4 pr-10 py-2.5 rounded-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setCurrentSearch('');
                  }}
                  className="absolute right-9 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 px-3 text-[#2874f0] hover:text-blue-700 transition cursor-pointer"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>

            {/* Suggestions dropdown */}
            {showSuggestions && searchInput.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white text-gray-800 rounded-sm shadow-xl border border-gray-100 overflow-hidden z-50">
                {searchSuggestions.length > 0 ? (
                  searchSuggestions.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleSelectSuggestion(prod.title)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <img
                        src={prod.image}
                        alt={prod.title}
                        className="w-8 h-8 object-contain rounded bg-white p-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {prod.title}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          in <span className="capitalize">{prod.category}</span> • ₹{prod.price.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400">Search</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-gray-500">
                    No exact products found for "{searchInput}". Press Enter to view all results.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            
            {/* Master Admin Hidden Button (Strictly when logged in via Google Auth as marateyh@gmail.com) */}
            {isAdmin && (
              <button
                onClick={onOpenAdminPanel}
                className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-amber-600 text-white font-extrabold px-3 py-1.5 rounded-sm text-xs shadow-md transition transform hover:scale-105 cursor-pointer animate-pulse"
                title="Master Admin Command Center (marateyh@gmail.com)"
              >
                <Crown className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
                <span className="hidden lg:inline">Master Admin</span>
              </button>
            )}

            {/* AI Assistant Quick Pill */}
            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1.5 bg-[#ffe500] hover:bg-yellow-400 text-blue-900 font-bold px-3 py-1.5 rounded-sm text-xs shadow-xs transition transform hover:scale-105 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-blue-900" />
              <span className="hidden md:inline">Vyuma AI</span>
            </button>

            {/* User Account Dropdown */}
            <div ref={userDropdownRef} className="relative">
              {user ? (
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 font-semibold text-sm hover:text-yellow-200 transition py-1 cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-[#ffe500]" />
                  <span className="max-w-[100px] truncate">
                    {isAdmin ? 'Admin' : (user.displayName?.split(' ')[0] || 'My Account')}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-white text-[#2874f0] hover:bg-gray-100 font-semibold px-6 py-1.5 rounded-sm text-sm shadow-xs transition cursor-pointer"
                >
                  Login
                </button>
              )}

              {/* User Menu Modal / Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white text-gray-800 rounded-sm shadow-2xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {user && (
                    <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {user.displayName || user.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] bg-blue-100 text-[#2874f0] font-semibold px-1.5 py-0.5 rounded capitalize">
                        {isAdmin ? '👑 Super Admin' : (user.role || 'Shopper')}
                      </span>
                    </div>
                  )}

                  {/* Master Admin Panel Trigger inside dropdown */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        onOpenAdminPanel();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold transition text-left cursor-pointer border-b border-amber-200"
                    >
                      <Crown className="w-4 h-4 text-amber-600" />
                      <span>Master Command Center</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveTab('orders');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-blue-50 hover:text-[#2874f0] transition text-left cursor-pointer"
                  >
                    <Package className="w-4 h-4 text-gray-500" />
                    <span>My Orders</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('wishlist');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-blue-50 hover:text-[#2874f0] transition text-left cursor-pointer"
                  >
                    <Heart className="w-4 h-4 text-gray-500" />
                    <span>Wishlist</span>
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-red-50 text-red-600 transition text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setActiveTab('cart')}
              className="flex items-center gap-2 font-semibold text-sm hover:text-yellow-200 transition relative cursor-pointer"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#ff6161] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Cart</span>
            </button>

          </div>
        </div>
      </div>

      {/* Top Category Strip */}
      <div className="bg-white border-b border-gray-200 shadow-2xs overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between min-w-[760px] gap-4">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex flex-col items-center justify-center gap-1 group px-2 py-1 rounded transition cursor-pointer shrink-0 ${
                  isSelected ? 'text-[#2874f0]' : 'text-gray-700 hover:text-[#2874f0]'
                }`}
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <span className={`text-xs font-semibold tracking-tight whitespace-nowrap ${
                  isSelected ? 'text-[#2874f0] underline underline-offset-4 decoration-2' : ''
                }`}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
