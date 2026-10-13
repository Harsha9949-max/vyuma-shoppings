export type CategorySlug = 
  | 'grocery'
  | 'mobiles'
  | 'fashion'
  | 'electronics'
  | 'home'
  | 'appliances'
  | 'beauty'
  | 'toys';

export interface CategoryInfo {
  id: CategorySlug;
  name: string;
  image: string;
  bannerTitle: string;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "8GB RAM / 128GB - Phantom Black" or "Size: XL, Color: Navy"
  sku: string;
  price: number;
  originalPrice: number;
  stockCount: number;
  attributes: Record<string, string>;
}

export interface Product {
  id: string;
  title: string;
  brand: string;
  category: CategorySlug;
  subcategory: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  ratingCount: number;
  reviewCount: number;
  image: string;
  images: string[];
  isAssured: boolean;
  isDealOfTheDay?: boolean;
  isTrending?: boolean;
  description: string;
  highlights: string[];
  specs: Record<string, string>;
  inStock: boolean;
  stockCount: number;
  fastDelivery: string;
  seller: string;
  createdAt?: string | number;
  sku?: string;
  barcode?: string;
  tags?: string[];
  lowStockThreshold?: number;
  variants?: ProductVariant[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber?: string;
  role?: 'customer' | 'admin' | 'super_admin' | 'catalog_manager' | 'order_manager';
  walletBalance?: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
  selectedVariant?: ProductVariant;
}

export interface Address {
  id: string;
  fullName: string;
  mobile: string;
  pincode: string;
  addressLine: string;
  locality?: string;
  city: string;
  state: string;
  type: 'HOME' | 'WORK';
  isDefault: boolean;
}

export type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING' | 'COD';

export type OrderStatus = 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: CartItem[];
  totalAmount: number;
  discountAmount: number;
  deliveryFee: number;
  packagingFee: number;
  finalPayable: number;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  orderStatus: OrderStatus;
  createdAt: number;
  estimatedDelivery: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  couponCode?: string;
  couponDiscount?: number;
  trackingNumber?: string;
  courierPartner?: string;
  internalNotes?: string[];
  invoiceNumber?: string;
  returnRequested?: boolean;
  returnReason?: string;
  returnStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
}

export interface StoreSettings {
  announcementText: string;
  showAnnouncement: boolean;
  isFlashSaleActive: boolean;
  flashSaleEndsInHours: number;
  maintenanceMode: boolean;
  razorpayKeyId: string;
  razorpayLiveMode: boolean;
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  codAvailable: boolean;
  taxPercentage: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  headline: string;
  comment: string;
  createdAt: number;
  verifiedPurchase: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  maxDiscountCap?: number;
  validUntil: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  description: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: 'ORDER' | 'PAYMENT' | 'DELIVERY' | 'REFUND' | 'PRODUCT' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: number;
  updatedAt: number;
  messages: {
    id: string;
    sender: 'CUSTOMER' | 'SUPPORT_AGENT';
    senderName: string;
    text: string;
    timestamp: number;
  }[];
}

export interface AuditLog {
  id: string;
  actorEmail: string;
  action: string;
  category: 'CATALOG' | 'ORDER' | 'INVENTORY' | 'PRICING' | 'SETTINGS' | 'AUTH' | 'SUPPORT';
  details: string;
  timestamp: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'LOW_STOCK' | 'ORDER_PAID' | 'ORDER_SHIPPED' | 'REFUND_APPROVED' | 'ABANDONED_CART';
  action: 'ALERT_ADMIN' | 'SEND_EMAIL' | 'QUEUE_RESTOCK' | 'UPDATE_LEDGER' | 'AUTO_CONFIRM';
  isActive: boolean;
  lastRun?: number;
  executionCount: number;
  description: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productTitle: string;
  type: 'RESTOCK' | 'ORDER_DEDUCT' | 'RETURN_RESTOCK' | 'MANUAL_ADJUST' | 'DAMAGED';
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  actorEmail: string;
  timestamp: number;
}
