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
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber?: string;
  role?: 'customer' | 'seller' | 'admin';
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
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
}

export interface StoreSettings {
  announcementText: string;
  showAnnouncement: boolean;
  isFlashSaleActive: boolean;
  flashSaleEndsInHours: number;
  maintenanceMode: boolean;
  razorpayKeyId: string;
  razorpayLiveMode: boolean;
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
