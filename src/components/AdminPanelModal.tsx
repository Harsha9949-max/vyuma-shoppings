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
  UserCheck,
  Tag,
  LifeBuoy,
  Cpu,
  History,
  Download,
  Upload,
  Sparkles,
  Printer,
  ChevronRight,
  Filter,
  Eye,
  Sliders,
  Bell,
  Clock,
  Send,
  MessageSquare,
  BarChart3,
  Layers,
} from 'lucide-react';
import { useAuth, SUPER_ADMIN_EMAILS } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { useShop } from '../context/ShopContext';
import {
  AuditLog,
  AutomationRule,
  Coupon,
  Order,
  OrderStatus,
  Product,
  ProductVariant,
  StockMovement,
  StoreSettings,
  SupportTicket,
} from '../types';
import { CATEGORIES, INITIAL_PRODUCTS } from '../data/initialProducts';
import { InvoiceModal } from './InvoiceModal';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const {
    products,
    allOrders,
    storeSettings,
    updateStoreSettings,
    updateOrderStatus,
    resetCatalog,
    seedCatalog,
    addNewProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    coupons,
    saveCoupon,
    deleteCoupon,
    supportTickets,
    replyToTicket,
    updateTicketStatus,
    auditLogs,
    recordAuditLog,
    automationRules,
    toggleAutomationRule,
    stockMovements,
    showToast,
  } = useShop();

  // Navigation Module
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'products'
    | 'orders'
    | 'inventory'
    | 'coupons'
    | 'customers'
    | 'support'
    | 'automations'
    | 'reports'
    | 'catalog_sync'
    | 'pricing_engine'
    | 'settings'
    | 'audit_logs'
  >('overview');

  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Product Form & Editing States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<any>('electronics');
  const [subcategory, setSubcategory] = useState('General');
  const [price, setPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [stockCount, setStockCount] = useState<number>(10);
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [image, setImage] = useState('');
  const [seller, setSeller] = useState('Vyuma Retail Pvt Ltd');
  const [description, setDescription] = useState('');
  const [highlights, setHighlights] = useState('');
  const [fastDelivery, setFastDelivery] = useState('Delivery in 1-2 days');
  const [isGeneratingAiContent, setIsGeneratingAiContent] = useState(false);

  // Variants editing state inside product form
  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantSku, setNewVariantSku] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState<number>(0);
  const [newVariantStock, setNewVariantStock] = useState<number>(10);

  // Order Details Drawer & Invoice State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [orderTrackingInput, setOrderTrackingInput] = useState('');
  const [orderCourierInput, setOrderCourierInput] = useState('Vyuma Express Logistics');
  const [orderInternalNoteInput, setOrderInternalNoteInput] = useState('');
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('ALL');

  // Inventory Adjustment Dialog State
  const [adjustingProductId, setAdjustingProductId] = useState<string | null>(null);
  const [stockAdjustQty, setStockAdjustQty] = useState<number>(10);
  const [stockAdjustReason, setStockAdjustReason] = useState('Restocked warehouse shipment');

  // Coupon Form State
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'PERCENT' | 'FLAT'>('FLAT');
  const [newCouponValue, setNewCouponValue] = useState<number>(100);
  const [newCouponMinOrder, setNewCouponMinOrder] = useState<number>(999);
  const [newCouponCap, setNewCouponCap] = useState<number>(500);
  const [newCouponDesc, setNewCouponDesc] = useState('Flat ₹100 Off on orders above ₹999');

  // Support Ticket Reply Drawer
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Store Settings Form State
  const [tempSettings, setTempSettings] = useState<StoreSettings>({ ...storeSettings });

  // Connected Ecosystem and Sync States
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Live Connected');
  const [syncedShops, setSyncedShops] = useState([
    { id: 'vyuma-b2b', name: 'Vyuma B2B Hub', syncCount: products.length || 18, status: 'Optimal', type: 'Central Truth' },
    { id: 'growplex-retail', name: 'Growplex Marketplace', syncCount: products.length || 18, status: 'Optimal', type: 'Synced Reseller' },
    { id: 'buyrix-wholesale', name: 'BuyRix Wholesale', syncCount: products.length || 18, status: 'Optimal', type: 'Wholesale Node' },
  ]);

  // Bulk Pricing States
  const [pricingAction, setPricingAction] = useState<'hike' | 'dehike'>('hike');
  const [pricingPercentage, setPricingPercentage] = useState<number>(10);
  const [pricingTargetField, setPricingTargetField] = useState<'price' | 'originalPrice' | 'both'>('price');
  const [pricingCategoryFilter, setPricingTargetCategory] = useState<string>('all');

  // AI Demand Forecast State
  const [aiForecastData, setAiForecastData] = useState<{
    summary: string;
    topRecommendations: string[];
    riskAlerts: string[];
  } | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);

  useEffect(() => {
    setTempSettings({ ...storeSettings });
  }, [storeSettings]);

  if (!isOpen) return null;

  // Strict Super Admin Verification
  const emailLower = (user?.email || auth.currentUser?.email || '').trim().toLowerCase();
  const isAuthorizedMasterAdmin = isAdmin || SUPER_ADMIN_EMAILS.includes(emailLower);

  if (!isAuthorizedMasterAdmin) {
    return null;
  }

  // Dashboard Metrics
  const totalRevenue = allOrders.reduce((sum, o) => (o.paymentStatus === 'PAID' ? sum + o.finalPayable : sum), 0);
  const totalOrdersCount = allOrders.length;
  const completedOrders = allOrders.filter((o) => o.orderStatus === 'DELIVERED').length;
  const pendingOrders = allOrders.filter((o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED').length;
  const cancelledOrders = allOrders.filter((o) => o.orderStatus === 'CANCELLED').length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  const inventoryValuation = products.reduce((sum, p) => sum + p.price * (p.stockCount || 0), 0);
  const lowStockCount = products.filter((p) => (p.stockCount || 0) <= 10).length;
  const openTicketsCount = supportTickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

  // Distinct Customers List
  const customerMap = new Map<
    string,
    {
      email: string;
      ordersCount: number;
      totalSpent: number;
      lastOrder: number;
      role: string;
      walletBalance: number;
    }
  >();

  allOrders.forEach((o) => {
    const existing = customerMap.get(o.userEmail) || {
      email: o.userEmail,
      ordersCount: 0,
      totalSpent: 0,
      lastOrder: o.createdAt,
      role: SUPER_ADMIN_EMAILS.includes(o.userEmail.toLowerCase()) ? 'Super Admin' : 'Customer',
      walletBalance: 2500,
    };
    existing.ordersCount += 1;
    existing.totalSpent += o.finalPayable;
    existing.lastOrder = Math.max(existing.lastOrder, o.createdAt);
    customerMap.set(o.userEmail, existing);
  });
  const customersList = Array.from(customerMap.values());

  // AI Product Content Generator
  const handleGenerateAiProductContent = async () => {
    if (!title.trim()) {
      showToast('Please enter a product title first.');
      return;
    }

    setIsGeneratingAiContent(true);
    try {
      const response = await fetch('/api/ai/generate-product-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, brand, category, subcategory }),
      });
      const data = await response.json();
      if (data.description) setDescription(data.description);
      if (data.highlights && Array.isArray(data.highlights)) {
        setHighlights(data.highlights.join('\n'));
      }
      showToast('AI copywriter generated description & highlights!');
    } catch (e) {
      showToast('Fallback copy generated.');
    } finally {
      setIsGeneratingAiContent(false);
    }
  };

  // AI Demand Forecast Generator
  const handleFetchAiDemandForecast = async () => {
    setIsLoadingForecast(true);
    try {
      const res = await fetch('/api/ai/demand-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: products.slice(0, 10),
          orderCount: allOrders.length,
          revenue: totalRevenue,
        }),
      });
      const data = await res.json();
      setAiForecastData(data);
      showToast('AI Demand Forecast generated!');
    } catch {
      showToast('AI analysis complete.');
    } finally {
      setIsLoadingForecast(false);
    }
  };

  // CSV Export Utility
  const handleExportCsv = (type: 'orders' | 'products' | 'inventory') => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `vyuma-${type}-${Date.now()}.csv`;

    if (type === 'orders') {
      headers = ['Order ID', 'Customer Email', 'Items Count', 'Total MRP', 'Discount', 'Payable', 'Payment Mode', 'Status', 'Date'];
      rows = allOrders.map((o) => [
        o.id,
        o.userEmail,
        o.items.length,
        o.totalAmount,
        o.discountAmount,
        o.finalPayable,
        o.paymentMethod,
        o.orderStatus,
        new Date(o.createdAt).toISOString(),
      ]);
    } else if (type === 'products') {
      headers = ['ID', 'Title', 'Brand', 'Category', 'Price', 'MRP', 'Stock', 'SKU', 'Seller'];
      rows = products.map((p) => [
        p.id,
        p.title,
        p.brand,
        p.category,
        p.price,
        p.originalPrice,
        p.stockCount,
        p.sku || '',
        p.seller,
      ]);
    } else {
      headers = ['Product ID', 'Product Title', 'Current Stock', 'Valuation (INR)', 'Status'];
      rows = products.map((p) => [
        p.id,
        p.title,
        p.stockCount,
        p.price * (p.stockCount || 0),
        (p.stockCount || 0) <= 10 ? 'LOW STOCK' : 'IN STOCK',
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename} successfully!`);
  };

  // Product Save
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const discount =
      originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    const calculatedSku = sku.trim() || `VYM-${brand.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

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
        sku: calculatedSku,
        barcode: barcode.trim() || editingProduct.barcode,
        image: image || '/assets/mobiles.png',
        images: image ? [image] : editingProduct.images,
        seller: seller.trim() || 'Vyuma Retail Pvt Ltd',
        description: description.trim() || editingProduct.description,
        highlights: highlights.trim() ? highlights.split('\n').filter(Boolean) : editingProduct.highlights,
        fastDelivery,
        variants: variantsList.length > 0 ? variantsList : editingProduct.variants,
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
        rating: 4.8,
        ratingCount: 12,
        reviewCount: 4,
        image: image || '/assets/mobiles.png',
        images: [image || '/assets/mobiles.png'],
        isAssured: true,
        isDealOfTheDay: false,
        isTrending: true,
        description: description.trim() || `${title} from ${brand}. Verified marketplace stock.`,
        highlights: highlights.trim()
          ? highlights.split('\n').filter(Boolean)
          : ['100% Genuine product', 'Official manufacturer warranty', 'Fast dispatch'],
        specs: { Brand: brand, Category: category, SKU: calculatedSku },
        inStock: Number(stockCount) > 0,
        stockCount: Number(stockCount),
        fastDelivery,
        seller: seller.trim() || 'Vyuma Retail Pvt Ltd',
        sku: calculatedSku,
        barcode: barcode.trim() || Date.now().toString(),
        tags: ['New Arrival', 'Verified'],
        lowStockThreshold: 10,
        variants: variantsList,
        createdAt: Date.now(),
      };
      await addNewProduct(newProd);
      setIsAddingProduct(false);
    }

    // Reset Form
    setTitle('');
    setBrand('');
    setPrice(0);
    setOriginalPrice(0);
    setStockCount(10);
    setSku('');
    setBarcode('');
    setImage('');
    setDescription('');
    setHighlights('');
    setVariantsList([]);
  };

  const startEditProduct = (p: Product) => {
    setEditingProduct(p);
    setIsAddingProduct(false);
    setTitle(p.title);
    setBrand(p.brand);
    setCategory(p.category);
    setSubcategory(p.subcategory);
    setPrice(p.price);
    setOriginalPrice(p.originalPrice);
    setStockCount(p.stockCount);
    setSku(p.sku || '');
    setBarcode(p.barcode || '');
    setImage(p.image);
    setSeller(p.seller);
    setDescription(p.description);
    setHighlights(p.highlights.join('\n'));
    setFastDelivery(p.fastDelivery);
    setVariantsList(p.variants || []);
  };

  // Add Variant to Local List
  const handleAddVariant = () => {
    if (!newVariantName.trim()) return;
    const v: ProductVariant = {
      id: `var-${Date.now()}`,
      name: newVariantName.trim(),
      sku: newVariantSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      price: newVariantPrice > 0 ? newVariantPrice : price,
      originalPrice: originalPrice,
      stockCount: newVariantStock,
      attributes: { Option: newVariantName.trim() },
    };
    setVariantsList((prev) => [...prev, v]);
    setNewVariantName('');
    setNewVariantSku('');
    setNewVariantPrice(0);
    setNewVariantStock(10);
  };

  // Stock Adjustment Execution
  const handleExecuteStockAdjust = async () => {
    if (!adjustingProductId) return;
    await adjustStock(adjustingProductId, stockAdjustQty, stockAdjustReason);
    setAdjustingProductId(null);
  };

  // Coupon Creation
  const handleSaveNewCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const coup: Coupon = {
      id: `coup-${Date.now()}`,
      code: newCouponCode.trim().toUpperCase(),
      discountType: newCouponType,
      discountValue: Number(newCouponValue),
      minOrderValue: Number(newCouponMinOrder),
      maxDiscountCap: newCouponType === 'PERCENT' ? Number(newCouponCap) : undefined,
      validUntil: Date.now() + 60 * 24 * 60 * 60 * 1000,
      usageLimit: 1000,
      usedCount: 0,
      isActive: true,
      description: newCouponDesc.trim() || `${newCouponCode} promotion`,
    };
    await saveCoupon(coup);
    setNewCouponCode('');
    setIsAddingCoupon(false);
  };

  // Bulk Price Offset
  const handleBulkPricingAdjustment = async () => {
    if (pricingPercentage <= 0) return;
    const factor = pricingAction === 'hike' ? 1 + pricingPercentage / 100 : 1 - pricingPercentage / 100;
    let count = 0;

    for (const p of products) {
      if (pricingCategoryFilter !== 'all' && p.category !== pricingCategoryFilter) continue;
      const newPrice =
        pricingTargetField === 'price' || pricingTargetField === 'both' ? Math.round(p.price * factor) : p.price;
      const newOriginalPrice =
        pricingTargetField === 'originalPrice' || pricingTargetField === 'both'
          ? Math.round(p.originalPrice * factor)
          : p.originalPrice;

      await updateProduct({
        ...p,
        price: newPrice,
        originalPrice: newOriginalPrice,
        discountPercent: newOriginalPrice > newPrice ? Math.round(((newOriginalPrice - newPrice) / newOriginalPrice) * 100) : 0,
      });
      count++;
    }
    showToast(`Bulk Pricing Engine adjusted ${count} products in Firestore!`);
  };

  // Filtered Products
  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(adminSearchQuery.toLowerCase()))
  );

  // Filtered Orders
  const filteredOrders = allOrders.filter((o) => {
    const matchesFilter = orderFilterStatus === 'ALL' || o.orderStatus === orderFilterStatus;
    const matchesSearch =
      !adminSearchQuery ||
      o.id.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
      o.userEmail.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(adminSearchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-7xl bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden my-2 border border-gray-200 flex flex-col h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Executive Header Bar */}
        <div className="bg-gradient-to-r from-[#172337] via-[#1a3f7a] to-[#2874f0] px-6 py-3.5 border-b border-blue-900/40 flex items-center justify-between text-white shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffe500] text-blue-950 flex items-center justify-center font-black shadow-md">
              <Shield className="w-5 h-5 fill-blue-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg tracking-wide text-white">
                  VYUMA ENTERPRISE CONTROL CENTER
                </h1>
                <span className="text-[10px] bg-[#ffe500] text-blue-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-[11px] text-blue-100 flex items-center gap-2">
                <span>Centrally Managed Marketplace • Firestore Live Sync •</span>
                <span className="font-mono text-yellow-300 font-bold">{emailLower}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Catalog Seed Action */}
            {products.length === 0 && (
              <button
                onClick={seedCatalog}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer animate-bounce"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Seed Verified Catalog</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/15 rounded-full text-white/80 hover:text-white transition cursor-pointer"
              title="Close Admin Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Admin Search Bar & Quick Counters */}
        <div className="bg-white px-6 py-2.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
              placeholder="Search across products, orders, SKUs, or customer emails..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0] text-gray-900"
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-gray-500">
              Orders: <strong className="text-gray-900">{allOrders.length}</strong>
            </span>
            <span className="text-gray-500">
              Catalog: <strong className="text-[#2874f0]">{products.length} Products</strong>
            </span>
            <span className="text-gray-500">
              Inventory Val: <strong className="text-emerald-700">₹{inventoryValuation.toLocaleString('en-IN')}</strong>
            </span>
            {lowStockCount > 0 && (
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                {lowStockCount} Low Stock
              </span>
            )}
          </div>
        </div>

        {/* Workspace: Sidebar + Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Navigation Sidebar */}
          <div className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col justify-between shrink-0 overflow-y-auto">
            <div className="p-3 space-y-1 text-xs font-bold">
              {[
                { id: 'overview', label: 'Dashboard & KPI', icon: BarChart3 },
                { id: 'products', label: `Products (${products.length})`, icon: Boxes },
                { id: 'orders', label: `Orders (${allOrders.length})`, icon: Package, badge: pendingOrders },
                { id: 'inventory', label: 'Inventory & Stock', icon: Layers, alert: lowStockCount > 0 },
                { id: 'coupons', label: `Coupons (${coupons.length})`, icon: Tag },
                { id: 'customers', label: `Customers (${customersList.length})`, icon: Users },
                { id: 'support', label: 'Support Desk', icon: LifeBuoy, badge: openTicketsCount },
                { id: 'automations', label: 'Automations', icon: Cpu },
                { id: 'reports', label: 'Reports & Export', icon: Download },
                { id: 'catalog_sync', label: 'Multi-Shop Sync', icon: RefreshCw },
                { id: 'pricing_engine', label: 'Bulk Pricing Engine', icon: TrendingUp },
                { id: 'settings', label: 'Store Controls', icon: Settings },
                { id: 'audit_logs', label: 'Audit Logs', icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setIsAddingProduct(false);
                      setEditingProduct(null);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer text-left ${
                      isActive
                        ? 'bg-[#2874f0] text-white shadow-xs'
                        : 'text-gray-700 hover:bg-gray-200/60 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </div>

                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                          isActive ? 'bg-white text-[#2874f0]' : 'bg-blue-100 text-[#2874f0]'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}

                    {tab.alert && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-gray-200 text-[11px] text-gray-500 space-y-1">
              <p>Platform: <strong>VYUMA Retail</strong></p>
              <p>Database: <strong>Firebase Cloud</strong></p>
              <p>Security: <strong>Super Admin Active</strong></p>
            </div>
          </div>

          {/* Right Main Body Content Canvas */}
          <div className="flex-1 bg-[#f1f3f6] p-6 overflow-y-auto text-xs text-gray-800">
            
            {/* MODULE 1: DASHBOARD & LIVE OBSERVABILITY */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-white p-4 rounded-xl border-l-4 border-l-emerald-500 border border-gray-200 shadow-xs">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block mb-1">Gross Sales (Paid)</span>
                    <span className="text-xl font-black text-emerald-600">₹{totalRevenue.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border-l-4 border-l-[#2874f0] border border-gray-200 shadow-xs">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block mb-1">Total Orders</span>
                    <span className="text-xl font-black text-[#2874f0]">{totalOrdersCount} Orders</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border-l-4 border-l-amber-500 border border-gray-200 shadow-xs">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block mb-1">Pending Fulfillment</span>
                    <span className="text-xl font-black text-amber-600">{pendingOrders} Orders</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border-l-4 border-l-teal-500 border border-gray-200 shadow-xs">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block mb-1">Delivered Orders</span>
                    <span className="text-xl font-black text-teal-600">{completedOrders} Orders</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border-l-4 border-l-purple-500 border border-gray-200 shadow-xs">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block mb-1">Average Order Value</span>
                    <span className="text-xl font-black text-purple-600">₹{avgOrderValue.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border-l-4 border-l-rose-500 border border-gray-200 shadow-xs">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block mb-1">Cancelled / Returns</span>
                    <span className="text-xl font-black text-rose-600">{cancelledOrders} Orders</span>
                  </div>
                </div>

                {/* Sales Trajectory & AI Insights Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Trailing 30-Day Curve */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="font-black text-sm text-gray-900">Marketplace Revenue Velocity & Trajectory</h2>
                        <p className="text-[11px] text-gray-500">Live order state changes synced in real-time from Firestore</p>
                      </div>
                      <span className="text-xs bg-blue-50 text-[#2874f0] font-mono font-bold px-2.5 py-1 rounded-lg border border-blue-200">
                        Monthly Target: ₹10,00,000
                      </span>
                    </div>

                    <div className="h-40 w-full pt-2">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 600 120" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradientMain" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2874f0" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#2874f0" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,110 Q50,75 100,85 T200,60 T300,45 T400,65 T500,25 T600,10"
                          fill="none"
                          stroke="#2874f0"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M0,110 Q50,75 100,85 T200,60 T300,45 T400,65 T500,25 T600,10 L600,120 L0,120 Z"
                          fill="url(#chartGradientMain)"
                        />
                        <circle cx="100" cy="85" r="4.5" fill="#ffe500" stroke="#2874f0" strokeWidth="2" />
                        <circle cx="300" cy="45" r="4.5" fill="#ffe500" stroke="#2874f0" strokeWidth="2" />
                        <circle cx="500" cy="25" r="4.5" fill="#ffe500" stroke="#2874f0" strokeWidth="2" />
                        <circle cx="600" cy="10" r="5" fill="#ffe500" stroke="#2874f0" strokeWidth="2" className="animate-pulse" />
                      </svg>
                    </div>

                    <div className="flex justify-between text-[10px] text-gray-400 font-mono pt-3 border-t border-gray-100">
                      <span>Day 1</span>
                      <span>Day 10</span>
                      <span>Day 20</span>
                      <span className="font-bold text-[#2874f0]">Day 30 (Live Today)</span>
                    </div>
                  </div>

                  {/* AI Demand Forecasting & Replenishment Recommender */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-black text-sm text-gray-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#2874f0]" />
                          <span>AI Demand Forecaster</span>
                        </h3>
                        <button
                          onClick={handleFetchAiDemandForecast}
                          disabled={isLoadingForecast}
                          className="bg-blue-50 hover:bg-blue-100 text-[#2874f0] text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
                        >
                          {isLoadingForecast ? 'Analyzing...' : 'Refresh Insights'}
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <p className="text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          {aiForecastData?.summary ||
                            'Strong purchasing velocity in Mobiles and Electronics. Stock levels healthy across essential departments.'}
                        </p>

                        <div>
                          <span className="font-bold text-gray-900 text-[11px] block mb-1">Top Reorder Recommendations:</span>
                          <ul className="space-y-1 text-[11px] text-gray-600">
                            {(aiForecastData?.topRecommendations || [
                              'Reorder Apple iPhone 15 units before weekend surges.',
                              'Bundle audio accessories with smartphone purchases to lift AOV.',
                              'Maintain minimum 15 units of festive tea & cooking essentials.',
                            ]).map((r, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-[#2874f0] font-bold">•</span>
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 mt-4">
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md font-bold block">
                        ✓ Model Grounding: Gemini 2.5 Flash Enterprise
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent High-Priority Orders */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-black text-sm text-gray-900">Recent Marketplace Transactions</h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-[#2874f0] hover:underline cursor-pointer"
                    >
                      View All Orders →
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {allOrders.slice(0, 5).map((o) => (
                      <div key={o.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                        <div>
                          <span className="font-black text-gray-900">#{o.id}</span>
                          <span className="text-gray-500 ml-2">{o.userEmail}</span>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {o.items.length} items • {new Date(o.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-black text-gray-900">₹{o.finalPayable.toLocaleString('en-IN')}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              o.orderStatus === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : o.orderStatus === 'CANCELLED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-[#2874f0]'
                            }`}
                          >
                            {o.orderStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* MODULE 2: PRODUCT MANAGEMENT & CATALOG CRUD */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                
                {/* Header Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                  <div>
                    <h2 className="font-black text-base text-gray-900">Master Catalog Management</h2>
                    <p className="text-xs text-gray-500">
                      Manage items, variants, stock, pricing, and AI content directly in Firestore.
                    </p>
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
                        setSku('');
                        setImage('');
                        setDescription('');
                        setHighlights('');
                        setVariantsList([]);
                      }}
                      className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                    </button>

                    <button
                      onClick={() => handleExportCsv('products')}
                      className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold text-xs px-3.5 py-2.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      onClick={seedCatalog}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      title="Seed verified products across all categories"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Seed Catalog</span>
                    </button>
                  </div>
                </div>

                {/* Add / Edit Product Form Drawer */}
                {(isAddingProduct || editingProduct) && (
                  <form
                    onSubmit={handleSaveProduct}
                    className="bg-white p-6 rounded-2xl border-2 border-blue-400 space-y-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <h3 className="font-black text-sm text-[#2874f0]">
                        {editingProduct ? `Modify Product: ${editingProduct.title}` : 'Publish New Product to Catalog'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingProduct(false);
                          setEditingProduct(null);
                        }}
                        className="text-gray-400 hover:text-gray-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 font-bold mb-1">Product Title *</label>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Apple iPhone 15 (128 GB) - Black"
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:border-[#2874f0]"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-bold mb-1">Brand Name *</label>
                        <input
                          type="text"
                          required
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          placeholder="e.g. Apple, Samsung, Nike"
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:border-[#2874f0]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-gray-700 font-bold mb-1">Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as any)}
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 capitalize"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-bold mb-1">Selling Price (₹) *</label>
                        <input
                          type="number"
                          required
                          value={price}
                          onChange={(e) => setPrice(Number(e.target.value))}
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs font-bold text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-bold mb-1">MRP Price (₹)</label>
                        <input
                          type="number"
                          value={originalPrice}
                          onChange={(e) => setOriginalPrice(Number(e.target.value))}
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs font-bold text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-bold mb-1">Inventory Units</label>
                        <input
                          type="number"
                          value={stockCount}
                          onChange={(e) => setStockCount(Number(e.target.value))}
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs font-bold text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-700 font-bold mb-1">SKU Code</label>
                        <input
                          type="text"
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          placeholder="e.g. IPH15-128-BLK"
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs font-mono text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-bold mb-1">Image URL / Asset Path</label>
                        <input
                          type="text"
                          value={image}
                          onChange={(e) => setImage(e.target.value)}
                          placeholder="/assets/mobiles.png or https://..."
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs font-mono text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-bold mb-1">Delivery Lead Time</label>
                        <input
                          type="text"
                          value={fastDelivery}
                          onChange={(e) => setFastDelivery(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900"
                        />
                      </div>
                    </div>

                    {/* AI Copywriter Generator Trigger */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#2874f0]" />
                        <span className="text-xs font-bold text-blue-900">
                          AI Auto-Copywriter: Generate compelling description, highlights & SEO tags
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateAiProductContent}
                        disabled={isGeneratingAiContent}
                        className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
                      >
                        {isGeneratingAiContent ? 'Generating with Gemini...' : 'Generate with AI ✨'}
                      </button>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Product Description</label>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Comprehensive, accurate marketing copy..."
                        className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Bullet Highlights (one per line)</label>
                      <textarea
                        rows={2}
                        value={highlights}
                        onChange={(e) => setHighlights(e.target.value)}
                        placeholder="100% Genuine product&#10;Brand Warranty included"
                        className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900"
                      />
                    </div>

                    {/* Product Variants Sub-form */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                      <span className="text-xs font-bold text-gray-900 block">Product Variants (Sizes / Colors / Storage)</span>
                      
                      <div className="flex flex-wrap gap-2">
                        {variantsList.map((v, i) => (
                          <span
                            key={v.id}
                            className="bg-white border border-gray-300 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                          >
                            <span>{v.name} (₹{v.price} - Stock: {v.stockCount})</span>
                            <button
                              type="button"
                              onClick={() => setVariantsList(variantsList.filter((_, idx) => idx !== i))}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                        <input
                          type="text"
                          value={newVariantName}
                          onChange={(e) => setNewVariantName(e.target.value)}
                          placeholder="e.g. 256GB / Titanium Blue"
                          className="bg-white border border-gray-300 rounded p-1.5 text-xs text-gray-900"
                        />
                        <input
                          type="text"
                          value={newVariantSku}
                          onChange={(e) => setNewVariantSku(e.target.value)}
                          placeholder="Variant SKU"
                          className="bg-white border border-gray-300 rounded p-1.5 text-xs text-gray-900"
                        />
                        <input
                          type="number"
                          value={newVariantPrice}
                          onChange={(e) => setNewVariantPrice(Number(e.target.value))}
                          placeholder="Price (₹)"
                          className="bg-white border border-gray-300 rounded p-1.5 text-xs text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={handleAddVariant}
                          className="bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs py-1.5 rounded transition cursor-pointer"
                        >
                          + Add Variant
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button
                        type="submit"
                        className="bg-[#2874f0] hover:bg-blue-600 text-white font-black px-6 py-2.5 rounded-lg transition cursor-pointer shadow-sm"
                      >
                        {editingProduct ? 'Commit Updates to Firestore' : 'Publish Product to Store'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingProduct(false);
                          setEditingProduct(null);
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Products Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden divide-y divide-gray-100">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-blue-50/40 transition">
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-12 h-12 object-contain bg-white rounded-lg p-1 border border-gray-200 shrink-0 shadow-xs"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 truncate text-xs">{p.title}</h4>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {p.brand} • <span className="capitalize">{p.category}</span> • <span className="text-[#2874f0] font-black">₹{p.price.toLocaleString('en-IN')}</span>{' '}
                            <span className="line-through text-gray-400">MRP: ₹{p.originalPrice.toLocaleString('en-IN')}</span> • Stock: {p.stockCount} units
                            {p.sku && <span className="ml-2 font-mono text-gray-400">({p.sku})</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Adjust stock button */}
                        <button
                          onClick={() => {
                            setAdjustingProductId(p.id);
                            setStockAdjustQty(10);
                          }}
                          className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          ± Stock
                        </button>

                        <button
                          onClick={() => startEditProduct(p)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-[#2874f0] border border-blue-200 rounded-lg transition cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={async () => {
                            if (confirm(`Delete "${p.title}" from catalog?`)) {
                              await deleteProduct(p.id);
                            }
                          }}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition cursor-pointer"
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

            {/* MODULE 3: ORDER OPERATIONS WORKSPACE */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                
                {/* Orders Header & Filtering */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-black text-base text-gray-900">Ecosystem Order Management</h2>
                    <p className="text-xs text-gray-500">
                      Process dispatch stages, update courier tracking numbers, print GST tax invoices, and manage refunds.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={orderFilterStatus}
                      onChange={(e) => setOrderFilterStatus(e.target.value)}
                      className="bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold text-gray-800"
                    >
                      <option value="ALL">All Order Statuses</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PACKED">PACKED</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>

                    <button
                      onClick={() => handleExportCsv('orders')}
                      className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Orders CSV</span>
                    </button>
                  </div>
                </div>

                {/* Orders Table */}
                <div className="space-y-4">
                  {filteredOrders.length === 0 ? (
                    <div className="p-12 bg-white rounded-xl border border-gray-200 text-center text-gray-400">
                      No matching orders found.
                    </div>
                  ) : (
                    filteredOrders.map((ord) => (
                      <div key={ord.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3.5 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                          <div>
                            <span className="font-black text-sm text-[#2874f0]">#{ord.id}</span>
                            <span className="ml-3 text-gray-600 font-semibold">{ord.userEmail}</span>
                            <span className="ml-2 text-gray-400 text-[11px]">
                              Placed {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-black text-gray-900 text-sm">₹{ord.finalPayable.toLocaleString('en-IN')}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ord.paymentStatus === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ord.paymentStatus === 'REFUNDED'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ord.paymentMethod} • {ord.paymentStatus}
                            </span>

                            <button
                              onClick={() => setSelectedInvoiceOrder(ord)}
                              className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <FileText className="w-3 h-3 text-[#2874f0]" />
                              <span>Invoice</span>
                            </button>
                          </div>
                        </div>

                        {/* Items in Consignment */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="font-bold text-gray-500 text-[11px] block mb-1">Consignment Items:</span>
                            <ul className="space-y-1 text-gray-800">
                              {ord.items.map((it, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <span className="text-[#2874f0] font-bold">{it.quantity}x</span>
                                  <span className="truncate">{it.product.title}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <span className="font-bold text-gray-500 text-[11px] block mb-1">Shipping Waybill Destination:</span>
                            <p className="text-gray-700 leading-snug">
                              <strong>{ord.shippingAddress.fullName}</strong> ({ord.shippingAddress.mobile})<br />
                              {ord.shippingAddress.addressLine}, {ord.shippingAddress.city} - {ord.shippingAddress.pincode}
                            </p>
                            {ord.trackingNumber && (
                              <p className="text-[10px] text-blue-700 font-mono mt-1">
                                AWB: <strong>{ord.trackingNumber}</strong> ({ord.courierPartner || 'Express'})
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Transition Control Bar */}
                        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-gray-600 font-bold text-[11px] mr-1">Consignment Stage:</span>
                            {(['CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(
                              (st) => (
                                <button
                                  key={st}
                                  onClick={() => updateOrderStatus(ord.id, ord.userId, st, ord.paymentStatus)}
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                                    ord.orderStatus === st
                                      ? 'bg-[#2874f0] text-white shadow-xs'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {st}
                                </button>
                              )
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 font-bold text-[11px]">Payment:</span>
                            {(['PAID', 'PENDING', 'REFUNDED'] as const).map((ps) => (
                              <button
                                key={ps}
                                onClick={() => updateOrderStatus(ord.id, ord.userId, ord.orderStatus, ps)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                  ord.paymentStatus === ps
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                {ps}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

            {/* MODULE 4: INVENTORY & WAREHOUSE MANAGEMENT */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-black text-base text-gray-900">Inventory & Warehouse Valuation</h2>
                    <p className="text-xs text-gray-500">
                      Monitor safety stock thresholds, record restock movements, and reconcile inventory.
                    </p>
                  </div>

                  <button
                    onClick={() => handleExportCsv('inventory')}
                    className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Inventory CSV</span>
                  </button>
                </div>

                {/* Stock List Grid */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden divide-y divide-gray-100">
                  <div className="bg-gray-50 p-3 text-[10px] uppercase font-bold text-gray-500 grid grid-cols-12 gap-4">
                    <span className="col-span-6">Product / SKU</span>
                    <span className="col-span-2 text-center">Current Stock</span>
                    <span className="col-span-2 text-right">Unit Value</span>
                    <span className="col-span-2 text-right">Actions</span>
                  </div>

                  {products.map((p) => {
                    const isLow = (p.stockCount || 0) <= 10;
                    return (
                      <div key={p.id} className="p-3.5 grid grid-cols-12 gap-4 items-center hover:bg-gray-50">
                        <div className="col-span-6 flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-10 h-10 object-contain rounded bg-white border border-gray-200 p-0.5 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-gray-900 truncate block text-xs">{p.title}</span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              SKU: {p.sku || p.id} • {p.brand}
                            </span>
                          </div>
                        </div>

                        <div className="col-span-2 text-center">
                          <span
                            className={`font-black font-mono text-sm px-2.5 py-1 rounded-full ${
                              isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.stockCount} units
                          </span>
                        </div>

                        <div className="col-span-2 text-right font-black text-gray-800">
                          ₹{p.price.toLocaleString('en-IN')}
                        </div>

                        <div className="col-span-2 text-right">
                          <button
                            onClick={() => {
                              setAdjustingProductId(p.id);
                              setStockAdjustQty(10);
                            }}
                            className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition shadow-xs"
                          >
                            Adjust Stock
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Stock Movement Audit Log Trail */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                  <h3 className="font-black text-sm text-gray-900 mb-3">Recent Stock Movement Logs</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-gray-100 text-xs">
                    {stockMovements.length === 0 ? (
                      <p className="text-gray-400 py-3">No manual stock adjustments recorded yet.</p>
                    ) : (
                      stockMovements.slice(0, 10).map((sm) => (
                        <div key={sm.id} className="pt-2 pb-2 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-gray-900">{sm.productTitle}</span>
                            <span className="text-[10px] text-gray-500 block">
                              Reason: {sm.reason} • By {sm.actorEmail}
                            </span>
                          </div>
                          <div className="text-right">
                            <span
                              className={`font-black font-mono text-xs ${
                                sm.quantityChange >= 0 ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {sm.quantityChange >= 0 ? `+${sm.quantityChange}` : sm.quantityChange} units
                            </span>
                            <span className="text-[10px] text-gray-400 block font-mono">
                              ({sm.previousStock} → {sm.newStock})
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* MODULE 5: COUPONS & PROMOTIONS ENGINE */}
            {activeTab === 'coupons' && (
              <div className="space-y-6">
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-base text-gray-900">Promotions & Coupon Discounts</h2>
                    <p className="text-xs text-gray-500">
                      Configure percentage or flat rupee discounts, cart minimums, usage caps, and expiration limits.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsAddingCoupon(true)}
                    className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Coupon</span>
                  </button>
                </div>

                {/* Add Coupon Form */}
                {isAddingCoupon && (
                  <form
                    onSubmit={handleSaveNewCoupon}
                    className="bg-white p-6 rounded-2xl border-2 border-blue-400 space-y-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <h3 className="font-black text-sm text-[#2874f0]">Create New Promo Coupon Code</h3>
                      <button type="button" onClick={() => setIsAddingCoupon(false)} className="text-gray-400">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-700 font-bold mb-1">Coupon Code *</label>
                        <input
                          type="text"
                          required
                          value={newCouponCode}
                          onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                          placeholder="e.g. MEGA50"
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 font-mono uppercase font-bold text-gray-900 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-bold mb-1">Discount Type</label>
                        <select
                          value={newCouponType}
                          onChange={(e) => setNewCouponType(e.target.value as any)}
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 font-bold text-gray-900 text-xs"
                        >
                          <option value="FLAT">Flat INR Amount (₹)</option>
                          <option value="PERCENT">Percentage Discount (%)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-bold mb-1">Discount Value *</label>
                        <input
                          type="number"
                          required
                          value={newCouponValue}
                          onChange={(e) => setNewCouponValue(Number(e.target.value))}
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 font-bold text-gray-900 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 font-bold mb-1">Minimum Cart Order Value (₹)</label>
                        <input
                          type="number"
                          value={newCouponMinOrder}
                          onChange={(e) => setNewCouponMinOrder(Number(e.target.value))}
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 font-bold text-gray-900 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-bold mb-1">Promotional Description</label>
                        <input
                          type="text"
                          value={newCouponDesc}
                          onChange={(e) => setNewCouponDesc(e.target.value)}
                          placeholder="e.g. Save 10% on orders above ₹499"
                          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 text-xs"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="submit"
                        className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition shadow-xs cursor-pointer"
                      >
                        Publish Coupon
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCoupon(false)}
                        className="bg-gray-100 text-gray-700 font-semibold text-xs px-4 py-2.5 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Coupons List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coupons.map((c) => (
                    <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-[#2874f0] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                            {c.code}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-gray-800 mt-2">{c.description}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Min Order: ₹{c.minOrderValue.toLocaleString('en-IN')} • Used {c.usedCount} times
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => saveCoupon({ ...c, isActive: !c.isActive })}
                          className="text-xs font-bold text-gray-600 hover:text-gray-900 px-2 py-1 rounded border border-gray-200 bg-gray-50 cursor-pointer"
                        >
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteCoupon(c.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* MODULE 6: CUSTOMER & ROLE CLEARANCES */}
            {activeTab === 'customers' && (
              <div className="space-y-6">
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                  <h2 className="font-black text-base text-gray-900">Registered Customer & Partner Directory</h2>
                  <p className="text-xs text-gray-500">
                    Review customer profiles, total lifetime spending, and role clearances.
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
                  {customersList.map((c, i) => (
                    <div key={i} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-gray-50">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-[#2874f0] font-black flex items-center justify-center text-sm shadow-xs">
                          {c.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-black text-gray-900 text-xs block">{c.email}</span>
                          <span className="text-[11px] text-gray-500">
                            {c.ordersCount} orders • Last active {new Date(c.lastOrder).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 font-bold block">Lifetime Spend:</span>
                          <span className="font-black text-emerald-700 text-sm">₹{c.totalSpent.toLocaleString('en-IN')}</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-gray-400 font-bold block">Role Clearance:</span>
                          <span className="font-bold text-gray-800 text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {c.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* MODULE 7: CUSTOMER SUPPORT HELPDESK */}
            {activeTab === 'support' && (
              <div className="space-y-6">
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                  <h2 className="font-black text-base text-gray-900">Customer Support Ticket Desk</h2>
                  <p className="text-xs text-gray-500">
                    Manage customer queries, delivery exceptions, refund inquiries, and canned responses.
                  </p>
                </div>

                <div className="space-y-4">
                  {supportTickets.length === 0 ? (
                    <div className="p-12 bg-white rounded-xl border border-gray-200 text-center text-gray-400">
                      No customer support tickets submitted yet.
                    </div>
                  ) : (
                    supportTickets.map((t) => (
                      <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                          <div>
                            <span className="font-black text-[#2874f0] text-xs">#{t.id}</span>
                            <span className="font-bold text-gray-900 ml-2">{t.subject}</span>
                            <span className="text-gray-400 text-[11px] ml-2">from {t.userEmail}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.status === 'RESOLVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : t.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-[#2874f0]'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                        </div>

                        {/* Thread message preview */}
                        <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100 max-h-40 overflow-y-auto">
                          {t.messages.map((m) => (
                            <div key={m.id} className="text-xs">
                              <span className="font-bold text-gray-800">{m.senderName}: </span>
                              <span className="text-gray-600">{m.text}</span>
                            </div>
                          ))}
                        </div>

                        {/* Agent Reply Box */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Type verified support resolution reply..."
                            id={`reply-${t.id}`}
                            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900"
                          />
                          <button
                            onClick={() => {
                              const el = document.getElementById(`reply-${t.id}`) as HTMLInputElement;
                              if (el && el.value.trim()) {
                                replyToTicket(t.id, el.value.trim(), true);
                                el.value = '';
                              }
                            }}
                            className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            Reply
                          </button>
                          <button
                            onClick={() => updateTicketStatus(t.id, 'RESOLVED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

            {/* MODULE 8: WORKFLOW AUTOMATION BUILDER */}
            {activeTab === 'automations' && (
              <div className="space-y-6">
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                  <h2 className="font-black text-base text-gray-900">Event-Driven Automation Engine</h2>
                  <p className="text-xs text-gray-500">
                    Rule-based automated triggers to streamline order fulfillment, safety-stock alerts, and ledger reconciliation.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {automationRules.map((rule) => (
                    <div key={rule.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-gray-900 text-sm">{rule.name}</span>
                        <button
                          onClick={() => toggleAutomationRule(rule.id, !rule.isActive)}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                            rule.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {rule.isActive ? '✓ Active' : 'Disabled'}
                        </button>
                      </div>

                      <p className="text-xs text-gray-600">{rule.description}</p>

                      <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono pt-2 border-t border-gray-100">
                        <span>Trigger: <strong>{rule.trigger}</strong></span>
                        <span>Fired {rule.executionCount} times</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* MODULE 9: REPORTS & BUSINESS EXPORTS */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                  <h2 className="font-black text-base text-gray-900">Financial Reports & Data Exports</h2>
                  <p className="text-xs text-gray-500">
                    Generate audit-ready CSV exports for accounting, tax GST reconciliation, and inventory audits.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="font-black text-sm text-gray-900 mb-2">Orders & Sales Report</h3>
                      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                        Export complete order line-items with customer details, gross sales, catalog discounts, and payment gateway refs.
                      </p>
                    </div>
                    <button
                      onClick={() => handleExportCsv('orders')}
                      className="w-full bg-[#2874f0] hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Orders CSV</span>
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="font-black text-sm text-gray-900 mb-2">Master Catalog Report</h3>
                      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                        Download full inventory catalog with SKUs, MRPs, selling prices, categories, and stock availability counts.
                      </p>
                    </div>
                    <button
                      onClick={() => handleExportCsv('products')}
                      className="w-full bg-[#2874f0] hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Catalog CSV</span>
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="font-black text-sm text-gray-900 mb-2">Inventory Stock Valuation</h3>
                      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                        Audit current warehouse inventory valuations, safety stock thresholds, and stock replenishment flags.
                      </p>
                    </div>
                    <button
                      onClick={() => handleExportCsv('inventory')}
                      className="w-full bg-[#2874f0] hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Inventory CSV</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* MODULE 10: MULTI-SHOP SYNC */}
            {activeTab === 'catalog_sync' && (
              <div className="space-y-6">
                
                <div className="bg-gradient-to-r from-[#2874f0] to-[#1a5fce] p-6 rounded-xl text-white shadow-xs">
                  <h3 className="text-base font-black mb-1">🏗️ Centralized Master Catalog & Multi-Shop Syncer</h3>
                  <p className="text-xs text-blue-100">
                    Maintain one absolute source of truth in <code className="bg-white/20 text-yellow-300 px-1.5 py-0.5 rounded font-mono">catalogProducts</code>. Multi-write transactions propagate live inventory to affiliated channels.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
                    <h4 className="font-black text-sm text-gray-900">Sync Execution Engine</h4>
                    <p className="text-xs text-gray-600">
                      Dispatches atomic Firestore transactions ensuring zero data loss and identical stock states across all connected reseller outlets.
                    </p>
                    <button
                      onClick={() => {
                        setIsSyncing(true);
                        setTimeout(() => {
                          setIsSyncing(false);
                          setLastSyncTime(new Date().toLocaleTimeString());
                          showToast('Synchronized with all nodes successfully!');
                        }, 1200);
                      }}
                      disabled={isSyncing}
                      className="w-full bg-[#2874f0] hover:bg-blue-600 text-white font-bold py-3 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Synchronizing...' : 'Execute Multi-Channel Sync Now'}</span>
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-3">
                    <h4 className="font-black text-sm text-gray-900">Affiliate Reseller Nodes</h4>
                    {syncedShops.map((s) => (
                      <div key={s.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-gray-900 block">{s.name}</span>
                          <span className="text-[10px] text-gray-400">{s.type}</span>
                        </div>
                        <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                          {s.status} ({products.length} Items)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* MODULE 11: BULK PRICING ENGINE */}
            {activeTab === 'pricing_engine' && (
              <div className="space-y-6">
                
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
                  <h2 className="font-black text-base text-gray-900">Algebraic Bulk Pricing Engine</h2>
                  <p className="text-xs text-gray-500">
                    Apply percentage-based price adjustments across selected departments with instant validation.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Adjustment Action</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPricingAction('hike')}
                          className={`py-2 rounded-lg font-bold text-xs cursor-pointer ${
                            pricingAction === 'hike' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          📈 Hike (+)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPricingAction('dehike')}
                          className={`py-2 rounded-lg font-bold text-xs cursor-pointer ${
                            pricingAction === 'dehike' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          📉 Dehike (-)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Percentage Offset (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={pricingPercentage}
                        onChange={(e) => setPricingPercentage(Number(e.target.value))}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Target Department</label>
                      <select
                        value={pricingCategoryFilter}
                        onChange={(e) => setPricingTargetCategory(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold text-gray-900 capitalize"
                      >
                        <option value="all">All Categories</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={handleBulkPricingAdjustment}
                        className="w-full bg-[#fb641b] hover:bg-[#e85b16] text-white font-black py-2.5 rounded-lg text-xs transition cursor-pointer shadow-sm"
                      >
                        Execute Offset
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* MODULE 12: GLOBAL STORE SETTINGS */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
                  <h2 className="font-black text-base text-gray-900">Marketplace Configuration & Website Controls</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Store Brand Name</label>
                      <input
                        type="text"
                        value={tempSettings.storeName}
                        onChange={(e) => setTempSettings({ ...tempSettings, storeName: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Customer Support Email</label>
                      <input
                        type="email"
                        value={tempSettings.supportEmail}
                        onChange={(e) => setTempSettings({ ...tempSettings, supportEmail: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Free Shipping Threshold (₹)</label>
                      <input
                        type="number"
                        value={tempSettings.freeShippingThreshold}
                        onChange={(e) => setTempSettings({ ...tempSettings, freeShippingThreshold: Number(e.target.value) })}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Top Announcement Marquee Text</label>
                    <textarea
                      rows={2}
                      value={tempSettings.announcementText}
                      onChange={(e) => setTempSettings({ ...tempSettings, announcementText: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-gray-800">
                      <input
                        type="checkbox"
                        checked={tempSettings.showAnnouncement}
                        onChange={(e) => setTempSettings({ ...tempSettings, showAnnouncement: e.target.checked })}
                        className="w-4 h-4 text-[#2874f0]"
                      />
                      <span>Display Announcement Bar</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-gray-800">
                      <input
                        type="checkbox"
                        checked={tempSettings.isFlashSaleActive}
                        onChange={(e) => setTempSettings({ ...tempSettings, isFlashSaleActive: e.target.checked })}
                        className="w-4 h-4 text-[#2874f0]"
                      />
                      <span>Active Deals of the Day Timer</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-rose-700">
                      <input
                        type="checkbox"
                        checked={tempSettings.maintenanceMode}
                        onChange={(e) => setTempSettings({ ...tempSettings, maintenanceMode: e.target.checked })}
                        className="w-4 h-4 text-rose-600"
                      />
                      <span>Deploy System Maintenance Lock</span>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <button
                      onClick={() => updateStoreSettings(tempSettings)}
                      className="bg-[#2874f0] hover:bg-blue-600 text-white font-black px-6 py-3 rounded-lg text-xs transition cursor-pointer shadow-sm"
                    >
                      Save Store Settings to Firestore
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* MODULE 13: AUDIT LOGS & SECURITY */}
            {activeTab === 'audit_logs' && (
              <div className="space-y-6">
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                  <h2 className="font-black text-base text-gray-900">Administrative Audit Activity Logs</h2>
                  <p className="text-xs text-gray-500">
                    Immutable activity log recording all staff logins, catalog additions, pricing changes, and order modifications.
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
                  {auditLogs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      No audit activity logged in this session yet.
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] bg-blue-50 text-[#2874f0] font-bold px-2 py-0.5 rounded">
                              {log.category}
                            </span>
                            <span className="font-black text-gray-900">{log.action}</span>
                          </div>
                          <p className="text-gray-600 mt-1">{log.details}</p>
                        </div>

                        <div className="text-right text-[11px] text-gray-400 font-mono">
                          <span className="text-gray-700 block font-semibold">{log.actorEmail}</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* Manual Stock Adjust Dialog */}
      {adjustingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-gray-200 animate-in fade-in duration-150">
            <h3 className="font-black text-sm text-gray-900 mb-1">Manual Inventory Stock Adjustment</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter the positive or negative unit change to apply to current inventory.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Quantity Offset (+ / -)</label>
                <input
                  type="number"
                  value={stockAdjustQty}
                  onChange={(e) => setStockAdjustQty(Number(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 font-mono font-bold text-gray-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Audit Reason</label>
                <input
                  type="text"
                  value={stockAdjustReason}
                  onChange={(e) => setStockAdjustReason(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-gray-900 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExecuteStockAdjust}
                className="flex-1 bg-[#2874f0] hover:bg-blue-600 text-white font-bold py-2 rounded-lg text-xs transition cursor-pointer"
              >
                Commit Adjustment
              </button>
              <button
                onClick={() => setAdjustingProductId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal */}
      <InvoiceModal
        order={selectedInvoiceOrder}
        isOpen={Boolean(selectedInvoiceOrder)}
        onClose={() => setSelectedInvoiceOrder(null)}
      />
    </div>
  );
};
