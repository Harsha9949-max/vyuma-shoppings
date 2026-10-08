/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AuthProvider, useAuth, MASTER_ADMIN_EMAIL } from './context/AuthContext';
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
  const { user, isAdmin, isGoogleAuth } = useAuth();
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
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiContextProduct, setAiContextProduct] = useState<Product | null>(null);

  // Keyboard shortcut (Ctrl+Shift+A) for Master Admin Command Center
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setAdminPanelOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        <button
          onClick={() => setAdminPanelOpen(true)}
          className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
        >
          Master Admin Portal
        </button>
        <AdminPanelModal
          isOpen={adminPanelOpen}
          onClose={() => setAdminPanelOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6] text-[#212121]">
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

      <AdminPanelModal
        isOpen={adminPanelOpen}
        onClose={() => setAdminPanelOpen(false)}
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
