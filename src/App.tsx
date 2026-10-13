/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AuthProvider, useAuth, SUPER_ADMIN_EMAILS } from './context/AuthContext';
import { ShopProvider, useShop } from './context/ShopContext';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { CatalogView } from './components/CatalogView';
import { ProductDetailView } from './components/ProductDetailView';
import { CartView } from './components/CartView';
import { OrdersView } from './components/OrdersView';
import { WishlistView } from './components/WishlistView';
import { AuthModal } from './components/AuthModal';
import { CheckoutModal } from './components/CheckoutModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { VyumaAssistantDrawer } from './components/VyumaAssistantDrawer';
import { Footer } from './components/Footer';
import { CategorySlug, Product } from './types';

function MainApp() {
  const { user, isAdmin, isGoogleAuth, adminPanelOpen, setAdminPanelOpen, setAuthModalOpen } = useAuth();
  const {
    products,
    selectedCategory,
    setSelectedCategory,
    currentSearch,
    toastMessage,
    addToCart,
    storeSettings,
  } = useShop();

  const [activeTab, setActiveTab] = useState<'home' | 'catalog' | 'cart' | 'orders' | 'wishlist'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Modals state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiContextProduct, setAiContextProduct] = useState<Product | null>(null);

  // Direct entry check: if admin enters directly (URL /admin, #admin, ?admin=true), trigger admin panel
  useEffect(() => {
    const handleAdminRoute = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (
        hash === '#admin' ||
        hash === '#/admin' ||
        path === '/admin' ||
        path.startsWith('/admin') ||
        search.includes('admin=true') ||
        search.includes('admin=1')
      ) {
        if (isAdmin) {
          setAdminPanelOpen(true);
        } else {
          setAuthModalOpen(true);
        }
      }
    };

    handleAdminRoute();
    window.addEventListener('hashchange', handleAdminRoute);
    window.addEventListener('popstate', handleAdminRoute);
    return () => {
      window.removeEventListener('hashchange', handleAdminRoute);
      window.removeEventListener('popstate', handleAdminRoute);
    };
  }, [isAdmin, setAdminPanelOpen, setAuthModalOpen]);

  // Keyboard shortcut (Ctrl+Shift+A) for Master Admin Command Center
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (isAdmin) {
          setAdminPanelOpen(!adminPanelOpen);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [adminPanelOpen, isAdmin, setAdminPanelOpen]);

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (cat: CategorySlug) => {
    setSelectedCategory(cat);
    setSelectedProduct(null);
    setActiveTab('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBuyNow = (prod: Product) => {
    addToCart(prod, 1);
    setSelectedProduct(null);
    setCheckoutOpen(true);
  };

  const handleOpenAiWithProduct = (prod: Product) => {
    setAiContextProduct(prod);
    setAiAssistantOpen(true);
  };

  const handleOrderSuccess = (orderId: string) => {
    setCheckoutOpen(false);
    setSelectedProduct(null);
    setActiveTab('orders');
  };

  // Maintenance mode screen if active and not authorized admin
  if (storeSettings.maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black mb-2">VYUMA Maintenance in Progress</h1>
        <p className="text-gray-400 text-sm max-w-md mb-6">
          We are upgrading our cloud systems and database for high-speed shopping. We will be back online shortly.
        </p>
      </div>
    );
  }

  // Dedicated Full-Screen Admin Panel View:
  // When an admin is managing the platform, render ONLY the full Admin Command Center.
  // NO Vyuma shopping page, no shopping banner, and no shopping navbar are rendered.
  if (isAdmin && adminPanelOpen) {
    return (
      <div className="min-h-screen w-full bg-[#f1f5f9]">
        <AdminPanelModal
          isOpen={true}
          onClose={() => setAdminPanelOpen(false)}
        />
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 z-50 bg-[#172337] text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl border border-gray-700 flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6] text-[#212121]">
      {/* Master Admin Persistent Header Banner */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-[#172337] via-[#1a3f7a] to-[#2874f0] text-white px-4 py-2 text-xs font-semibold flex flex-wrap items-center justify-between border-b border-blue-400/40 shadow-sm gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
            <span className="text-[#ffe500] font-black uppercase tracking-wider text-[11px]">MASTER ADMIN ACTIVE:</span>
            <span className="font-mono text-blue-100 font-bold bg-blue-900/60 px-2 py-0.5 rounded text-[11px] border border-blue-700/50">{user?.email || 'Super Admin'}</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-400/40 font-semibold">
              Live Verified
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAdminPanelOpen(true)}
              className="bg-[#ffe500] hover:bg-yellow-400 text-blue-950 font-black px-3.5 py-1 rounded text-xs shadow-md transition transform hover:scale-105 cursor-pointer flex items-center gap-1.5"
            >
              <span>👑 Open Full Admin Panel</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenAdminPanel={() => setAdminPanelOpen(true)}
        onOpenAiAssistant={() => {
          setAiContextProduct(null);
          setAiAssistantOpen(true);
        }}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedProduct(null);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {selectedProduct ? (
          <ProductDetailView
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onBuyNow={handleBuyNow}
            onOpenAiAssistantWithContext={handleOpenAiWithProduct}
          />
        ) : activeTab === 'home' && !currentSearch ? (
          <HomeView
            products={products}
            onSelectProduct={handleSelectProduct}
            onSelectCategory={handleSelectCategory}
            onViewAllCatalog={() => {
              setSelectedCategory('all');
              setActiveTab('catalog');
            }}
            onOpenAiAssistant={() => {
              setAiContextProduct(null);
              setAiAssistantOpen(true);
            }}
            onOpenAdminPanel={() => setAdminPanelOpen(true)}
          />
        ) : activeTab === 'catalog' || currentSearch ? (
          <CatalogView onSelectProduct={handleSelectProduct} />
        ) : activeTab === 'cart' ? (
          <CartView
            onProceedToCheckout={() => setCheckoutOpen(true)}
            onExploreProducts={() => {
              setActiveTab('catalog');
            }}
            onSelectProduct={handleSelectProduct}
          />
        ) : activeTab === 'orders' ? (
          <OrdersView
            onExploreProducts={() => setActiveTab('catalog')}
            onSelectProduct={handleSelectProduct}
          />
        ) : activeTab === 'wishlist' ? (
          <WishlistView
            onExploreProducts={() => setActiveTab('catalog')}
            onSelectProduct={handleSelectProduct}
          />
        ) : null}
      </main>

      {/* Floating Vyuma AI Bubble */}
      <button
        onClick={() => {
          setAiContextProduct(selectedProduct);
          setAiAssistantOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-[#2874f0] to-[#1a5fce] hover:from-blue-600 hover:to-blue-700 text-white font-bold p-3 sm:px-5 sm:py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 border-2 border-yellow-300 cursor-pointer"
        title="Ask Vyuma AI"
      >
        <div className="w-5 h-5 rounded-full bg-[#ffe500] text-blue-900 flex items-center justify-center font-bold">
          <Sparkles className="w-3.5 h-3.5 fill-blue-900" />
        </div>
        <span className="text-xs sm:text-sm font-extrabold tracking-wide hidden sm:inline">
          Ask Vyuma AI
        </span>
      </button>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#172337] text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl border border-gray-700 flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals & Drawers */}
      <AuthModal />

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />


      <VyumaAssistantDrawer
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        contextProduct={aiContextProduct}
        onSelectProduct={(p) => {
          setSelectedProduct(p);
          setAiAssistantOpen(false);
        }}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <MainApp />
      </ShopProvider>
    </AuthProvider>
  );
}
