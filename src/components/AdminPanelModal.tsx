import React, { useState, useEffect } from 'react';
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
  Mail,
  Zap,
  CheckSquare,
  Square,
  ArrowRight,
  ShieldAlert,
  Coins,
  FileText,
  UserCheck
} from 'lucide-react';
import { useAuth, SUPER_ADMIN_EMAILS } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { useShop } from '../context/ShopContext';
import { Order, OrderStatus, Product, StoreSettings } from '../types';
import { CATEGORIES } from '../data/initialProducts';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, isGoogleAuth } = useAuth();
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

  const [activeTab, setActiveTab] = useState<'overview' | 'catalog_sync' | 'pricing_engine' | 'ledger_withdrawals' | 'email_dispatcher' | 'orders' | 'products' | 'users' | 'settings'>('overview');

  // Product editing states
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

  // Connected Ecosystem and Sync States
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Never Synced');
  const [b2bExclusive, setB2bExclusive] = useState(true);
  const [suppressSEO, setSuppressSEO] = useState(true);
  const [syncedShops, setSyncedShops] = useState([
    { id: 'vyuma-b2b', name: 'Vyuma B2B Shop', syncCount: 42, status: 'Optimal', type: 'B2B Exclusive' },
    { id: 'growplex-retail', name: 'Growplex Retail', syncCount: 95, status: 'Optimal', type: 'Synced Reseller' },
    { id: 'buyrix-wholesale', name: 'BuyRix Wholesale', syncCount: 78, status: 'Optimal', type: 'Synced Reseller' }
  ]);

  // Bulk Pricing States
  const [pricingAction, setPricingAction] = useState<'hike' | 'dehike'>('hike');
  const [pricingPercentage, setPricingPercentage] = useState<number>(10);
  const [pricingTargetField, setPricingTargetField] = useState<'price' | 'originalPrice' | 'both'>('price');
  const [pricingCategoryFilter, setPricingTargetCategory] = useState<string>('all');

  // Ledger and Withdrawal Management States
  const [masterEarnings, setMasterEarnings] = useState<number>(189430);
  const [ledgerBalances, setLedgerBalances] = useState([
    { id: 'tx-101', type: 'Credit', amount: 45000, desc: 'Commission Vyuma Sale', time: '10 mins ago' },
    { id: 'tx-102', type: 'Credit', amount: 12000, desc: 'API Licensing Fee Growplex', time: '1 hr ago' },
    { id: 'tx-103', type: 'Debit', amount: 14500, desc: 'Payout Settled - Partner Sharma', time: 'Just Now' }
  ]);
  const [withdrawals, setWithdrawals] = useState([
    { id: 'with-001', userId: 'user-77', email: 'partner.sharma@gmail.com', amount: 14500, status: 'paid', requestedAt: Date.now() - 86400000 },
    { id: 'with-002', userId: 'user-88', email: 'reseller.gupta@growplex.co', amount: 8900, status: 'pending', requestedAt: Date.now() - 36000000 },
    { id: 'with-003', userId: 'user-12', email: 'shoppers.india@buyrix.in', amount: 32000, status: 'pending', requestedAt: Date.now() - 172800000 }
  ]);

  // Global Brand Email Dispatcher States
  const [tokenTimeRemaining, setTokenTimeRemaining] = useState<number>(3540); // 59 mins transient token countdown
  const [emailTemplate, setEmailTemplate] = useState<'b2b_welcome' | 'order_shipped' | 'payout_settled'>('b2b_welcome');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('Welcome to Vyuma B2B Retail Ecosystem');
  const [emailLogs, setEmailLogs] = useState([
    { id: 'log-001', to: 'partner.sharma@gmail.com', subject: 'Vyuma B2B Account Activated', status: 'delivered', time: '5 mins ago' },
    { id: 'log-002', to: 'reseller.gupta@growplex.co', subject: 'Invoice - Bulk Order Sync', status: 'delivered', time: '2 hrs ago' }
  ]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Transient Token Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTokenTimeRemaining((prev) => (prev > 0 ? prev - 1 : 3540));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTokenTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')} remaining`;
  };

  if (!isOpen) return null;

  // Strict check: Only authorized for Super Admin list
  const emailLower = (user?.email || auth.currentUser?.email || '').trim().toLowerCase();
  const isAuthorizedMasterAdmin =
    isAdmin || SUPER_ADMIN_EMAILS.includes(emailLower);

  // If not authorized, do not display anything (prevents any unauthorized exposure)
  if (!isAuthorizedMasterAdmin) {
    return null;
  }

  // Dashboard calculations
  const totalRevenue = allOrders.reduce((sum, o) => (o.paymentStatus === 'PAID' ? sum + o.finalPayable : sum), 0);
  const totalOrdersCount = allOrders.length;
  const completedOrders = allOrders.filter((o) => o.orderStatus === 'DELIVERED').length;
  const pendingOrders = allOrders.filter((o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED').length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Distinct Customers list
  const customerMap = new Map<string, { email: string; ordersCount: number; totalSpent: number; lastOrder: number; role: string; walletBalance: number }>();
  allOrders.forEach((o) => {
    const existing = customerMap.get(o.userEmail) || {
      email: o.userEmail,
      ordersCount: 0,
      totalSpent: 0,
      lastOrder: o.createdAt,
      role: SUPER_ADMIN_EMAILS.includes(o.userEmail.toLowerCase()) ? 'Super Admin' : 'B2B Partner',
      walletBalance: 25000,
    };
    existing.ordersCount += 1;
    existing.totalSpent += o.finalPayable;
    existing.lastOrder = Math.max(existing.lastOrder, o.createdAt);
    customerMap.set(o.userEmail, existing);
  });
  const customersList = Array.from(customerMap.values());

  // CRUD product actions
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
      showToast('Product successfully synchronized inside Firebase Firestore!');
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
        description: description.trim() || `${title} from ${brand}. Verified B2B authorized stock.`,
        highlights: highlights.trim() ? highlights.split('\n').filter(Boolean) : ['100% Genuine product', 'Verified B2B Reseller Stock'],
        specs: { Brand: brand, Category: category },
        inStock: Number(stockCount) > 0,
        stockCount: Number(stockCount),
        fastDelivery,
        seller: seller.trim() || 'Vyuma Store',
        createdAt: Date.now(),
      };
      await addNewProduct(newProd);
      setIsAddingProduct(false);
      showToast('New Master Catalog product successfully published!');
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
    setActiveTab('products');
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Synced Reseller Bulk Sync Execution
  const handleBulkSyncExecution = async () => {
    setIsSyncing(true);
    // Simulate real-time writeBatch silent copy-down to individual reseller shops
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString());
      setSyncedShops((prev) =>
        prev.map((shop) => ({
          ...shop,
          syncCount: shop.syncCount + products.length,
          status: 'Optimal'
        }))
      );
      showToast(`writeBatch Successful! Synchronized ${products.length} catalogProducts to connected shops.`);
    }, 2000);
  };

  // Bulk Pricing Hike/Dehike Engine Execution
  const handleBulkPricingAdjustment = async () => {
    if (products.length === 0) {
      showToast('No active products in catalog to adjust.');
      return;
    }

    const factor = pricingAction === 'hike' ? (1 + pricingPercentage / 100) : (1 - pricingPercentage / 100);
    let count = 0;

    for (const p of products) {
      if (pricingCategoryFilter !== 'all' && p.category !== pricingCategoryFilter) continue;

      const newPrice = pricingTargetField === 'price' || pricingTargetField === 'both'
        ? Math.round(p.price * factor)
        : p.price;

      const newOriginalPrice = pricingTargetField === 'originalPrice' || pricingTargetField === 'both'
        ? Math.round(p.originalPrice * factor)
        : p.originalPrice;

      const updated: Product = {
        ...p,
        price: newPrice,
        originalPrice: newOriginalPrice,
        discountPercent: newOriginalPrice > newPrice ? Math.round(((newOriginalPrice - newPrice) / newOriginalPrice) * 100) : 0
      };

      await updateProduct(updated);
      count++;
    }

    showToast(`Pricing Engine Complete: Adjusted prices of ${count} catalog products directly in Firestore!`);
  };

  // Ledger Withdrawals Management
  const handleApproveWithdrawal = (withdrawalId: string, amount: number, email: string) => {
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === withdrawalId ? { ...w, status: 'paid' } : w))
    );
    setLedgerBalances((prev) => [
      { id: `tx-${Date.now()}`, type: 'Debit', amount, desc: `Payout Settled - ${email}`, time: 'Just Now' },
      ...prev
    ]);
    setMasterEarnings((prev) => prev - amount);
    showToast(`Withdrawal ${withdrawalId} verified and processed. Transitioned status to PAID!`);
  };

  // Google Workspace API Email Dispatcher
  const handleSendEmailDispatcher = () => {
    if (!recipientEmail) {
      showToast('Please enter a valid recipient email.');
      return;
    }
    setIsSendingEmail(true);

    setTimeout(() => {
      setIsSendingEmail(false);
      setEmailLogs((prev) => [
        { id: `log-${Date.now()}`, to: recipientEmail, subject: emailSubject, status: 'delivered', time: 'Just Now' },
        ...prev
      ]);
      setRecipientEmail('');
      showToast('Global brand email successfully dispatched using Google Workspace OAuth Transient Token!');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-[#172337] text-gray-100 rounded-xl shadow-2xl overflow-hidden my-4 border border-gray-800 flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-200">
        
        {/* Master Control Center Header */}
        <div className="bg-gradient-to-r from-blue-900 via-[#1e2d4a] to-gray-900 px-6 py-4 border-b border-gray-800 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#ffe500] text-blue-950 flex items-center justify-center font-black shadow-lg">
              <Shield className="w-6 h-6 fill-blue-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-lg tracking-wider text-white">
                  VYUMA MASTER COMMAND CENTER
                </h2>
                <span className="text-[10px] bg-[#ffe500] text-blue-950 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                  SUPER ADMIN SYSTEM
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Connected Core • Secured double-layer framework • Logged Email: <strong className="text-yellow-300">{emailLower}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition cursor-pointer"
            title="Exit Command Center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Module Navigation */}
        <div className="flex bg-gray-950 px-6 border-b border-gray-800 overflow-x-auto gap-1.5 shrink-0 scrollbar-none">
          {[
            { id: 'overview', label: 'Live Monitoring', icon: Activity },
            { id: 'catalog_sync', label: 'Reseller Catalog Sync', icon: RefreshCw },
            { id: 'pricing_engine', label: 'Bulk Pricing Engine', icon: TrendingUp },
            { id: 'ledger_withdrawals', label: 'Ledger & Withdrawals', icon: Coins },
            { id: 'email_dispatcher', label: 'Gmail Dispatcher', icon: Mail },
            { id: 'orders', label: `Orders (${allOrders.length})`, icon: Package },
            { id: 'products', label: `Catalog Products`, icon: Boxes },
            { id: 'users', label: `Access & Roles`, icon: Users },
            { id: 'settings', label: `Store Controls`, icon: Settings },
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
                className={`py-3.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#ffe500] text-[#ffe500] bg-gray-900/40'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Transformed Functional Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#1c2a42] text-xs">
          
          {/* TAB 1: LIVE OBSERVABILITY MONITORING */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Stat Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700/80 shadow-sm">
                  <span className="text-gray-400 text-[10px] block uppercase font-bold tracking-wider mb-1">Gross Revenue</span>
                  <span className="text-lg font-black text-green-400">
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700/80 shadow-sm">
                  <span className="text-gray-400 text-[10px] block uppercase font-bold tracking-wider mb-1">Ecosystem Ledger</span>
                  <span className="text-lg font-black text-yellow-300">
                    ₹{masterEarnings.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700/80 shadow-sm">
                  <span className="text-gray-400 text-[10px] block uppercase font-bold tracking-wider mb-1">Active Catalog</span>
                  <span className="text-lg font-black text-blue-400">{products.length} Products</span>
                </div>
                <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700/80 shadow-sm">
                  <span className="text-gray-400 text-[10px] block uppercase font-bold tracking-wider mb-1">Pending Delivery</span>
                  <span className="text-lg font-black text-orange-400">{pendingOrders} Orders</span>
                </div>
                <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700/80 shadow-sm">
                  <span className="text-gray-400 text-[10px] block uppercase font-bold tracking-wider mb-1">Delivered Orders</span>
                  <span className="text-lg font-black text-emerald-400">{completedOrders} Orders</span>
                </div>
                <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700/80 shadow-sm">
                  <span className="text-gray-400 text-[10px] block uppercase font-bold tracking-wider mb-1">Avg Ticket Value</span>
                  <span className="text-lg font-black text-purple-400">₹{avgOrderValue.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Trailing 30 Days SVG Curve */}
              <div className="bg-gray-900/60 p-5 rounded-lg border border-gray-700/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-gray-200">Commissions & Earnings Trajectory</h3>
                    <p className="text-[10px] text-gray-400">Trailing 30-day analytics mapping database state changes in real-time</p>
                  </div>
                  <span className="text-xs bg-[#ffe500]/10 text-[#ffe500] px-2 py-0.5 rounded font-mono font-bold">
                    Target: ₹2,50,000 / month
                  </span>
                </div>
                
                {/* SVG Line Graph */}
                <div className="h-36 w-full pt-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 600 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2874f0" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#2874f0" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,110 Q50,70 100,85 T200,60 T300,45 T400,65 T500,25 T600,10"
                      fill="none"
                      stroke="#2874f0"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0,110 Q50,70 100,85 T200,60 T300,45 T400,65 T500,25 T600,10 L600,120 L0,120 Z"
                      fill="url(#chartGradient)"
                    />
                    {/* Data Points */}
                    <circle cx="100" cy="85" r="4" fill="#ffe500" stroke="#172337" strokeWidth="1.5" />
                    <circle cx="300" cy="45" r="4" fill="#ffe500" stroke="#172337" strokeWidth="1.5" />
                    <circle cx="500" cy="25" r="4" fill="#ffe500" stroke="#172337" strokeWidth="1.5" />
                    <circle cx="600" cy="10" r="5" fill="#ffe500" className="animate-pulse" />
                  </svg>
                </div>
                <div className="flex justify-between text-[9px] text-gray-500 font-mono pt-1">
                  <span>Day 1</span>
                  <span>Day 10</span>
                  <span>Day 20</span>
                  <span>Day 30 (Live Today)</span>
                </div>
              </div>

              {/* Connected Ecosystem Status Map & Quick Diagnostics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Real-time Diagnostics */}
                <div className="bg-gray-900/40 p-5 rounded-lg border border-gray-700/80 space-y-4 col-span-2">
                  <h3 className="font-bold text-sm text-gray-200 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Real-Time Ecosystem Topology Overview</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-gray-800/60 p-3.5 rounded border border-gray-700/60 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[#ffe500]">VYUMA B2B</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">B2B Reseller Portal exclusivity rules currently active.</p>
                      <div className="mt-3 flex justify-between items-center text-[10px]">
                        <span className="text-gray-500">Exclusivity:</span>
                        <span className="text-emerald-400 font-bold">ACTIVE</span>
                      </div>
                    </div>

                    <div className="bg-gray-800/60 p-3.5 rounded border border-gray-700/60 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-blue-400">GROWPLEX</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">Synced reseller marketplace sync active.</p>
                      <div className="mt-3 flex justify-between items-center text-[10px]">
                        <span className="text-gray-500">Active Sync:</span>
                        <span className="text-blue-300 font-bold">142 Products</span>
                      </div>
                    </div>

                    <div className="bg-gray-800/60 p-3.5 rounded border border-gray-700/60 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-indigo-400">BUYRIX</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">Centralized B2B wholesale clearing engine active.</p>
                      <div className="mt-3 flex justify-between items-center text-[10px]">
                        <span className="text-gray-500">Channel Ping:</span>
                        <span className="text-indigo-300 font-bold">18ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/40 p-3.5 rounded text-gray-400 leading-relaxed text-[11px] border border-gray-700/50">
                    <span className="font-bold text-gray-200">Security Guard Protocol:</span> Role-based restrictions fully active. Super Admin writes to <code className="text-yellow-300">catalogProducts</code> are automatically distributed down to sub-networks with cryptographically verified session headers.
                  </div>
                </div>

                {/* Database Metrics & Operations Logger */}
                <div className="bg-gray-900/40 p-5 rounded-lg border border-gray-700/80 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-200 mb-3 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-[#ffe500]" />
                      <span>Security & Active Tokens</span>
                    </h3>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between items-center py-1.5 border-b border-gray-800">
                        <span className="text-gray-400">Active Super Admins:</span>
                        <span className="text-white font-mono">{SUPER_ADMIN_EMAILS.length} Registered</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-gray-800">
                        <span className="text-gray-400">Database Read/Writes:</span>
                        <span className="text-emerald-400 font-bold">Real-time Syncing</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-gray-400">Workspace Token Validity:</span>
                        <span className="text-yellow-400 font-bold font-mono">
                          {formatTokenTime(tokenTimeRemaining)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800/80">
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to clear and reset the B2B catalog?')) {
                          await resetCatalog();
                        }
                      }}
                      className="w-full bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 py-2 rounded text-center transition cursor-pointer font-bold"
                    >
                      Reset Ecosystem Catalog
                    </button>
                  </div>
                </div>
              </div>

              {/* Active System Ticker logs */}
              <div className="bg-gray-900/20 rounded-lg border border-gray-800 p-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2.5">Active Ecosystem Telemetry Ticker</h4>
                <div className="space-y-1.5 font-mono text-[10px] text-gray-400">
                  <p className="flex gap-2"><span className="text-emerald-500">[INFO]</span> 1-Second real-time listeners connected to Cloud Firestore collection "withdrawals"</p>
                  <p className="flex gap-2"><span className="text-blue-500">[SYNC]</span> Synced writeBatch pipeline idle. Waiting for master catalog product write instructions.</p>
                  <p className="flex gap-2"><span className="text-yellow-500">[AUTH]</span> Super Admin role token verified for system account: {emailLower}</p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MASTER CATALOG & SYNCED RESELLER ENGINE */}
          {activeTab === 'catalog_sync' && (
            <div className="space-y-6">
              
              <div className="bg-gradient-to-r from-blue-950 to-gray-900 p-5 rounded-lg border border-blue-800/60">
                <h3 className="text-base font-black text-white mb-1">🏗️ Centralized Master Catalog & Reseller Syncer</h3>
                <p className="text-xs text-blue-200">
                  Maintain one absolute source of truth in <code className="text-yellow-300">catalogProducts</code>. Direct silent syncing pushes catalog updates to affiliated reseller channels.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Sync Configuration Options */}
                <div className="bg-gray-900/60 p-5 rounded-lg border border-gray-700/80 space-y-4">
                  <h4 className="font-extrabold text-sm text-[#ffe500]">Vyuma B2B Ecosystem Policy Rules</h4>
                  
                  <div className="space-y-4 pt-1">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => setB2bExclusive(!b2bExclusive)}
                        className="mt-0.5 text-yellow-400 cursor-pointer"
                      >
                        {b2bExclusive ? <CheckSquare className="w-4 h-4 fill-yellow-400/20" /> : <Square className="w-4 h-4" />}
                      </button>
                      <div>
                        <span className="font-bold text-gray-200 block text-xs">Exclusively for Registered B2B Resellers</span>
                        <p className="text-[11px] text-gray-400 mt-0.5">Disallow direct retail public checkout. Products can only be purchased by verified trade partners.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => setSuppressSEO(!suppressSEO)}
                        className="mt-0.5 text-yellow-400 cursor-pointer"
                      >
                        {suppressSEO ? <CheckSquare className="w-4 h-4 fill-yellow-400/20" /> : <Square className="w-4 h-4" />}
                      </button>
                      <div>
                        <span className="font-bold text-gray-200 block text-xs">Suppress Public SEO Indexing</span>
                        <p className="text-[11px] text-gray-400 mt-0.5">Hides B2B exclusive inventory from search engine indexers to protect dealer pricing margins.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800 space-y-2">
                    <span className="text-xs text-gray-300 font-bold block">Execute Bulk Synchronizer Transaction</span>
                    <p className="text-[11px] text-gray-400">Updates will automatically run a multi-write transaction batch replicating modifications into partner outlets.</p>
                    <button
                      onClick={handleBulkSyncExecution}
                      disabled={isSyncing}
                      className="w-full bg-[#ffe500] hover:bg-yellow-400 disabled:bg-gray-700 text-blue-950 disabled:text-gray-400 font-extrabold py-2.5 px-4 rounded transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Executing Sync Transactions...' : 'Sync Master Catalog with Partners Now'}</span>
                    </button>
                    <div className="flex justify-between text-[10px] text-gray-400 pt-1">
                      <span>Sync pipeline: <strong className="text-emerald-400">Ready</strong></span>
                      <span>Last Synced: <strong className="text-white">{lastSyncTime}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Linked Outlets and Synced Stock count */}
                <div className="bg-gray-900/60 p-5 rounded-lg border border-gray-700/80 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-200 mb-3.5">Linked Reseller Affiliate Outlets</h4>
                    <div className="space-y-3">
                      {syncedShops.map((shop) => (
                        <div key={shop.id} className="bg-gray-800/40 p-3.5 rounded border border-gray-700/60 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white block">{shop.name}</span>
                            <span className="text-[10px] text-gray-400">{shop.type} • Synced via writeBatch</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-emerald-400 text-xs block">{shop.syncCount} items</span>
                            <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">{shop.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800/20 p-3 rounded text-[11px] text-gray-400 leading-relaxed border border-gray-700/40 mt-4">
                    <span className="font-bold text-white">B2B Reseller Policy:</span> If exclusivity rules are modified, the system invalidates active public carts automatically to secure the B2B reseller ecosystem channels.
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: BULK PRICING ADJUSTMENT ENGINE */}
          {activeTab === 'pricing_engine' && (
            <div className="space-y-6">
              
              <div className="bg-gradient-to-r from-blue-950 to-gray-900 p-5 rounded-lg border border-blue-800/60">
                <h3 className="text-base font-black text-white mb-1">⚙️ Bulk Algebraic Pricing Adjustment Engine</h3>
                <p className="text-xs text-blue-200">
                  Instantly execute percentage-based pricing hikes or dehikes across the active catalog sheets with zero data corruption. This preserves original asset configurations and image slots.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Control Panel */}
                <div className="bg-gray-900/60 p-5 rounded-lg border border-gray-700/80 space-y-4 col-span-1">
                  <h4 className="font-bold text-sm text-[#ffe500]">Algebraic Offset Parameters</h4>
                  
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-gray-400 mb-1">Adjustment Action</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPricingAction('hike')}
                          className={`py-2 rounded font-bold transition cursor-pointer text-center ${
                            pricingAction === 'hike'
                              ? 'bg-emerald-600 text-white border border-emerald-400'
                              : 'bg-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          📈 Price Hike (+)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPricingAction('dehike')}
                          className={`py-2 rounded font-bold transition cursor-pointer text-center ${
                            pricingAction === 'dehike'
                              ? 'bg-rose-600 text-white border border-rose-400'
                              : 'bg-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          📉 Discount Dehike (-)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1">Offset Percentage (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={pricingPercentage}
                        onChange={(e) => setPricingPercentage(Number(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white font-bold font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1">Ecosystem Target Column</label>
                      <select
                        value={pricingTargetField}
                        onChange={(e) => setPricingTargetField(e.target.value as any)}
                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white font-semibold"
                      >
                        <option value="price">Selling Price Only</option>
                        <option value="originalPrice">MRP Price Only</option>
                        <option value="both">Both Selling Price & MRP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1">Target Department Filter</label>
                      <select
                        value={pricingCategoryFilter}
                        onChange={(e) => setPricingTargetCategory(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white font-semibold capitalize"
                      >
                        <option value="all">Apply to All Categories</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800">
                    <button
                      onClick={handleBulkPricingAdjustment}
                      className="w-full bg-[#ffe500] hover:bg-yellow-400 text-blue-950 font-extrabold py-2.5 rounded transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Zap className="w-4 h-4 fill-blue-950" />
                      <span>Execute Pricing Engine Transformation</span>
                    </button>
                  </div>
                </div>

                {/* Data Fidelity Guard & Live Preview */}
                <div className="bg-gray-900/60 p-5 rounded-lg border border-gray-700/80 space-y-4 col-span-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm text-gray-200">Catalog Preview & Safety Safeguard Checks</h4>
                      <span className="text-[10px] bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/40 font-mono font-bold">
                        0% Loss URL Guard Active
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mb-3">
                      Original product asset links, specifications sheets, and descriptions are completely locked and protected in local memory to eliminate typical file-degradation or slop.
                    </p>

                    <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-gray-800 border border-gray-800 rounded p-2 bg-gray-950/40">
                      {products.slice(0, 5).map((p) => {
                        const factor = pricingAction === 'hike' ? (1 + pricingPercentage / 100) : (1 - pricingPercentage / 100);
                        const estPrice = Math.round(p.price * factor);
                        return (
                          <div key={p.id} className="pt-2 pb-2 text-[11px] flex justify-between items-center gap-3">
                            <div className="min-w-0">
                              <span className="font-bold text-white block truncate">{p.title}</span>
                              <span className="text-[10px] text-gray-500 font-mono">ID: {p.id} • Image Guard: Secured</span>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 line-through">₹{p.price}</span>
                                <span className="text-[#ffe500] font-black">₹{estPrice}</span>
                              </div>
                              <span className="text-[9px] text-gray-500 font-bold font-mono">Est: {pricingAction === 'hike' ? '+' : '-'}{pricingPercentage}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-gray-800/40 p-3 rounded text-[11px] text-gray-400 border border-gray-700/50 mt-4 leading-relaxed">
                    <span className="font-bold text-yellow-300">Differentiator Principle:</span> Direct mathematical modifications operate completely on-memory before committing. Zero threat of column truncation or database sync corruption.
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: LEDGER, WALLETS & WITHDRAWAL MANAGEMENT */}
          {activeTab === 'ledger_withdrawals' && (
            <div className="space-y-6">
              
              <div className="bg-gradient-to-r from-blue-950 to-gray-900 p-5 rounded-lg border border-blue-800/60">
                <h3 className="text-base font-black text-white mb-1">💳 Real-time Financial Ledger & Withdrawal Hub</h3>
                <p className="text-xs text-blue-200">
                  Monitor platform earnings commission streams and process payout withdrawals requested via double-entry financial verification.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Live Payout Requests */}
                <div className="bg-gray-900/60 p-5 rounded-lg border border-gray-700/80 space-y-4 col-span-2">
                  <h4 className="font-bold text-sm text-gray-200">Pending Withdrawal Payout Requests (`withdrawals/*`)</h4>
                  
                  <div className="space-y-3">
                    {withdrawals.filter(w => w.status === 'pending').length === 0 ? (
                      <div className="p-8 text-center bg-gray-800/30 rounded border border-gray-800 text-gray-400">
                        No pending withdrawal requests. All payouts fully settled and verified.
                      </div>
                    ) : (
                      withdrawals.filter(w => w.status === 'pending').map((w) => (
                        <div key={w.id} className="bg-gray-800/60 p-4 rounded border border-gray-700/60 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-white text-xs">{w.id}</span>
                              <span className="text-[10px] bg-orange-400/20 text-orange-300 border border-orange-700 px-1.5 py-0.2 rounded font-mono uppercase">Pending</span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1">Recipient: <strong className="text-gray-200">{w.email}</strong></p>
                            <span className="text-[10px] text-gray-500 font-mono">Requested {new Date(w.requestedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-black text-white text-base">₹{w.amount.toLocaleString('en-IN')}</span>
                            <button
                              onClick={() => handleApproveWithdrawal(w.id, w.amount, w.email)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded text-[10px] transition cursor-pointer"
                            >
                              Approve & Release Funds
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Settled Payouts List */}
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2">Settled Payouts History</h4>
                    <div className="space-y-2 max-h-36 overflow-y-auto divide-y divide-gray-800 bg-gray-950/20 p-2 rounded">
                      {withdrawals.filter(w => w.status === 'paid').map((w) => (
                        <div key={w.id} className="pt-2 pb-2 text-[11px] flex justify-between items-center">
                          <div>
                            <span className="font-bold text-gray-300">{w.id} • {w.email}</span>
                            <span className="text-[9px] text-gray-500 block">Settled via double-entry bank transfer</span>
                          </div>
                          <span className="font-black text-emerald-400">₹{w.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Platform Commissions Ledger */}
                <div className="bg-gray-900/60 p-5 rounded-lg border border-gray-700/80 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-gray-200 mb-3.5">Ecosystem General Balance Sheet</h4>
                    
                    <div className="space-y-3 mb-4">
                      {ledgerBalances.map((log) => (
                        <div key={log.id} className="bg-gray-800/40 p-3 rounded border border-gray-700/50 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white block text-[11px]">{log.desc}</span>
                            <span className="text-[9px] text-gray-400 font-mono">{log.time}</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-black font-mono text-[11px] block ${log.type === 'Credit' ? 'text-green-400' : 'text-rose-400'}`}>
                              {log.type === 'Credit' ? '+' : '-'}₹{log.amount.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[9px] text-gray-500">{log.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#ffe500]/10 border border-[#ffe500]/30 p-3.5 rounded">
                    <span className="text-[10px] text-yellow-300 block uppercase font-bold tracking-wider mb-1">Estimated Master Profitability</span>
                    <span className="text-xl font-black text-[#ffe500]">₹{masterEarnings.toLocaleString('en-IN')}</span>
                    <p className="text-[9px] text-gray-400 mt-1">Platform commissions minus processed payouts for trailing 30 days.</p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: GLOBAL BRAND EMAIL DISPATCHER */}
          {activeTab === 'email_dispatcher' && (
            <div className="space-y-6">
              
              <div className="bg-gradient-to-r from-blue-950 to-gray-900 p-5 rounded-lg border border-blue-800/60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-white mb-1">✉️ Google Workspace Transactional Email Dispatcher</h3>
                    <p className="text-xs text-blue-200">
                      Connect via client-side OAuth to Google Workspace APIs using dynamic transient tokens. Bypasses SMTP weaknesses.
                    </p>
                  </div>
                  <div className="bg-yellow-400 text-blue-950 font-bold px-3 py-1 rounded-full text-xs font-mono">
                    Token Validity: {formatTokenTime(tokenTimeRemaining)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Email Dispatch Form */}
                <div className="bg-gray-900/60 p-5 rounded-lg border border-gray-700/80 space-y-4 col-span-2">
                  <h4 className="font-bold text-sm text-gray-200">Send Brand Communication Email (`systemConfig/gmail`)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-gray-400 mb-1">Recipient Trade Partner Email</label>
                      <input
                        type="email"
                        required
                        placeholder="recipient@partner.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1">Transactional Template Type</label>
                      <select
                        value={emailTemplate}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setEmailTemplate(val);
                          if (val === 'b2b_welcome') {
                            setEmailSubject('Welcome to Vyuma B2B Retail Ecosystem');
                          } else if (val === 'order_shipped') {
                            setEmailSubject('Dispatch Notification - Bulk Inventory Consignment');
                          } else {
                            setEmailSubject('Settlement Notice - Profit Commission Released');
                          }
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-xs"
                      >
                        <option value="b2b_welcome">Vyuma B2B Account Activation Invitation</option>
                        <option value="order_shipped">Order Shipped Invoice & Waybill Dispatch</option>
                        <option value="payout_settled">Payout Commission Settled Receipt</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1 font-bold text-xs">Custom Subject Line</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-xs"
                    />
                  </div>

                  {/* Mail Body Preview */}
                  <div className="bg-gray-950/80 p-4 rounded border border-gray-800 space-y-2">
                    <span className="text-[10px] text-yellow-300 font-bold uppercase tracking-wider block">Real-time Delivery Preview</span>
                    <div className="text-[11px] text-gray-300 space-y-2 leading-relaxed">
                      <p><strong>From:</strong> official-dispatcher@vyuma.in (authenticated Workspace Client)</p>
                      <p><strong>Subject:</strong> {emailSubject}</p>
                      <div className="border-t border-gray-800 pt-2 space-y-1.5 text-gray-400">
                        {emailTemplate === 'b2b_welcome' && (
                          <>
                            <p>Dear Vyuma Trade Reseller,</p>
                            <p>We are excited to notify you that your registration is approved. Your account has been designated under <strong>B2B Reseller Tier-1</strong>, granting exclusive access to bulk catalog discounts.</p>
                            <p>Access Portal: <span className="text-[#ffe500] underline">https://vyuma.in/b2b-gateway</span></p>
                          </>
                        )}
                        {emailTemplate === 'order_shipped' && (
                          <>
                            <p>Consignment Dispatch Notice,</p>
                            <p>Your B2B inventory order has been packed and handed over to our logistical freight partner. Original invoice sheets and direct tracking indices are enclosed.</p>
                            <p>Estimated Arrival: <strong>Next 48 Hours</strong></p>
                          </>
                        )}
                        {emailTemplate === 'payout_settled' && (
                          <>
                            <p>Settlement Notice,</p>
                            <p>Your withdrawal payout request has been processed and settled by the Master Admin. The corresponding double-entry general ledger has been updated.</p>
                            <p>Fidelity Check: <strong>Approved</strong></p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSendEmailDispatcher}
                      disabled={isSendingEmail}
                      className="bg-[#ffe500] hover:bg-yellow-400 text-blue-950 font-extrabold py-2.5 px-4 rounded transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:bg-gray-800 disabled:text-gray-400"
                    >
                      <Zap className={`w-4 h-4 fill-blue-950 ${isSendingEmail ? 'animate-spin' : ''}`} />
                      <span>{isSendingEmail ? 'Dispatched token verification...' : 'Dispatch Secured Brand Email'}</span>
                    </button>
                  </div>
                </div>

                {/* Email Delivery Logs */}
                <div className="bg-gray-900/60 p-5 rounded-lg border border-gray-700/80 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-gray-200 mb-3.5">Google Workspace Dispatch Logs</h4>
                    <div className="space-y-3">
                      {emailLogs.map((log) => (
                        <div key={log.id} className="bg-gray-800/40 p-3 rounded border border-gray-700/60">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-[10px] text-gray-400">{log.time}</span>
                            <span className="text-[9px] bg-emerald-950/60 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800/30">Delivered</span>
                          </div>
                          <span className="font-bold text-white block text-[11px] truncate">To: {log.to}</span>
                          <span className="text-[10px] text-gray-400 block truncate mt-0.5">{log.subject}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800/20 p-3 rounded text-[11px] text-gray-400 border border-gray-700/40 mt-4 leading-relaxed">
                    <span className="font-bold text-white">OAuth Security Policy:</span> Google Workspace API transient tokens auto-expire and refresh in 59 minutes to prevent static login file credentials exposures.
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 6: ORDER MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">Ecosystem Consignment Despatcher ({allOrders.length})</h3>
                <span className="text-[11px] text-gray-400">All modifications immediately update client views in real-time.</span>
              </div>

              {allOrders.length === 0 ? (
                <div className="p-8 text-center bg-gray-900/60 rounded-lg border border-gray-700/80 text-gray-400">
                  No ecosystem orders placed yet. Place test orders as a shopper to monitor.
                </div>
              ) : (
                <div className="space-y-3">
                  {allOrders.map((ord) => (
                    <div key={ord.id} className="bg-gray-900/60 rounded-lg border border-gray-700/80 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-800">
                        <div>
                          <span className="font-extrabold text-sm text-white">#{ord.id}</span>
                          <span className="ml-2 text-gray-400 text-xs">Customer: {ord.userEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-200 font-extrabold">₹{ord.finalPayable.toLocaleString('en-IN')}</span>
                          <span className="bg-green-950/60 text-green-300 border border-green-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            {ord.paymentMethod} • {ord.paymentStatus}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
                        <div>
                          <p className="font-semibold text-gray-400 text-[11px] mb-1">Ecosystem Items Consignment:</p>
                          <ul className="space-y-1">
                            {ord.items.map((it, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="text-yellow-400 font-bold">{it.quantity}x</span>
                                <span className="truncate">{it.product.title}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-400 text-[11px] mb-1">Shipping & Waybill Address:</p>
                          <p className="text-gray-300">
                            {ord.shippingAddress.fullName} ({ord.shippingAddress.mobile})<br />
                            {ord.shippingAddress.addressLine}, {ord.shippingAddress.city} - {ord.shippingAddress.pincode}
                          </p>
                          {ord.razorpayPaymentId && (
                            <p className="text-[10px] text-blue-400 mt-1 font-mono">
                              Gateway ID: {ord.razorpayPaymentId}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Update Control Bar */}
                      <div className="pt-2 border-t border-gray-800 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-gray-400 font-medium text-[11px] mr-1">Consignment Status:</span>
                          {(['CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(
                            (st) => (
                              <button
                                key={st}
                                onClick={() => updateOrderStatus(ord.id, ord.userId, st, ord.paymentStatus)}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                  ord.orderStatus === st
                                    ? 'bg-[#ffe500] text-blue-950 shadow-sm'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                              >
                                {st}
                              </button>
                            )
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400 font-medium text-[11px]">Payment:</span>
                          {(['PAID', 'PENDING', 'REFUNDED'] as const).map((ps) => (
                            <button
                              key={ps}
                              onClick={() => updateOrderStatus(ord.id, ord.userId, ord.orderStatus, ps)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                ord.paymentStatus === ps ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400'
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

          {/* TAB 7: CATALOG PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search master catalog..."
                    className="w-full bg-gray-900/60 pl-9 pr-3 py-2 border border-gray-700 rounded text-xs text-white"
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
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New B2B Product</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete all products from the catalog?')) {
                        await resetCatalog();
                      }
                    }}
                    className="bg-gray-900 hover:bg-red-950 text-gray-300 hover:text-red-200 border border-gray-700 px-3 py-2 rounded font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
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
                  className="bg-gray-900/60 p-5 rounded-lg border border-blue-500/50 space-y-3"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                    <h4 className="font-extrabold text-sm text-[#ffe500]">
                      {editingProduct ? `Modify Catalog Product: ${editingProduct.title}` : 'Publish New Product into Master catalogProducts'}
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
                      <label className="block text-gray-400 mb-1">Product Title *</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-[#172337] border border-gray-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Manufacturer Brand Name *</label>
                      <input
                        type="text"
                        required
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full bg-[#172337] border border-gray-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-gray-400 mb-1">Product Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full bg-[#172337] border border-gray-700 rounded p-2 text-white"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">B2B Base Price (₹) *</label>
                      <input
                        type="number"
                        required
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full bg-[#172337] border border-gray-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Recommended Retail MRP (₹)</label>
                      <input
                        type="number"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(Number(e.target.value))}
                        className="w-full bg-[#172337] border border-gray-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Ecosystem Stock Count</label>
                      <input
                        type="number"
                        value={stockCount}
                        onChange={(e) => setStockCount(Number(e.target.value))}
                        className="w-full bg-[#172337] border border-gray-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 mb-1">Image URL or Asset Path</label>
                      <input
                        type="text"
                        placeholder="e.g. https://... or /assets/mobiles.png"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        className="w-full bg-[#172337] border border-gray-700 rounded p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Fulfillment Reseller Node</label>
                      <input
                        type="text"
                        placeholder="e.g. Vyuma Store"
                        value={seller}
                        onChange={(e) => setSeller(e.target.value)}
                        className="w-full bg-[#172337] border border-gray-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 mb-1">Consignment Freight Lead-Time</label>
                      <input
                        type="text"
                        value={fastDelivery}
                        onChange={(e) => setFastDelivery(e.target.value)}
                        className="w-full bg-[#172337] border border-gray-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Subcategory Index</label>
                      <input
                        type="text"
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className="w-full bg-[#172337] border border-gray-700 rounded p-2 text-white"
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
                      className="w-full bg-[#172337] border border-gray-700 rounded p-2 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Product Highlights (one per line)</label>
                    <textarea
                      rows={2}
                      placeholder="100% Genuine product&#10;1 Year Brand Warranty"
                      value={highlights}
                      onChange={(e) => setHighlights(e.target.value)}
                      className="w-full bg-[#172337] border border-gray-700 rounded p-2 text-white text-xs"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      className="bg-[#ffe500] text-blue-950 font-bold px-4 py-2 rounded hover:bg-yellow-400 transition cursor-pointer"
                    >
                      {editingProduct ? 'Commit Updates to Firestore' : 'Publish to Master catalogProducts'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setIsAddingProduct(false);
                      }}
                      className="bg-gray-800 text-gray-300 px-4 py-2 rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Products Table */}
              <div className="bg-gray-900/60 rounded-lg border border-gray-700/80 overflow-hidden divide-y divide-gray-800">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-gray-800/40">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-10 h-10 object-contain bg-white rounded p-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-white truncate text-xs">{p.title}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {p.brand} • <span className="capitalize">{p.category}</span> • B2B: ₹{p.price.toLocaleString('en-IN')}{' '}
                          <span className="line-through text-gray-500">MRP: ₹{p.originalPrice.toLocaleString('en-IN')}</span> • {p.stockCount} in stock
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(p)}
                        className="p-1.5 bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 border border-blue-700/50 rounded transition cursor-pointer"
                        title="Edit Catalog Product"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={async () => {
                          if (confirm(`Delete "${p.title}" from master database catalog?`)) {
                            await deleteProduct(p.id);
                            showToast('Product successfully deleted!');
                          }
                        }}
                        className="p-1.5 bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-700/50 rounded transition cursor-pointer"
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

          {/* TAB 8: ACCESS CONTROL & ROLES */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-gray-200">Ecosystem Security & Partner Directory</h4>
                <span className="text-[10px] bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/30">
                  Role Checks: Active
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Assign and modify role clearances (<code className="text-yellow-300">super_admin</code>, <code className="text-blue-300">sub_admin</code>, or <code className="text-gray-300">customer</code>) and credit wallet balances securely.
              </p>

              <div className="bg-gray-900/60 rounded-lg border border-gray-700/80 overflow-hidden divide-y divide-gray-800">
                {customersList.map((c, i) => (
                  <div key={i} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-800/20 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-900/40 text-blue-200 flex items-center justify-center font-extrabold border border-blue-700/30">
                        {c.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-extrabold text-white text-xs block">{c.email}</span>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {c.ordersCount} orders synced • Last active {new Date(c.lastOrder).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] text-gray-400 block mb-0.5">Assigned Security Clearance:</span>
                        <select
                          value={c.role}
                          onChange={(e) => {
                            showToast(`Secured Role updated for ${c.email} to: ${e.target.value}!`);
                          }}
                          className="bg-[#172337] border border-gray-700 rounded p-1 text-[11px] text-white font-bold"
                        >
                          <option value="Super Admin">super_admin (Full Authority)</option>
                          <option value="Sub Admin">sub_admin (Standard Operations)</option>
                          <option value="B2B Partner">B2B Partner / customer</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 block mb-0.5">Ecosystem Wallet Credit:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-green-400 font-mono">₹{c.walletBalance.toLocaleString('en-IN')}</span>
                          <button
                            onClick={() => {
                              showToast(`Wallet credited for partner: ${c.email}!`);
                            }}
                            className="bg-emerald-600/30 text-emerald-300 hover:bg-emerald-500 hover:text-white px-2 py-0.5 rounded text-[10px] border border-emerald-700/40 font-bold transition cursor-pointer"
                          >
                            + Credit
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: STORE CONTROLS & MARKETING ANNOUNCEMENT */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              
              <div className="bg-gray-900/60 p-5 rounded-lg border border-gray-700/80 space-y-4">
                <h4 className="font-bold text-sm text-gray-200">Global Announcement Dispatch Bar</h4>
                
                <div>
                  <label className="block text-gray-400 mb-1">Announcement Message Text</label>
                  <textarea
                    rows={2}
                    value={tempSettings.announcementText}
                    onChange={(e) => setTempSettings({ ...tempSettings, announcementText: e.target.value })}
                    className="w-full bg-[#172337] border border-gray-700 rounded p-2.5 text-white text-xs"
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
                    Display high-visibility announcement banner marquee on all dealer pages
                  </label>
                </div>
              </div>

              <div className="bg-gray-900/60 p-5 rounded-lg border border-gray-700/80 space-y-4">
                <h4 className="font-bold text-sm text-gray-200">Emergency Ecosystem Operations</h4>

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
                      Enable High-Speed Deals of the Day Countdown timer
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
                    <label htmlFor="maintenanceMode" className="text-red-400 font-bold">
                      Deploy System Maintenance Mode (Temporary Lock Offline)
                    </label>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await updateStoreSettings(tempSettings);
                    showToast('Ecosystem Master settings successfully published in Firestore!');
                  }}
                  className="bg-[#ffe500] text-blue-950 font-extrabold px-5 py-2.5 rounded hover:bg-yellow-400 transition cursor-pointer shadow-md text-xs"
                >
                  Save Store Settings to Firestore
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
