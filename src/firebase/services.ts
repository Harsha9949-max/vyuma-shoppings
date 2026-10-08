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
import { CartItem, Order, Product, Review, StoreSettings, Address } from '../types';

const PRODUCTS_COLLECTION = 'products';
const USERS_COLLECTION = 'users';
const ORDERS_COLLECTION = 'orders';
const SETTINGS_COLLECTION = 'settings';
const DEFAULT_SETTINGS_DOC = 'store_config';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  announcementText: '',
  showAnnouncement: false,
  isFlashSaleActive: false,
  flashSaleEndsInHours: 0,
  maintenanceMode: false,
  razorpayKeyId: 'rzp_live_vyuma',
  razorpayLiveMode: true,
};

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
          onUpdate(snapshot.data() as StoreSettings);
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
 * Update Order status & payment status in Firestore (both global and user subcollection)
 */
export async function updateOrderStatusInFirestore(
  orderId: string,
  userId: string,
  orderStatus: Order['orderStatus'],
  paymentStatus?: Order['paymentStatus']
): Promise<void> {
  try {
    const updates: Partial<Order> = { orderStatus };
    if (paymentStatus) {
      updates.paymentStatus = paymentStatus;
    }

    // Global order doc
    const globalRef = doc(db, ORDERS_COLLECTION, orderId);
    await setDoc(globalRef, updates, { merge: true });

    // User subcollection order doc
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
 * Strictly loads only real products from the database; never injects fake or placeholder products.
 */
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (err: any) => void
) {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as Product);
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Products onSnapshot notification:', error.message);
        // Clean empty state - absolutely no fake product fallbacks
        onUpdate([]);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    onUpdate([]);
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

export async function clearUserCart(userId: string, currentItems: CartItem[]): Promise<void> {
  try {
    for (const item of currentItems) {
      await deleteDoc(doc(db, USERS_COLLECTION, userId, 'cart', item.productId));
    }
  } catch (err) {
    console.warn('clearUserCart error:', err);
  }
}

/**
 * Wishlist Real-time Subscription
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
    // Save to global orders collection
    await setDoc(doc(db, ORDERS_COLLECTION, order.id), order);
    // Also save in user subcollection for fast querying
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
        // Sort descending by creation date
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
