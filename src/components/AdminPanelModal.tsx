import React, { useState } from 'react';
import {
  X,
  Shield,
  Activity,
  Package,
  Boxes,
  CreditCard,
  Settings,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Lock,
  Search,
  DollarSign,
  Radio,
} from 'lucide-react';
import { useAuth, MASTER_ADMIN_EMAIL } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { Order, OrderStatus, Product, StoreSettings } from '../types';
import { CATEGORIES } from '../data/initialProducts';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, isGoogleAuth, signInWithGoogle } = useAuth();
  const {
    products,
    allOrders,
    storeSettings,
    updateStoreSettings,
    updateOrderStatus,
    resetCatalog,
    addNewProduct,
    updateProduct,
    deleteProduct,
    showToast,
  } = useShop();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'razorpay' | 'settings' | 'users'>('overview');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  // Product editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // New/Edit product fields
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<any>('electronics');
  const [subcategory, setSubcategory] = useState('General');
  const [price, setPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [stockCount, setStockCount] = useState<number>(10);
  const [image, setImage] = useState('');
  const [seller, setSeller] = useState('Vyuma Store');
  const [description, setDescription] = useState('');
  const [highlights, setHighlights] = useState('');
  const [fastDelivery, setFastDelivery] = useState('Delivery in 2-3 days');

  // Store Settings local form
  const [tempSettings, setTempSettings] = useState<StoreSettings>({ ...storeSettings });

  if (!isOpen) return null;

  // Strict rule: MUST be authenticated via Google Auth with marateyh@gmail.com
  const isAuthorizedMasterAdmin =
    isGoogleAuth && user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

  const handleAdminGoogleSignIn = async () => {
    setAuthError(null);
    setAuthenticating(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || 'Google authentication failed.');
    } finally {
      setAuthenticating(false);
    }
  };

  if (!isAuthorizedMasterAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 border border-gray-100">
          <div className="w-16 h-16 bg-blue-50 text-[#2874f0] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-blue-100">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-1">Master Admin Portal</h2>
          <p className="text-xs text-gray-500 mb-4">
            Authorized for <strong className="text-blue-600">{MASTER_ADMIN_EMAIL}</strong> via Google Auth only.
          </p>

          {user ? (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg mb-4 text-left">
              <p className="font-bold">Access Denied:</p>
              <p className="text-[11px] mt-0.5">
                Current account: <span className="font-semibold">{user.email}</span> ({isGoogleAuth ? 'Google Auth' : 'Email/Password'}).
              </p>
              <p className="text-[11px] mt-1 text-gray-600">
                You must sign in with Google using <span className="font-bold text-gray-900">{MASTER_ADMIN_EMAIL}</span>.
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 mb-4">
              Please sign in with your official Google account to access the store command center.
            </div>
          )}

          {authError && (
            <div className="bg-red-50 text-red-700 p-2.5 rounded-lg text-xs mb-3">
              {authError}
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={handleAdminGoogleSignIn}
              disabled={authenticating}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition shadow-sm cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{authenticating ? 'Connecting to Google...' : 'Sign In with Google (marateyh@gmail.com)'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel & Return to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard calculations
  const totalRevenue = allOrders.reduce((sum, o) => (o.paymentStatus === 'PAID' ? sum + o.finalPayable : sum), 0);
  const totalOrdersCount = allOrders.length;
  const completedOrders = allOrders.filter((o) => o.orderStatus === 'DELIVERED').length;
  const pendingOrders = allOrders.filter((o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED').length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Distinct Customers
  const customerMap = new Map<string, { email: string; ordersCount: number; totalSpent: number; lastOrder: number }>();
  allOrders.forEach((o) => {
    const existing = customerMap.get(o.userEmail) || {
      email: o.userEmail,
      ordersCount: 0,
      totalSpent: 0,
      lastOrder: o.createdAt,
    };
    existing.ordersCount += 1;
    existing.totalSpent += o.finalPayable;
    existing.lastOrder = Math.max(existing.lastOrder, o.createdAt);
    customerMap.set(o.userEmail, existing);
  });
  const customersList = Array.from(customerMap.values());

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const discount =
      originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        title,
        brand,
        category,
        subcategory,
        price: Number(price),
        originalPrice: Number(originalPrice),
        discountPercent: discount,
        stockCount: Number(stockCount),
        inStock: Number(stockCount) > 0,
        image: image || '/assets/mobiles.png',
        images: image ? [image] : editingProduct.images,
        seller: seller.trim() || 'Vyuma Store',
        description: description.trim() || editingProduct.description,
        highlights: highlights.trim() ? highlights.split('\n').filter(Boolean) : editingProduct.highlights,
        fastDelivery,
      };
      await updateProduct(updated);
      setEditingProduct(null);
    } else {
      const newProd: Product = {
        id: `prod-adm-${Date.now()}`,
        title,
        brand,
        category,
        subcategory,
        price: Number(price),
        originalPrice: Number(originalPrice),
        discountPercent: discount,
        rating: 0,
        ratingCount: 0,
        reviewCount: 0,
        image: image || '/assets/mobiles.png',
        images: [image || '/assets/mobiles.png'],
        isAssured: true,
        isDealOfTheDay: false,
        isTrending: false,
        description: description.trim() || `${title} from ${brand}. Verified authentic product.`,
        highlights: highlights.trim() ? highlights.split('\n').filter(Boolean) : ['100% Genuine product', 'Verified Authentic Quality'],
        specs: { Brand: brand, Category: category },
        inStock: Number(stockCount) > 0,
        stockCount: Number(stockCount),
        fastDelivery,
        seller: seller.trim() || 'Vyuma Store',
        createdAt: Date.now(),
      };
      await addNewProduct(newProd);
      setIsAddingProduct(false);
    }

    setTitle('');
    setBrand('');
    setPrice(0);
    setOriginalPrice(0);
    setStockCount(10);
    setImage('');
    setDescription('');
    setHighlights('');
  };

  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setIsAddingProduct(false);
    setTitle(p.title);
    setBrand(p.brand);
    setCategory(p.category);
    setSubcategory(p.subcategory);
    setPrice(p.price);
    setOriginalPrice(p.originalPrice);
    setStockCount(p.stockCount);
    setImage(p.image);
    setSeller(p.seller || 'Vyuma Store');
    setDescription(p.description || '');
    setHighlights((p.highlights || []).join('\n'));
    setFastDelivery(p.fastDelivery);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-gray-900 text-gray-100 rounded-xl shadow-2xl overflow-hidden my-4 border border-gray-800 flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-200">
        
        {/* Master Admin Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-gray-900 px-6 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#ffe500] text-blue-950 flex items-center justify-center font-black shadow-md">
              <Shield className="w-5 h-5 fill-blue-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg tracking-wider text-white">
                  VYUMA MASTER CONTROL CENTER
                </h2>
                <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Authenticated as <strong className="text-yellow-300">{MASTER_ADMIN_EMAIL}</strong> • Full Cloud & Database Authority
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-gray-950 px-6 border-b border-gray-800 overflow-x-auto gap-2 shrink-0">
          {[
            { id: 'overview', label: 'Live Monitoring', icon: Activity },
            { id: 'orders', label: `Orders (${allOrders.length})`, icon: Package },
            { id: 'products', label: `Catalog (${products.length})`, icon: Boxes },
            { id: 'razorpay', label: 'Razorpay Gateway', icon: CreditCard },
            { id: 'settings', label: 'Store Controls', icon: Settings },
            { id: 'users', label: `Customers (${customersList.length})`, icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setEditingProduct(null);
                  setIsAddingProduct(false);
                }}
                className={`py-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#ffe500] text-[#ffe500] bg-gray-900/60'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-900 text-xs">
          
          {/* 1. OVERVIEW & LIVE MONITORING */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700">
                  <span className="text-gray-400 text-[11px] block">Gross Revenue</span>
                  <span className="text-lg font-black text-green-400">
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700">
                  <span className="text-gray-400 text-[11px] block">Total Orders</span>
                  <span className="text-lg font-black text-white">{totalOrdersCount}</span>
                </div>
                <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700">
                  <span className="text-gray-400 text-[11px] block">Active Products</span>
                  <span className="text-lg font-black text-blue-400">{products.length}</span>
                </div>
                <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700">
                  <span className="text-gray-400 text-[11px] block">Pending Delivery</span>
                  <span className="text-lg font-black text-yellow-400">{pendingOrders}</span>
                </div>
                <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700">
                  <span className="text-gray-400 text-[11px] block">Delivered Orders</span>
                  <span className="text-lg font-black text-emerald-400">{completedOrders}</span>
                </div>
                <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700">
                  <span className="text-gray-400 text-[11px] block">Avg Order Value</span>
                  <span className="text-lg font-black text-purple-400">₹{avgOrderValue.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Live Health & Diagnostic Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/60 p-5 rounded-lg border border-gray-700 space-y-3">
                  <h3 className="font-bold text-sm text-gray-200 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-green-400 animate-ping" />
                    <span>Cloud Architecture Diagnostics</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-700">
                      <span className="text-gray-400">Database Engine:</span>
                      <span className="text-green-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Firebase Firestore (vyuma-2d9e1)
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-700">
                      <span className="text-gray-400">Auth Service:</span>
                      <span className="text-green-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Google OAuth + Firebase Auth
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-700">
                      <span className="text-gray-400">Payment Gateway Partner:</span>
                      <span className="text-blue-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Razorpay Standard Checkout
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-gray-400">AI Engine:</span>
                      <span className="text-yellow-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Gemini 2.5 Flash Proxy
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/60 p-5 rounded-lg border border-gray-700 space-y-3">
                  <h3 className="font-bold text-sm text-gray-200 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#ffe500]" />
                    <span>Quick Master Actions</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 p-2.5 rounded font-semibold text-center transition cursor-pointer"
                    >
                      📦 Manage Live Orders
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('products');
                        setIsAddingProduct(true);
                      }}
                      className="bg-green-600/30 hover:bg-green-600/50 text-green-300 border border-green-500/40 p-2.5 rounded font-semibold text-center transition cursor-pointer"
                    >
                      ➕ Add Product to Firestore
                    </button>
                    <button
                      onClick={() => setActiveTab('razorpay')}
                      className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 p-2.5 rounded font-semibold text-center transition cursor-pointer"
                    >
                      💳 Razorpay Settings
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to clear all products from the catalog?')) {
                          await resetCatalog();
                        }
                      }}
                      className="bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 p-2.5 rounded font-semibold text-center transition cursor-pointer"
                    >
                      🗑️ Clear Catalog
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div>
                <h3 className="font-bold text-sm text-gray-200 mb-3">Recent Orders Activity</h3>
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden divide-y divide-gray-700">
                  {allOrders.slice(0, 5).map((ord) => (
                    <div key={ord.id} className="p-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">#{ord.id}</span>
                          <span className="text-gray-400">({ord.userEmail})</span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {ord.items.length} item(s) • Razorpay ID: {ord.razorpayPaymentId || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-green-400">₹{ord.finalPayable.toLocaleString('en-IN')}</span>
                        <span className="bg-blue-900/60 text-blue-300 border border-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          {ord.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. ORDER MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">All Store Orders ({allOrders.length})</h3>
                <span className="text-[11px] text-gray-400">Live order status modifications update customer views instantly</span>
              </div>

              {allOrders.length === 0 ? (
                <div className="p-8 text-center bg-gray-800 rounded-lg border border-gray-700 text-gray-400">
                  No orders placed yet. Test the store checkout as a customer to see live orders here.
                </div>
              ) : (
                <div className="space-y-3">
                  {allOrders.map((ord) => (
                    <div key={ord.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-700">
                        <div>
                          <span className="font-black text-sm text-white">#{ord.id}</span>
                          <span className="ml-2 text-gray-400 text-xs">Customer: {ord.userEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300 font-bold">₹{ord.finalPayable.toLocaleString('en-IN')}</span>
                          <span className="bg-green-900/60 text-green-300 border border-green-700 text-[10px] font-bold px-2 py-0.5 rounded">
                            {ord.paymentMethod} • {ord.paymentStatus}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
                        <div>
                          <p className="font-semibold text-gray-400 text-[11px] mb-1">Purchased Items:</p>
                          <ul className="space-y-1">
                            {ord.items.map((it, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="text-gray-400">{it.quantity}x</span>
                                <span className="truncate">{it.product.title}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-400 text-[11px] mb-1">Delivery Address:</p>
                          <p className="text-gray-300">
                            {ord.shippingAddress.fullName} ({ord.shippingAddress.mobile})<br />
                            {ord.shippingAddress.addressLine}, {ord.shippingAddress.city} - {ord.shippingAddress.pincode}
                          </p>
                          {ord.razorpayPaymentId && (
                            <p className="text-[10px] text-blue-400 mt-1">
                              Razorpay Txn: {ord.razorpayPaymentId}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Update Control Bar */}
                      <div className="pt-2 border-t border-gray-700 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-medium">Update Status:</span>
                          {(['CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(
                            (st) => (
                              <button
                                key={st}
                                onClick={() => updateOrderStatus(ord.id, ord.userId, st, ord.paymentStatus)}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                  ord.orderStatus === st
                                    ? 'bg-[#ffe500] text-blue-950 shadow-xs'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                {st}
                              </button>
                            )
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-medium">Payment:</span>
                          {(['PAID', 'PENDING', 'REFUNDED'] as const).map((ps) => (
                            <button
                              key={ps}
                              onClick={() => updateOrderStatus(ord.id, ord.userId, ord.orderStatus, ps)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                ord.paymentStatus === ps ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
                              }`}
                            >
                              {ps}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. PRODUCT CATALOG MASTER CONTROL */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products in catalog..."
                    className="w-full bg-gray-800 pl-9 pr-3 py-2 border border-gray-700 rounded text-xs text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsAddingProduct(true);
                      setEditingProduct(null);
                      setTitle('');
                      setBrand('');
                      setPrice(0);
                      setOriginalPrice(0);
                      setStockCount(10);
                      setImage('');
                      setSeller('Vyuma Store');
                      setDescription('');
                      setHighlights('');
                      setFastDelivery('Delivery in 2-3 days');
                    }}
                    className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Product</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete all products from the catalog?')) {
                        await resetCatalog();
                      }
                    }}
                    className="bg-gray-800 hover:bg-red-900/50 text-gray-300 hover:text-red-200 border border-gray-700 px-3 py-2 rounded font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Products</span>
                  </button>
                </div>
              </div>

              {/* Product Form if Adding or Editing */}
              {(isAddingProduct || editingProduct) && (
                <form
                  onSubmit={handleSaveProduct}
                  className="bg-gray-800 p-5 rounded-lg border border-blue-500/50 space-y-3"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                    <h4 className="font-bold text-sm text-yellow-300">
                      {editingProduct ? `Edit Product: ${editingProduct.title}` : 'Add New Product to Firestore'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setIsAddingProduct(false);
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 mb-1">Title *</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Brand *</label>
                      <input
                        type="text"
                        required
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-gray-400 mb-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Price (₹) *</label>
                      <input
                        type="number"
                        required
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">MRP (₹)</label>
                      <input
                        type="number"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(Number(e.target.value))}
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Stock Count</label>
                      <input
                        type="number"
                        value={stockCount}
                        onChange={(e) => setStockCount(Number(e.target.value))}
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 mb-1">Image URL / Asset Path</label>
                      <input
                        type="text"
                        placeholder="e.g. https://... or /assets/mobiles.png"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Seller / Vendor Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Vyuma Store"
                        value={seller}
                        onChange={(e) => setSeller(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 mb-1">Delivery Estimate Text</label>
                      <input
                        type="text"
                        value={fastDelivery}
                        onChange={(e) => setFastDelivery(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Subcategory</label>
                      <input
                        type="text"
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Product Description</label>
                    <textarea
                      rows={2}
                      placeholder="Detailed genuine product description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Product Highlights (one per line)</label>
                    <textarea
                      rows={2}
                      placeholder="100% Genuine product&#10;1 Year Brand Warranty"
                      value={highlights}
                      onChange={(e) => setHighlights(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-xs"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      className="bg-[#ffe500] text-blue-950 font-bold px-4 py-2 rounded hover:bg-yellow-400 transition cursor-pointer"
                    >
                      {editingProduct ? 'Update Product in Firestore' : 'Publish Product to Store'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setIsAddingProduct(false);
                      }}
                      className="bg-gray-700 text-gray-300 px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Products Table */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden divide-y divide-gray-700">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="p-3 flex items-center justify-between gap-4 hover:bg-gray-750">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-10 h-10 object-contain bg-white rounded p-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-white truncate">{p.title}</h4>
                        <p className="text-[11px] text-gray-400">
                          {p.brand} • <span className="capitalize">{p.category}</span> • ₹{p.price.toLocaleString('en-IN')}{' '}
                          <span className="line-through text-gray-500">₹{p.originalPrice.toLocaleString('en-IN')}</span> • {p.stockCount} in stock
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(p)}
                        className="p-1.5 bg-blue-900/60 hover:bg-blue-800 text-blue-300 border border-blue-600 rounded transition cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={async () => {
                          if (confirm(`Delete "${p.title}" from Firestore?`)) {
                            await deleteProduct(p.id);
                          }
                        }}
                        className="p-1.5 bg-red-900/60 hover:bg-red-800 text-red-300 border border-red-600 rounded transition cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. RAZORPAY INTEGRATION & SETTINGS */}
          {activeTab === 'razorpay' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-950 to-indigo-950 p-5 rounded-lg border border-blue-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-black text-white">Razorpay</span>
                    <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      OFFICIAL PARTNER
                    </span>
                  </div>
                  <p className="text-xs text-blue-200">
                    Trusted by 5 Crore+ businesses in India. UPI (GPay, PhonePe, Paytm), Cards, NetBanking & Wallets.
                  </p>
                </div>
                <div className="text-right">
                  <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    LIVE & ACTIVE
                  </span>
                </div>
              </div>

              {/* Razorpay Configuration */}
              <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 space-y-4">
                <h4 className="font-bold text-sm text-gray-200">Gateway Configuration</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1">Razorpay Key ID</label>
                    <input
                      type="text"
                      value={tempSettings.razorpayKeyId}
                      onChange={(e) => setTempSettings({ ...tempSettings, razorpayKeyId: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Environment Mode</label>
                    <select
                      value={tempSettings.razorpayLiveMode ? 'live' : 'test'}
                      onChange={(e) => setTempSettings({ ...tempSettings, razorpayLiveMode: e.target.value === 'live' })}
                      className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-xs"
                    >
                      <option value="live">Live Production Mode (Instant Settlement)</option>
                      <option value="test">Test Sandbox Mode</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await updateStoreSettings(tempSettings);
                  }}
                  className="bg-[#ffe500] text-blue-950 font-bold px-4 py-2 rounded hover:bg-yellow-400 transition cursor-pointer"
                >
                  Save Gateway Settings
                </button>
              </div>

              {/* Razorpay Transaction Logs */}
              <div>
                <h4 className="font-bold text-sm text-gray-200 mb-3">Razorpay Payment Transaction Logs</h4>
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden divide-y divide-gray-700">
                  {allOrders.map((ord) => (
                    <div key={ord.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{ord.razorpayPaymentId || `pay_rzp_${ord.id}`}</span>
                        <p className="text-[11px] text-gray-400">
                          Order: #{ord.id} • Customer: {ord.userEmail} • {new Date(ord.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-green-400">₹{ord.finalPayable.toLocaleString('en-IN')}</span>
                        <p className="text-[10px] text-gray-400">{ord.paymentMethod} • SUCCESS</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. STORE CONTROLS & MARKETING */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 space-y-4">
                <h4 className="font-bold text-sm text-gray-200">Storewide Announcement Banner</h4>
                
                <div>
                  <label className="block text-gray-400 mb-1">Announcement Text</label>
                  <textarea
                    rows={2}
                    value={tempSettings.announcementText}
                    onChange={(e) => setTempSettings({ ...tempSettings, announcementText: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showAnnouncement"
                    checked={tempSettings.showAnnouncement}
                    onChange={(e) => setTempSettings({ ...tempSettings, showAnnouncement: e.target.checked })}
                    className="w-4 h-4 text-[#ffe500]"
                  />
                  <label htmlFor="showAnnouncement" className="text-gray-300 font-medium">
                    Display top announcement marquee across all shopper pages
                  </label>
                </div>
              </div>

              <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 space-y-4">
                <h4 className="font-bold text-sm text-gray-200">Flash Sale & Maintenance Mode</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isFlashSaleActive"
                      checked={tempSettings.isFlashSaleActive}
                      onChange={(e) => setTempSettings({ ...tempSettings, isFlashSaleActive: e.target.checked })}
                      className="w-4 h-4 text-[#ffe500]"
                    />
                    <label htmlFor="isFlashSaleActive" className="text-gray-300 font-medium">
                      Enable Deals of the Day Flash Sale Timer
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={tempSettings.maintenanceMode}
                      onChange={(e) => setTempSettings({ ...tempSettings, maintenanceMode: e.target.checked })}
                      className="w-4 h-4 text-red-500"
                    />
                    <label htmlFor="maintenanceMode" className="text-red-400 font-medium">
                      Maintenance Mode (Store offline for updates)
                    </label>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await updateStoreSettings(tempSettings);
                  }}
                  className="bg-[#ffe500] text-blue-950 font-bold px-4 py-2 rounded hover:bg-yellow-400 transition cursor-pointer"
                >
                  Save Store Settings to Firestore
                </button>
              </div>
            </div>
          )}

          {/* 6. CUSTOMER DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-gray-200">Registered Customers & Spend Analytics</h4>
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden divide-y divide-gray-700">
                {customersList.map((c, i) => (
                  <div key={i} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{c.email}</span>
                      <p className="text-[11px] text-gray-400">
                        {c.ordersCount} order(s) placed • Last active {new Date(c.lastOrder).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-green-400">₹{c.totalSpent.toLocaleString('en-IN')}</span>
                      <p className="text-[10px] text-gray-400">Lifetime Spend</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
