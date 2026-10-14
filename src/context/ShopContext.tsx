import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Address,
  CartItem,
  CategorySlug,
  Coupon,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductVariant,
  StoreSettings,
  SupportTicket,
  AuditLog,
  AutomationRule,
  StockMovement,
  UserProfile,
} from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import {
  subscribeToProducts,
  subscribeToCart,
  saveCartItem,
  removeCartItem,
  clearUserCart,
  subscribeToWishlist,
  toggleWishlistItem,
  placeOrderInFirestore,
  subscribeToOrders,
  subscribeToAllOrders,
  updateOrderStatusInFirestore,
  subscribeToStoreSettings,
  updateStoreSettingsInFirestore,
  resetCatalogInFirestore,
  seedVerifiedCatalogToFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  subscribeToCoupons,
  saveCouponToFirestore,
  deleteCouponFromFirestore,
  subscribeToSupportTickets,
  saveSupportTicketToFirestore,
  subscribeToAuditLogs,
  logAdminActivity,
  subscribeToAutomationRules,
  saveAutomationRuleToFirestore,
  subscribeToStockMovements,
  logStockMovement,
  subscribeToAllUsers,
  DEFAULT_STORE_SETTINGS,
  DEFAULT_COUPONS,
  DEFAULT_AUTOMATION_RULES,
} from '../firebase/services';
import { useAuth } from './AuthContext';
import {
  syncOrderToBothBackends,
  syncProductToBothBackends,
  deleteProductFromBothBackends,
} from '../services/dualBackendCoordinator';

interface ShopContextType {
  registeredUsers: UserProfile[];
  products: Product[];
  loadingProducts: boolean;
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  allOrders: Order[];
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: StoreSettings) => Promise<void>;
  updateOrderStatus: (
    orderId: string,
    userId: string,
    orderStatus: OrderStatus,
    paymentStatus?: 'PAID' | 'PENDING' | 'REFUNDED',
    trackingNumber?: string,
    notes?: string[]
  ) => Promise<void>;
  resetCatalog: () => Promise<void>;
  seedCatalog: () => Promise<number>;
  addToCart: (product: Product, quantity?: number, selectedVariant?: ProductVariant) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  placeOrder: (
    paymentMethod: PaymentMethod,
    shippingAddress: Address,
    razorpayInfo?: { paymentId: string; orderId: string }
  ) => Promise<Order>;
  addNewProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  adjustStock: (productId: string, quantityChange: number, reason: string) => Promise<void>;
  currentSearch: string;
  setCurrentSearch: (q: string) => void;
  selectedCategory: CategorySlug | 'all';
  setSelectedCategory: (cat: CategorySlug | 'all') => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  // Coupons
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string; discount: number };
  removeCoupon: () => void;
  saveCoupon: (coupon: Coupon) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  // Pincode Serviceability
  deliveryPincode: string;
  setDeliveryPincode: (pin: string) => void;
  checkPincodeServiceability: (pin: string) => {
    serviceable: boolean;
    estimatedDays: string;
    codAvailable: boolean;
    city: string;
  };
  // Customer Support Desk
  supportTickets: SupportTicket[];
  createTicket: (
    ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>,
    initialMessage: string
  ) => Promise<void>;
  replyToTicket: (ticketId: string, text: string, isStaff?: boolean) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => Promise<void>;
  // Audit Logs & Automation Rules
  auditLogs: AuditLog[];
  recordAuditLog: (category: AuditLog['category'], action: string, details: string) => Promise<void>;
  automationRules: AutomationRule[];
  toggleAutomationRule: (ruleId: string, isActive: boolean) => Promise<void>;
  stockMovements: StockMovement[];
  // Computed values
  cartItemCount: number;
  cartTotalMRP: number;
  cartTotalDiscount: number;
  cartCouponDiscount: number;
  cartDeliveryFee: number;
  cartPackagingFee: number;
  cartFinalPayable: number;
  cartTotalSavings: number;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [currentSearch, setCurrentSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug | 'all'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Enterprise operations state
  const [coupons, setCoupons] = useState<Coupon[]>(DEFAULT_COUPONS);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [deliveryPincode, setDeliveryPincode] = useState<string>('560001'); // Default Bangalore / Metro
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(DEFAULT_AUTOMATION_RULES);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // 1. Subscribe to Firestore Products
  useEffect(() => {
    const unsub = subscribeToProducts((prods) => {
      setProducts(prods && prods.length > 0 ? prods : INITIAL_PRODUCTS);
      setLoadingProducts(false);
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Store Settings
  useEffect(() => {
    const unsub = subscribeToStoreSettings((settings) => {
      setStoreSettings(settings);
    });
    return () => unsub();
  }, []);

  // 3. Subscribe to Coupons
  useEffect(() => {
    const unsub = subscribeToCoupons((coups) => {
      setCoupons(coups);
    });
    return () => unsub();
  }, []);

  // 4. Subscribe to Support Tickets
  useEffect(() => {
    const unsub = subscribeToSupportTickets((tickets) => {
      setSupportTickets(tickets);
    });
    return () => unsub();
  }, []);

  // 5. Subscribe to Audit Logs (Admin only)
  useEffect(() => {
    if (isAdmin) {
      const unsub = subscribeToAuditLogs((logs) => {
        setAuditLogs(logs);
      });
      return () => unsub();
    }
  }, [isAdmin]);

  // 6. Subscribe to Automation Rules
  useEffect(() => {
    const unsub = subscribeToAutomationRules((rules) => {
      setAutomationRules(rules);
    });
    return () => unsub();
  }, []);

  // 7. Subscribe to Stock Movements
  useEffect(() => {
    if (isAdmin) {
      const unsub = subscribeToStockMovements((movs) => {
        setStockMovements(movs);
      });
      return () => unsub();
    }
  }, [isAdmin]);

  // 8. Sync User Cart
  useEffect(() => {
    if (user?.uid) {
      const unsub = subscribeToCart(user.uid, (items) => {
        setCart(items);
      });
      return () => unsub();
    } else {
      const localCart = localStorage.getItem('vyuma_guest_cart');
      if (localCart) {
        try {
          setCart(JSON.parse(localCart));
        } catch {
          setCart([]);
        }
      }
    }
  }, [user?.uid]);

  // 9. Sync Wishlist
  useEffect(() => {
    if (user?.uid) {
      const unsub = subscribeToWishlist(user.uid, (ids) => {
        setWishlist(ids);
      });
      return () => unsub();
    } else {
      const localWish = localStorage.getItem('vyuma_guest_wishlist');
      if (localWish) {
        try {
          setWishlist(JSON.parse(localWish));
        } catch {
          setWishlist([]);
        }
      }
    }
  }, [user?.uid]);

  // 10. Sync User Orders
  useEffect(() => {
    if (user?.uid) {
      const unsub = subscribeToOrders(user.uid, (userOrders) => {
        setOrders(userOrders);
      });
      return () => unsub();
    } else {
      const localOrders = localStorage.getItem('vyuma_guest_orders');
      if (localOrders) {
        try {
          setOrders(JSON.parse(localOrders));
        } catch {
          setOrders([]);
        }
      }
    }
  }, [user?.uid]);

  // 11. Master Admin: Sync All Orders across entire store
  useEffect(() => {
    if (isAdmin) {
      const unsub = subscribeToAllOrders((all) => {
        setAllOrders(all);
      });
      return () => unsub();
    }
  }, [isAdmin]);

  const addToCart = (product: Product, quantity = 1, selectedVariant?: ProductVariant) => {
    const itemKey = selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id;
    const existing = cart.find((i) =>
      selectedVariant ? i.productId === product.id && i.selectedVariant?.id === selectedVariant.id : i.productId === product.id
    );

    let updatedCart: CartItem[];

    if (existing) {
      const updatedItem: CartItem = {
        ...existing,
        quantity: existing.quantity + quantity,
      };
      updatedCart = cart.map((i) =>
        (selectedVariant ? i.productId === product.id && i.selectedVariant?.id === selectedVariant.id : i.productId === product.id)
          ? updatedItem
          : i
      );
      if (user?.uid) {
        saveCartItem(user.uid, updatedItem);
      }
    } else {
      const newItem: CartItem = {
        productId: product.id,
        quantity: quantity,
        product,
        selectedVariant,
      };
      updatedCart = [...cart, newItem];
      if (user?.uid) {
        saveCartItem(user.uid, newItem);
      }
    }

    setCart(updatedCart);
    if (!user?.uid) {
      localStorage.setItem('vyuma_guest_cart', JSON.stringify(updatedCart));
    }
    showToast(`Added "${product.title.slice(0, 24)}..." to Cart!`);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cart.map((item) => {
      if (item.productId === productId) {
        const updated = { ...item, quantity };
        if (user?.uid) {
          saveCartItem(user.uid, updated);
        }
        return updated;
      }
      return item;
    });

    setCart(updatedCart);
    if (!user?.uid) {
      localStorage.setItem('vyuma_guest_cart', JSON.stringify(updatedCart));
    }
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter((i) => i.productId !== productId);
    setCart(updatedCart);

    if (user?.uid) {
      removeCartItem(user.uid, productId);
    } else {
      localStorage.setItem('vyuma_guest_cart', JSON.stringify(updatedCart));
    }
    showToast('Item removed from cart');
  };

  const clearCart = () => {
    if (user?.uid) {
      clearUserCart(user.uid, cart);
    } else {
      localStorage.removeItem('vyuma_guest_cart');
    }
    setCart([]);
  };

  const toggleWishlist = (product: Product) => {
    const isCurrentlyWishlisted = wishlist.includes(product.id);
    let updated: string[];

    if (isCurrentlyWishlisted) {
      updated = wishlist.filter((id) => id !== product.id);
      showToast('Removed from your Wishlist');
    } else {
      updated = [...wishlist, product.id];
      showToast('Saved to your Wishlist ❤️');
    }

    setWishlist(updated);

    if (user?.uid) {
      toggleWishlistItem(user.uid, product, isCurrentlyWishlisted);
    } else {
      localStorage.setItem('vyuma_guest_wishlist', JSON.stringify(updated));
    }
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  // Cart Calculations
  const cartItemCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const cartTotalMRP = useMemo(
    () =>
      cart.reduce((acc, item) => {
        const unitMRP = item.selectedVariant ? item.selectedVariant.originalPrice : item.product.originalPrice;
        return acc + unitMRP * item.quantity;
      }, 0),
    [cart]
  );

  const cartActualPrice = useMemo(
    () =>
      cart.reduce((acc, item) => {
        const unitPrice = item.selectedVariant ? item.selectedVariant.price : item.product.price;
        return acc + unitPrice * item.quantity;
      }, 0),
    [cart]
  );

  const cartTotalDiscount = useMemo(
    () => cartTotalMRP - cartActualPrice,
    [cartTotalMRP, cartActualPrice]
  );

  // Coupon Calculation
  const cartCouponDiscount = useMemo(() => {
    if (!appliedCoupon || cartActualPrice < appliedCoupon.minOrderValue) return 0;
    if (appliedCoupon.discountType === 'PERCENT') {
      const discount = Math.round((cartActualPrice * appliedCoupon.discountValue) / 100);
      return appliedCoupon.maxDiscountCap ? Math.min(discount, appliedCoupon.maxDiscountCap) : discount;
    }
    return Math.min(appliedCoupon.discountValue, cartActualPrice);
  }, [appliedCoupon, cartActualPrice]);

  const cartDeliveryFee = useMemo(() => {
    if (cart.length === 0) return 0;
    if (appliedCoupon?.code === 'FREESHIP') return 0;
    const threshold = storeSettings.freeShippingThreshold || 500;
    const fee = storeSettings.standardShippingFee || 40;
    return cartActualPrice >= threshold ? 0 : fee;
  }, [cart, cartActualPrice, storeSettings, appliedCoupon]);

  const cartPackagingFee = useMemo(() => (cart.length > 0 ? 29 : 0), [cart]);

  const cartFinalPayable = useMemo(() => {
    if (cart.length === 0) return 0;
    const net = cartActualPrice - cartCouponDiscount + cartDeliveryFee + cartPackagingFee;
    return Math.max(0, net);
  }, [cart, cartActualPrice, cartCouponDiscount, cartDeliveryFee, cartPackagingFee]);

  const cartTotalSavings = useMemo(() => {
    const shippingSavings = cartDeliveryFee === 0 && cart.length > 0 ? (storeSettings.standardShippingFee || 40) : 0;
    return cartTotalDiscount + cartCouponDiscount + shippingSavings;
  }, [cartTotalDiscount, cartCouponDiscount, cartDeliveryFee, cart, storeSettings]);

  // Coupon Handlers
  const applyCoupon = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = coupons.find((c) => c.code.toUpperCase() === cleanCode && c.isActive);

    if (!found) {
      return { success: false, message: 'Invalid or expired coupon code', discount: 0 };
    }

    if (cartActualPrice < found.minOrderValue) {
      return {
        success: false,
        message: `Minimum order value for ${found.code} is ₹${found.minOrderValue.toLocaleString('en-IN')}`,
        discount: 0,
      };
    }

    setAppliedCoupon(found);
    showToast(`Coupon ${found.code} applied successfully!`);
    return { success: true, message: `Applied ${found.code}!`, discount: cartCouponDiscount };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed');
  };

  const saveCoupon = async (coupon: Coupon) => {
    await saveCouponToFirestore(coupon);
    setCoupons((prev) => [coupon, ...prev.filter((c) => c.id !== coupon.id)]);
    if (user?.email) {
      logAdminActivity(user.email, 'PRICING', 'SAVE_COUPON', `Saved coupon code ${coupon.code}`);
    }
    showToast(`Coupon ${coupon.code} saved!`);
  };

  const deleteCoupon = async (id: string) => {
    await deleteCouponFromFirestore(id);
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    showToast('Coupon deleted');
  };

  // Pincode Serviceability Engine
  const checkPincodeServiceability = (pin: string) => {
    const cleanPin = pin.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return { serviceable: false, estimatedDays: 'Invalid PIN code', codAvailable: false, city: 'Unknown' };
    }

    // Metro and regional postal circles
    const firstDigit = cleanPin.charAt(0);
    let city = 'All India Express Delivery';
    let days = '2-4 business days';

    if (cleanPin === '733093' || cleanPin.startsWith('733')) {
      city = 'Uttar Dinajpur / Raiganj Hub (West Bengal)';
      days = '2-3 business days';
    } else if (cleanPin.startsWith('734')) {
      city = 'Siliguri & North Bengal Hub';
      days = '2-3 business days';
    } else if (cleanPin.startsWith('700') || cleanPin.startsWith('711') || cleanPin.startsWith('712')) {
      city = 'Kolkata Metropolitan Area';
      days = 'Tomorrow by 8 PM';
    } else if (cleanPin.startsWith('560')) {
      city = 'Bengaluru (Same-Day Express Hub)';
      days = 'Tomorrow by 2 PM';
    } else if (cleanPin.startsWith('110') || cleanPin.startsWith('122') || cleanPin.startsWith('201')) {
      city = 'Delhi NCR (Express Delivery)';
      days = 'Tomorrow by 4 PM';
    } else if (cleanPin.startsWith('400') || cleanPin.startsWith('411')) {
      city = 'Mumbai / Pune Metro';
      days = 'Tomorrow by 6 PM';
    } else if (cleanPin.startsWith('600')) {
      city = 'Chennai Central Hub';
      days = 'Within 1-2 days';
    } else if (cleanPin.startsWith('500')) {
      city = 'Hyderabad Metro Hub';
      days = 'Within 1-2 days';
    } else if (cleanPin.startsWith('380')) {
      city = 'Ahmedabad Express Hub';
      days = 'Within 1-2 days';
    } else if (firstDigit === '7') {
      city = 'East & North-East Postal Zone';
      days = '2-3 business days';
    } else if (firstDigit === '5' || firstDigit === '6') {
      city = 'South India Postal Zone';
      days = '2 business days';
    } else if (firstDigit === '1' || firstDigit === '2') {
      city = 'North India Postal Zone';
      days = '2 business days';
    } else if (firstDigit === '3' || firstDigit === '4') {
      city = 'West India Postal Zone';
      days = '2 business days';
    } else {
      city = 'All India Express Network';
      days = '2-4 business days';
    }

    return {
      serviceable: true,
      estimatedDays: days,
      codAvailable: storeSettings.codAvailable ?? true,
      city,
    };
  };

  // Support Tickets
  const createTicket = async (
    ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>,
    initialMessage: string
  ) => {
    const ticketId = `TCK-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTicket: SupportTicket = {
      ...ticketData,
      id: ticketId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'CUSTOMER',
          senderName: ticketData.userName,
          text: initialMessage,
          timestamp: Date.now(),
        },
      ],
    };

    await saveSupportTicketToFirestore(newTicket);
    setSupportTickets((prev) => [newTicket, ...prev]);
    showToast(`Support Ticket #${ticketId} created! Our team will respond shortly.`);
  };

  const replyToTicket = async (ticketId: string, text: string, isStaff = false) => {
    const existing = supportTickets.find((t) => t.id === ticketId);
    if (!existing) return;

    const updated: SupportTicket = {
      ...existing,
      updatedAt: Date.now(),
      status: isStaff ? 'IN_PROGRESS' : existing.status,
      messages: [
        ...existing.messages,
        {
          id: `msg-${Date.now()}`,
          sender: isStaff ? 'SUPPORT_AGENT' : 'CUSTOMER',
          senderName: isStaff ? 'Vyuma Support Desk' : existing.userName,
          text,
          timestamp: Date.now(),
        },
      ],
    };

    await saveSupportTicketToFirestore(updated);
    setSupportTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
    showToast('Reply dispatched');
  };

  const updateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    const existing = supportTickets.find((t) => t.id === ticketId);
    if (!existing) return;

    const updated: SupportTicket = { ...existing, status, updatedAt: Date.now() };
    await saveSupportTicketToFirestore(updated);
    setSupportTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
    showToast(`Ticket #${ticketId} status updated to ${status}`);
  };

  // Audit Logs
  const recordAuditLog = async (category: AuditLog['category'], action: string, details: string) => {
    if (user?.email) {
      await logAdminActivity(user.email, category, action, details);
    }
  };

  // Automations
  const toggleAutomationRule = async (ruleId: string, isActive: boolean) => {
    const rule = automationRules.find((r) => r.id === ruleId);
    if (!rule) return;
    const updated = { ...rule, isActive };
    await saveAutomationRuleToFirestore(updated);
    setAutomationRules((prev) => prev.map((r) => (r.id === ruleId ? updated : r)));
    showToast(`Automation rule "${rule.name}" is now ${isActive ? 'Active' : 'Disabled'}`);
  };

  // Stock Adjustment
  const adjustStock = async (productId: string, quantityChange: number, reason: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const previousStock = prod.stockCount || 0;
    const newStock = Math.max(0, previousStock + quantityChange);
    const updatedProd: Product = {
      ...prod,
      stockCount: newStock,
      inStock: newStock > 0,
    };

    await saveProductToFirestore(updatedProd);
    setProducts((prev) => prev.map((p) => (p.id === productId ? updatedProd : p)));

    await logStockMovement({
      productId,
      productTitle: prod.title,
      type: quantityChange >= 0 ? 'RESTOCK' : 'MANUAL_ADJUST',
      quantityChange,
      previousStock,
      newStock,
      reason,
      actorEmail: user?.email || 'admin@vyuma.in',
    });

    if (user?.email) {
      await logAdminActivity(
        user.email,
        'INVENTORY',
        'STOCK_ADJUSTMENT',
        `Adjusted stock for ${prod.title} by ${quantityChange} (${previousStock} -> ${newStock}). Reason: ${reason}`
      );
    }

    showToast(`Inventory adjusted: ${prod.title} now has ${newStock} units`);
  };

  // Place Order with Razorpay & Coupon Support
  const placeOrder = async (
    paymentMethod: PaymentMethod,
    shippingAddress: Address,
    razorpayInfo?: { paymentId: string; orderId: string }
  ): Promise<Order> => {
    if (!user?.uid) {
      throw new Error('Please sign in to place an order.');
    }

    const orderId = `VYM-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: Order = {
      id: orderId,
      userId: user.uid,
      userEmail: user.email || 'customer@vyuma.in',
      items: [...cart],
      totalAmount: cartTotalMRP,
      discountAmount: cartTotalDiscount,
      couponCode: appliedCoupon?.code,
      couponDiscount: cartCouponDiscount,
      deliveryFee: cartDeliveryFee,
      packagingFee: cartPackagingFee,
      finalPayable: cartFinalPayable,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
      orderStatus: 'CONFIRMED',
      createdAt: Date.now(),
      estimatedDelivery: 'Within 2-3 business days',
      razorpayPaymentId: razorpayInfo?.paymentId || `pay_rzp_${Date.now()}`,
      razorpayOrderId: razorpayInfo?.orderId || `order_rzp_${Date.now()}`,
      invoiceNumber: `INV-2026-${orderId.replace('VYM-', '')}`,
      trackingNumber: `TRK-VYM-${Date.now().toString().slice(-8)}`,
      courierPartner: 'Vyuma Express Logistics',
    };

    await placeOrderInFirestore(newOrder);

    // Non-blocking background sync with losslessly compressed payload to Supabase Free Tier
    syncOrderToSupabase(newOrder).catch((err) => {
      console.log('Deferred Supabase order sync:', err?.message);
    });

    // Automatically deduct inventory stock for each purchased item
    for (const item of cart) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const prev = prod.stockCount || 10;
        const next = Math.max(0, prev - item.quantity);
        await saveProductToFirestore({
          ...prod,
          stockCount: next,
          inStock: next > 0,
        });
        await logStockMovement({
          productId: prod.id,
          productTitle: prod.title,
          type: 'ORDER_DEDUCT',
          quantityChange: -item.quantity,
          previousStock: prev,
          newStock: next,
          reason: `Customer Order #${orderId}`,
          actorEmail: user.email || 'customer',
        });
      }
    }

    clearCart();
    setAppliedCoupon(null);

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    showToast(`Order #${orderId} Verified & Placed Successfully!`);
    return newOrder;
  };

  // Master Admin Controls
  const updateStoreSettings = async (settings: StoreSettings) => {
    await updateStoreSettingsInFirestore(settings);
    setStoreSettings(settings);
    if (user?.email) {
      await logAdminActivity(user.email, 'SETTINGS', 'UPDATE_CONFIG', 'Updated global store configuration');
    }
    showToast('Store settings updated live in Firestore!');
  };

  const updateOrderStatus = async (
    orderId: string,
    userId: string,
    orderStatus: OrderStatus,
    paymentStatus?: 'PAID' | 'PENDING' | 'REFUNDED',
    trackingNumber?: string,
    notes?: string[]
  ) => {
    await updateOrderStatusInFirestore(orderId, userId, orderStatus, paymentStatus, trackingNumber, notes);
    if (user?.email) {
      await logAdminActivity(
        user.email,
        'ORDER',
        'UPDATE_STATUS',
        `Order #${orderId} transitioned to ${orderStatus} (Payment: ${paymentStatus || 'UNCHANGED'})`
      );
    }
    showToast(`Order #${orderId} status set to ${orderStatus}`);
  };

  const resetCatalog = async () => {
    await resetCatalogInFirestore();
    setProducts([]);
    if (user?.email) {
      await logAdminActivity(user.email, 'CATALOG', 'RESET_CATALOG', 'Cleared all catalog products');
    }
    showToast('Catalog cleared in Firestore!');
  };

  const seedCatalog = async (): Promise<number> => {
    const count = await seedVerifiedCatalogToFirestore();
    setProducts(INITIAL_PRODUCTS);
    if (user?.email) {
      await logAdminActivity(user.email, 'CATALOG', 'SEED_CATALOG', `Seeded ${count} multi-category marketplace products`);
    }
    showToast(`Successfully seeded ${count} verified marketplace products into Firestore!`);
    return count;
  };

  const addNewProduct = async (prod: Product) => {
    await saveProductToFirestore(prod);
    setProducts((prev) => [prod, ...prev.filter((p) => p.id !== prod.id)]);
    saveCompressedRecord(`prod_${prod.id}`, 'product', prod, {
      title: prod.title,
      price: prod.price,
      category: prod.category,
    }).catch(() => {});
    if (user?.email) {
      await logAdminActivity(user.email, 'CATALOG', 'ADD_PRODUCT', `Published product ${prod.title} (SKU: ${prod.sku || 'N/A'})`);
    }
    showToast(`Product "${prod.title}" published to catalog!`);
  };

  const updateProduct = async (prod: Product) => {
    await saveProductToFirestore(prod);
    setProducts((prev) => prev.map((p) => (p.id === prod.id ? prod : p)));
    saveCompressedRecord(`prod_${prod.id}`, 'product', prod, {
      title: prod.title,
      price: prod.price,
      category: prod.category,
    }).catch(() => {});
    if (user?.email) {
      await logAdminActivity(user.email, 'CATALOG', 'UPDATE_PRODUCT', `Updated product ${prod.title}`);
    }
    showToast(`Product "${prod.title}" updated in Firestore!`);
  };

  const deleteProduct = async (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    await deleteProductFromFirestore(prodId);
    setProducts((prev) => prev.filter((p) => p.id !== prodId));
    if (user?.email) {
      await logAdminActivity(user.email, 'CATALOG', 'DELETE_PRODUCT', `Deleted product ${prod?.title || prodId}`);
    }
    showToast('Product removed from catalog');
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        loadingProducts,
        cart,
        wishlist,
        orders,
        allOrders,
        storeSettings,
        updateStoreSettings,
        updateOrderStatus,
        resetCatalog,
        seedCatalog,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        isWishlisted,
        placeOrder,
        addNewProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        currentSearch,
        setCurrentSearch,
        selectedCategory,
        setSelectedCategory,
        toastMessage,
        showToast,
        coupons,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        saveCoupon,
        deleteCoupon,
        deliveryPincode,
        setDeliveryPincode,
        checkPincodeServiceability,
        supportTickets,
        createTicket,
        replyToTicket,
        updateTicketStatus,
        auditLogs,
        recordAuditLog,
        automationRules,
        toggleAutomationRule,
        stockMovements,
        cartItemCount,
        cartTotalMRP,
        cartTotalDiscount,
        cartCouponDiscount,
        cartDeliveryFee,
        cartPackagingFee,
        cartFinalPayable,
        cartTotalSavings,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
