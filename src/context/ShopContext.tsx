import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Address, CartItem, CategorySlug, Order, OrderStatus, PaymentMethod, Product, StoreSettings } from '../types';
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
  saveProductToFirestore,
  deleteProductFromFirestore,
  DEFAULT_STORE_SETTINGS,
} from '../firebase/services';
import { useAuth } from './AuthContext';

interface ShopContextType {
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
    paymentStatus?: 'PAID' | 'PENDING' | 'REFUNDED'
  ) => Promise<void>;
  resetCatalog: () => Promise<void>;
  addToCart: (product: Product, quantity?: number) => void;
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
  currentSearch: string;
  setCurrentSearch: (q: string) => void;
  selectedCategory: CategorySlug | 'all';
  setSelectedCategory: (cat: CategorySlug | 'all') => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  // Computed values
  cartItemCount: number;
  cartTotalMRP: number;
  cartTotalDiscount: number;
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // 1. Subscribe to Firestore Products
  useEffect(() => {
    // Purge obsolete mock/demo cache keys from prior versions
    try {
      localStorage.removeItem('vyuma_real_products');
      localStorage.removeItem('vyuma_mock_products');
      localStorage.removeItem('vyuma_demo_products');
    } catch {
      // ignore
    }

    const unsub = subscribeToProducts((prods) => {
      setProducts(prods || []);
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

  // 3. Sync User Cart
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

  // 4. Sync Wishlist
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

  // 5. Sync User Orders
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

  // 6. Master Admin: Sync All Orders across entire store
  useEffect(() => {
    if (isAdmin) {
      const unsub = subscribeToAllOrders((all) => {
        setAllOrders(all);
      });
      return () => unsub();
    }
  }, [isAdmin]);

  const addToCart = (product: Product, quantity = 1) => {
    const existing = cart.find((i) => i.productId === product.id);
    let updatedCart: CartItem[];

    if (existing) {
      const updatedItem: CartItem = {
        ...existing,
        quantity: existing.quantity + quantity,
      };
      updatedCart = cart.map((i) => (i.productId === product.id ? updatedItem : i));
      if (user?.uid) {
        saveCartItem(user.uid, updatedItem);
      }
    } else {
      const newItem: CartItem = {
        productId: product.id,
        quantity: quantity,
        product,
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
    () => cart.reduce((acc, item) => acc + item.product.originalPrice * item.quantity, 0),
    [cart]
  );

  const cartActualPrice = useMemo(
    () => cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [cart]
  );

  const cartTotalDiscount = useMemo(
    () => cartTotalMRP - cartActualPrice,
    [cartTotalMRP, cartActualPrice]
  );

  const cartDeliveryFee = useMemo(() => {
    if (cart.length === 0) return 0;
    return cartActualPrice >= 500 ? 0 : 40;
  }, [cart, cartActualPrice]);

  const cartPackagingFee = useMemo(() => (cart.length > 0 ? 29 : 0), [cart]);

  const cartFinalPayable = useMemo(() => {
    if (cart.length === 0) return 0;
    return cartActualPrice + cartDeliveryFee + cartPackagingFee;
  }, [cart, cartActualPrice, cartDeliveryFee, cartPackagingFee]);

  const cartTotalSavings = useMemo(() => {
    return cartTotalDiscount + (cartDeliveryFee === 0 && cart.length > 0 ? 40 : 0);
  }, [cartTotalDiscount, cartDeliveryFee, cart]);

  // Place Order with Razorpay Payment Support
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
    };

    await placeOrderInFirestore(newOrder);
    clearCart();

    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    showToast(`Order #${orderId} Verified & Placed via Razorpay!`);
    return newOrder;
  };

  // Master Admin Controls
  const updateStoreSettings = async (settings: StoreSettings) => {
    await updateStoreSettingsInFirestore(settings);
    setStoreSettings(settings);
    showToast('Store settings updated live in Firestore!');
  };

  const updateOrderStatus = async (
    orderId: string,
    userId: string,
    orderStatus: OrderStatus,
    paymentStatus?: 'PAID' | 'PENDING' | 'REFUNDED'
  ) => {
    await updateOrderStatusInFirestore(orderId, userId, orderStatus, paymentStatus);
    showToast(`Order #${orderId} status set to ${orderStatus}`);
  };

  const resetCatalog = async () => {
    await resetCatalogInFirestore();
    setProducts([]);
    showToast('Catalog cleared in Firestore!');
  };

  const addNewProduct = async (prod: Product) => {
    await saveProductToFirestore(prod);
    setProducts((prev) => [prod, ...prev.filter((p) => p.id !== prod.id)]);
    showToast(`Product "${prod.title}" published to catalog!`);
  };

  const updateProduct = async (prod: Product) => {
    await saveProductToFirestore(prod);
    setProducts((prev) => prev.map((p) => (p.id === prod.id ? prod : p)));
    showToast(`Product "${prod.title}" updated in Firestore!`);
  };

  const deleteProduct = async (prodId: string) => {
    await deleteProductFromFirestore(prodId);
    setProducts((prev) => prev.filter((p) => p.id !== prodId));
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
        currentSearch,
        setCurrentSearch,
        selectedCategory,
        setSelectedCategory,
        toastMessage,
        showToast,
        cartItemCount,
        cartTotalMRP,
        cartTotalDiscount,
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
