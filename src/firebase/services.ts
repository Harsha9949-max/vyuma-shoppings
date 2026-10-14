import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import {
  CartItem,
  Order,
  Product,
  Review,
  StoreSettings,
  Address,
  Coupon,
  SupportTicket,
  AuditLog,
  AutomationRule,
  StockMovement,
  UserProfile,
} from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';

const PRODUCTS_COLLECTION = 'products';
const USERS_COLLECTION = 'users';
const ORDERS_COLLECTION = 'orders';
const SETTINGS_COLLECTION = 'settings';
const COUPONS_COLLECTION = 'coupons';
const TICKETS_COLLECTION = 'support_tickets';
const AUDIT_LOGS_COLLECTION = 'audit_logs';
const AUTOMATIONS_COLLECTION = 'automation_rules';
const STOCK_MOVEMENTS_COLLECTION = 'stock_movements';
const DEFAULT_SETTINGS_DOC = 'store_config';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  announcementText: '🔥 Mega Marketplace Sale: Use code VYUMA100 for ₹100 Off on orders above ₹999 | Free Express Delivery on orders above ₹500',
  showAnnouncement: true,
  isFlashSaleActive: true,
  flashSaleEndsInHours: 18,
  maintenanceMode: false,
  razorpayKeyId: 'rzp_live_vyuma',
  razorpayLiveMode: true,
  storeName: 'VYUMA Marketplace',
  supportEmail: 'support@vyuma.in',
  supportPhone: '+91 1800-200-8899',
  freeShippingThreshold: 500,
  standardShippingFee: 40,
  codAvailable: true,
  taxPercentage: 18,
};

export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'coup-01',
    code: 'VYUMA100',
    discountType: 'FLAT',
    discountValue: 100,
    minOrderValue: 999,
    validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
    usageLimit: 5000,
    usedCount: 0,
    isActive: true,
    description: 'Flat ₹100 Off on orders above ₹999 across all categories',
  },
  {
    id: 'coup-02',
    code: 'WELCOME10',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderValue: 499,
    maxDiscountCap: 250,
    validUntil: Date.now() + 60 * 24 * 60 * 60 * 1000,
    usageLimit: 10000,
    usedCount: 0,
    isActive: true,
    description: '10% Off up to ₹250 on orders above ₹499 for new shoppers',
  },
  {
    id: 'coup-03',
    code: 'FREESHIP',
    discountType: 'FLAT',
    discountValue: 40,
    minOrderValue: 0,
    validUntil: Date.now() + 90 * 24 * 60 * 60 * 1000,
    usageLimit: 2000,
    usedCount: 0,
    isActive: true,
    description: 'Free Shipping on your order (waives standard delivery fee)',
  },
  {
    id: 'coup-04',
    code: 'FESTIVE500',
    discountType: 'FLAT',
    discountValue: 500,
    minOrderValue: 2499,
    validUntil: Date.now() + 15 * 24 * 60 * 60 * 1000,
    usageLimit: 1000,
    usedCount: 0,
    isActive: true,
    description: 'Festive Bumper: Flat ₹500 Off on orders above ₹2,499',
  },
];

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'auto-01',
    name: 'Critical Inventory Restock Alert',
    trigger: 'LOW_STOCK',
    action: 'ALERT_ADMIN',
    isActive: true,
    executionCount: 0,
    description: 'When stock drops below 5 units, trigger high-priority alert in Admin Dashboard.',
  },
  {
    id: 'auto-02',
    name: 'Automatic Order Fulfillment Advance',
    trigger: 'ORDER_PAID',
    action: 'AUTO_CONFIRM',
    isActive: true,
    executionCount: 0,
    description: 'Advance verified prepaid orders immediately into PACKED consignment status.',
  },
  {
    id: 'auto-03',
    name: 'Shipment Waybill Notification',
    trigger: 'ORDER_SHIPPED',
    action: 'SEND_EMAIL',
    isActive: true,
    executionCount: 0,
    description: 'Dispatch tracking number and courier link via transactional notification.',
  },
  {
    id: 'auto-04',
    name: 'Double-Entry Ledger Reconciliation',
    trigger: 'REFUND_APPROVED',
    action: 'UPDATE_LEDGER',
    isActive: true,
    executionCount: 0,
    description: 'Deduct returned value from platform earnings and credit customer account.',
  },
];

/**
 * Clear all products in Firestore catalog
 */
export async function resetCatalogInFirestore(): Promise<void> {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const snap = await getDocs(colRef);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.warn('resetCatalog error:', err);
  }
}

/**
 * Seed verified multi-category catalog into Firestore
 */
export async function seedVerifiedCatalogToFirestore(): Promise<number> {
  let count = 0;
  try {
    for (const prod of INITIAL_PRODUCTS) {
      await setDoc(doc(db, PRODUCTS_COLLECTION, prod.id), prod);
      count++;
    }
  } catch (err) {
    console.error('seedVerifiedCatalogToFirestore error:', err);
  }
  return count;
}

/**
 * Subscribe to storewide settings in Firestore
 */
export function subscribeToStoreSettings(
  onUpdate: (settings: StoreSettings) => void
) {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, DEFAULT_SETTINGS_DOC);
    return onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<StoreSettings>;
          onUpdate({ ...DEFAULT_STORE_SETTINGS, ...data });
        } else {
          setDoc(settingsRef, DEFAULT_STORE_SETTINGS);
          onUpdate(DEFAULT_STORE_SETTINGS);
        }
      },
      (err) => {
        console.warn('Store settings onSnapshot error:', err);
        onUpdate(DEFAULT_STORE_SETTINGS);
      }
    );
  } catch (err) {
    onUpdate(DEFAULT_STORE_SETTINGS);
    return () => {};
  }
}

export async function updateStoreSettingsInFirestore(settings: StoreSettings): Promise<void> {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, DEFAULT_SETTINGS_DOC);
    await setDoc(settingsRef, settings, { merge: true });
  } catch (err) {
    console.error('updateStoreSettingsInFirestore error:', err);
    throw err;
  }
}

/**
 * Master Admin: Subscribe to ALL store orders in real-time
 */
export function subscribeToAllOrders(
  onUpdate: (orders: Order[]) => void
) {
  try {
    const ordersCol = collection(db, ORDERS_COLLECTION);
    return onSnapshot(
      ordersCol,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Order);
        });
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        onUpdate(list);
      },
      (err) => {
        console.warn('subscribeToAllOrders error:', err);
      }
    );
  } catch (err) {
    console.warn('subscribeToAllOrders error:', err);
    return () => {};
  }
}

/**
 * Update Order status, payment status, tracking, notes in Firestore
 */
export async function updateOrderStatusInFirestore(
  orderId: string,
  userId: string,
  orderStatus: Order['orderStatus'],
  paymentStatus?: Order['paymentStatus'],
  trackingNumber?: string,
  internalNotes?: string[]
): Promise<void> {
  try {
    const updates: Partial<Order> = { orderStatus };
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (trackingNumber) updates.trackingNumber = trackingNumber;
    if (internalNotes) updates.internalNotes = internalNotes;

    const globalRef = doc(db, ORDERS_COLLECTION, orderId);
    await setDoc(globalRef, updates, { merge: true });

    if (userId) {
      const userRef = doc(db, USERS_COLLECTION, userId, 'orders', orderId);
      await setDoc(userRef, updates, { merge: true });
    }
  } catch (err) {
    console.error('updateOrderStatusInFirestore error:', err);
    throw err;
  }
}

/**
 * Real-time listener for products in Firestore.
 * Automatically seeds INITIAL_PRODUCTS if database collection is empty so marketplace is immediately populated!
 */
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (err: any) => void
) {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      async (snapshot) => {
        if (snapshot.empty && INITIAL_PRODUCTS.length > 0) {
          // Auto-seed initial multi-category products to Firestore
          try {
            for (const p of INITIAL_PRODUCTS) {
              await setDoc(doc(db, PRODUCTS_COLLECTION, p.id), p);
            }
          } catch (e) {
            console.warn('Initial catalog auto-seed notice:', e);
          }
          onUpdate(INITIAL_PRODUCTS);
          return;
        }

        const list: Product[] = [];
        snapshot.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as Product);
        });
        onUpdate(list.length > 0 ? list : INITIAL_PRODUCTS);
      },
      (error) => {
        console.warn('Products onSnapshot notification:', error.message);
        onUpdate(INITIAL_PRODUCTS);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    onUpdate(INITIAL_PRODUCTS);
    return () => {};
  }
}

/**
 * Add or update product in Firestore
 */
export async function saveProductToFirestore(product: Product): Promise<void> {
  try {
    await setDoc(doc(db, PRODUCTS_COLLECTION, product.id), product);
  } catch (error) {
    console.error('Firestore save product error:', error);
    throw error;
  }
}

/**
 * Delete product from Firestore
 */
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
  } catch (error) {
    console.error('Firestore delete product error:', error);
    throw error;
  }
}

/**
 * User Addresses in Firestore
 */
export function subscribeToUserAddresses(
  userId: string,
  onUpdate: (addresses: Address[]) => void
) {
  try {
    const addrCol = collection(db, USERS_COLLECTION, userId, 'addresses');
    return onSnapshot(
      addrCol,
      (snapshot) => {
        const list: Address[] = [];
        snapshot.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as Address);
        });
        onUpdate(list);
      },
      (err) => {
        console.warn('Addresses onSnapshot error:', err);
      }
    );
  } catch (err) {
    console.warn('subscribeToUserAddresses error:', err);
    return () => {};
  }
}

export async function saveUserAddressToFirestore(userId: string, address: Address): Promise<void> {
  try {
    const ref = doc(db, USERS_COLLECTION, userId, 'addresses', address.id);
    await setDoc(ref, address);
  } catch (err) {
    console.error('saveUserAddressToFirestore error:', err);
  }
}

export async function deleteUserAddressFromFirestore(userId: string, addressId: string): Promise<void> {
  try {
    const ref = doc(db, USERS_COLLECTION, userId, 'addresses', addressId);
    await deleteDoc(ref);
  } catch (err) {
    console.error('deleteUserAddressFromFirestore error:', err);
  }
}

/**
 * User Cart Real-time Subscription
 */
export function subscribeToCart(
  userId: string,
  onUpdate: (items: CartItem[]) => void
) {
  try {
    const cartCol = collection(db, USERS_COLLECTION, userId, 'cart');
    return onSnapshot(
      cartCol,
      (snapshot) => {
        const items: CartItem[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as CartItem);
        });
        onUpdate(items);
      },
      (err) => {
        console.warn('Cart onSnapshot error:', err);
      }
    );
  } catch (err) {
    console.warn('subscribeToCart error:', err);
    return () => {};
  }
}

export async function saveCartItem(userId: string, item: CartItem): Promise<void> {
  try {
    const ref = doc(db, USERS_COLLECTION, userId, 'cart', item.productId);
    await setDoc(ref, item);
  } catch (err) {
    console.warn('saveCartItem error:', err);
  }
}

export async function removeCartItem(userId: string, productId: string): Promise<void> {
  try {
    const ref = doc(db, USERS_COLLECTION, userId, 'cart', productId);
    await deleteDoc(ref);
  } catch (err) {
    console.warn('removeCartItem error:', err);
  }
}

export async function clearUserCart(userId: string, items: CartItem[]): Promise<void> {
  try {
    for (const item of items) {
      await deleteDoc(doc(db, USERS_COLLECTION, userId, 'cart', item.productId));
    }
  } catch (err) {
    console.warn('clearUserCart error:', err);
  }
}

/**
 * User Wishlist
 */
export function subscribeToWishlist(
  userId: string,
  onUpdate: (productIds: string[]) => void
) {
  try {
    const wishCol = collection(db, USERS_COLLECTION, userId, 'wishlist');
    return onSnapshot(
      wishCol,
      (snapshot) => {
        const ids: string[] = [];
        snapshot.forEach((d) => {
          ids.push(d.id);
        });
        onUpdate(ids);
      },
      (err) => {
        console.warn('Wishlist onSnapshot error:', err);
      }
    );
  } catch (err) {
    console.warn('subscribeToWishlist error:', err);
    return () => {};
  }
}

export async function toggleWishlistItem(
  userId: string,
  product: Product,
  isCurrentlyWishlisted: boolean
): Promise<void> {
  try {
    const ref = doc(db, USERS_COLLECTION, userId, 'wishlist', product.id);
    if (isCurrentlyWishlisted) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        productId: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        addedAt: Date.now(),
      });
    }
  } catch (err) {
    console.warn('toggleWishlistItem error:', err);
  }
}

/**
 * Orders Management
 */
export async function placeOrderInFirestore(order: Order): Promise<void> {
  try {
    await setDoc(doc(db, ORDERS_COLLECTION, order.id), order);
    await setDoc(doc(db, USERS_COLLECTION, order.userId, 'orders', order.id), order);
  } catch (err) {
    console.warn('placeOrderInFirestore error:', err);
  }
}

export function subscribeToOrders(
  userId: string,
  onUpdate: (orders: Order[]) => void
) {
  try {
    const ordersCol = collection(db, USERS_COLLECTION, userId, 'orders');
    return onSnapshot(
      ordersCol,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Order);
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        onUpdate(list);
      },
      (err) => {
        console.warn('Orders onSnapshot error:', err);
      }
    );
  } catch (err) {
    console.warn('subscribeToOrders error:', err);
    return () => {};
  }
}

/**
 * Product Reviews
 */
export function subscribeToReviews(
  productId: string,
  onUpdate: (reviews: Review[]) => void
) {
  try {
    const reviewsCol = collection(db, PRODUCTS_COLLECTION, productId, 'reviews');
    return onSnapshot(
      reviewsCol,
      (snapshot) => {
        const list: Review[] = [];
        snapshot.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as Review);
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        onUpdate(list);
      },
      (err) => {
        console.warn('Reviews onSnapshot error:', err);
      }
    );
  } catch (err) {
    console.warn('subscribeToReviews error:', err);
    return () => {};
  }
}

export async function addReviewToFirestore(review: Review): Promise<void> {
  try {
    const ref = doc(db, PRODUCTS_COLLECTION, review.productId, 'reviews', review.id);
    await setDoc(ref, review);
  } catch (err) {
    console.warn('addReviewToFirestore error:', err);
  }
}

/**
 * Coupons Management
 */
export function subscribeToCoupons(onUpdate: (coupons: Coupon[]) => void) {
  try {
    const colRef = collection(db, COUPONS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          // Initialize default coupons
          DEFAULT_COUPONS.forEach((c) => {
            setDoc(doc(db, COUPONS_COLLECTION, c.id), c);
          });
          onUpdate(DEFAULT_COUPONS);
          return;
        }
        const list: Coupon[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Coupon);
        });
        onUpdate(list);
      },
      (err) => {
        console.warn('subscribeToCoupons error:', err);
        onUpdate(DEFAULT_COUPONS);
      }
    );
  } catch {
    onUpdate(DEFAULT_COUPONS);
    return () => {};
  }
}

export async function saveCouponToFirestore(coupon: Coupon): Promise<void> {
  try {
    await setDoc(doc(db, COUPONS_COLLECTION, coupon.id), coupon);
  } catch (err) {
    console.error('saveCouponToFirestore error:', err);
    throw err;
  }
}

export async function deleteCouponFromFirestore(couponId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COUPONS_COLLECTION, couponId));
  } catch (err) {
    console.error('deleteCouponFromFirestore error:', err);
    throw err;
  }
}

/**
 * Customer Support Tickets
 */
export function subscribeToSupportTickets(onUpdate: (tickets: SupportTicket[]) => void) {
  try {
    const colRef = collection(db, TICKETS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: SupportTicket[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as SupportTicket);
        });
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        onUpdate(list);
      },
      (err) => {
        console.warn('subscribeToSupportTickets error:', err);
      }
    );
  } catch {
    return () => {};
  }
}

export async function saveSupportTicketToFirestore(ticket: SupportTicket): Promise<void> {
  try {
    await setDoc(doc(db, TICKETS_COLLECTION, ticket.id), ticket);
  } catch (err) {
    console.error('saveSupportTicketToFirestore error:', err);
    throw err;
  }
}

/**
 * Audit Logs
 */
export function subscribeToAuditLogs(onUpdate: (logs: AuditLog[]) => void) {
  try {
    const colRef = collection(db, AUDIT_LOGS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: AuditLog[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as AuditLog);
        });
        list.sort((a, b) => b.timestamp - a.timestamp);
        onUpdate(list);
      },
      (err) => {
        console.warn('subscribeToAuditLogs error:', err);
      }
    );
  } catch {
    return () => {};
  }
}

export async function logAdminActivity(
  actorEmail: string,
  category: AuditLog['category'],
  action: string,
  details: string
): Promise<void> {
  try {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actorEmail,
      category,
      action,
      details,
      timestamp: Date.now(),
    };
    await setDoc(doc(db, AUDIT_LOGS_COLLECTION, log.id), log);
  } catch (err) {
    console.warn('logAdminActivity error:', err);
  }
}

/**
 * Automation Rules
 */
export function subscribeToAutomationRules(onUpdate: (rules: AutomationRule[]) => void) {
  try {
    const colRef = collection(db, AUTOMATIONS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          DEFAULT_AUTOMATION_RULES.forEach((r) => {
            setDoc(doc(db, AUTOMATIONS_COLLECTION, r.id), r);
          });
          onUpdate(DEFAULT_AUTOMATION_RULES);
          return;
        }
        const list: AutomationRule[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as AutomationRule);
        });
        onUpdate(list);
      },
      (err) => {
        console.warn('subscribeToAutomationRules error:', err);
        onUpdate(DEFAULT_AUTOMATION_RULES);
      }
    );
  } catch {
    onUpdate(DEFAULT_AUTOMATION_RULES);
    return () => {};
  }
}

export async function saveAutomationRuleToFirestore(rule: AutomationRule): Promise<void> {
  try {
    await setDoc(doc(db, AUTOMATIONS_COLLECTION, rule.id), rule);
  } catch (err) {
    console.error('saveAutomationRuleToFirestore error:', err);
  }
}

/**
 * Stock Movements
 */
export function subscribeToStockMovements(onUpdate: (movements: StockMovement[]) => void) {
  try {
    const colRef = collection(db, STOCK_MOVEMENTS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: StockMovement[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as StockMovement);
        });
        list.sort((a, b) => b.timestamp - a.timestamp);
        onUpdate(list);
      },
      (err) => {
        console.warn('subscribeToStockMovements error:', err);
      }
    );
  } catch {
    return () => {};
  }
}

export async function logStockMovement(movement: Omit<StockMovement, 'id' | 'timestamp'>): Promise<void> {
  try {
    const item: StockMovement = {
      ...movement,
      id: `sm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
    };
    await setDoc(doc(db, STOCK_MOVEMENTS_COLLECTION, item.id), item);
  } catch (err) {
    console.warn('logStockMovement error:', err);
  }
}

/**
 * Real-time subscription to all registered users in Firebase Firestore
 */
export function subscribeToAllUsers(onUpdate: (users: UserProfile[]) => void) {
  try {
    const colRef = collection(db, USERS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            uid: data.uid || d.id,
            email: data.email || null,
            displayName: data.displayName || null,
            photoURL: data.photoURL || null,
            phoneNumber: data.phoneNumber || undefined,
            role: data.role || 'customer',
            walletBalance: data.walletBalance || 0,
          });
        });
        onUpdate(list);
      },
      (err) => {
        console.warn('subscribeToAllUsers warning:', err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Save / Upsert user profile to Firestore users collection
 */
export async function saveUserProfileToFirestore(user: UserProfile): Promise<void> {
  try {
    const ref = doc(db, USERS_COLLECTION, user.uid);
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber || null,
      role: user.role || 'customer',
      walletBalance: user.walletBalance || 0,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.error('saveUserProfileToFirestore error:', err);
    throw err;
  }
}

/**
 * Fetch one-time list of all users from Firestore
 */
export async function fetchUsersFromFirestore(): Promise<UserProfile[]> {
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const snap = await getDocs(colRef);
    const list: UserProfile[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        uid: data.uid || d.id,
        email: data.email || null,
        displayName: data.displayName || null,
        photoURL: data.photoURL || null,
        phoneNumber: data.phoneNumber || undefined,
        role: data.role || 'customer',
        walletBalance: data.walletBalance || 0,
      });
    });
    return list;
  } catch (err) {
    console.warn('fetchUsersFromFirestore warning:', err);
    return [];
  }
}
