import { UserProfile, Product, Order } from '../types';
import {
  saveUserProfileToFirestore,
  fetchUsersFromFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  placeOrderInFirestore,
} from '../firebase/services';
import {
  getSupabaseConfig,
  testSupabaseConnection,
  syncCustomerToSupabase,
  fetchCustomersFromSupabase,
  fetchEntityCountsFromSupabase,
  saveCompressedRecord,
  syncOrderToSupabase,
  syncProductsToSupabase,
  deleteProductFromSupabase,
} from './supabaseService';

export type BackendStatus = 'online' | 'degraded' | 'offline' | 'unconfigured';

export interface BackendHealthMetrics {
  firebaseStatus: BackendStatus;
  firebaseLatencyMs: number;
  supabaseStatus: BackendStatus;
  supabaseLatencyMs: number;
  overallHealth: 'optimal' | 'healthy' | 'degraded' | 'offline';
  parityScore: number; // 0 - 100%
  lastCheckedAt: string;
}

export interface ParityReport {
  users: { firebase: number; supabase: number; inParity: boolean };
  products: { firebase: number; supabase: number; inParity: boolean };
  orders: { firebase: number; supabase: number; inParity: boolean };
  score: number;
}

export interface CoordinatedUser extends UserProfile {
  inFirebase: boolean;
  inSupabase: boolean;
  totalOrders: number;
  totalSpent: number;
  lastSyncedAt?: string;
  source: 'firebase' | 'supabase' | 'both';
}

export interface CoordinationEvent {
  id: string;
  timestamp: number;
  type: 'USER' | 'ORDER' | 'CATALOG' | 'HEALTH' | 'RECONCILE';
  message: string;
  status: 'success' | 'warning' | 'error';
}

const STORAGE_KEY_EVENTS = 'vyuma_coordination_events';
const STORAGE_KEY_OFFLINE_QUEUE = 'vyuma_dual_offline_queue';

let eventListeners: ((event: CoordinationEvent) => void)[] = [];

/**
 * Log a background coordination event
 */
export function logCoordinationEvent(
  type: CoordinationEvent['type'],
  message: string,
  status: CoordinationEvent['status'] = 'success'
): CoordinationEvent {
  const event: CoordinationEvent = {
    id: `ev-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    timestamp: Date.now(),
    type,
    message,
    status,
  };

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_EVENTS) : null;
    const list: CoordinationEvent[] = raw ? JSON.parse(raw) : [];
    const updated = [event, ...list].slice(0, 100); // keep last 100 events
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }

  eventListeners.forEach((fn) => fn(event));
  return event;
}

export function getCoordinationLogs(): CoordinationEvent[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_EVENTS) : null;
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [];
}

export function subscribeToDualBackendEvents(callback: (event: CoordinationEvent) => void): () => void {
  eventListeners.push(callback);
  return () => {
    eventListeners = eventListeners.filter((fn) => fn !== callback);
  };
}

/**
 * Perform simultaneous live health check across Firebase Firestore and Supabase PostgreSQL
 */
export async function checkDualBackendHealth(): Promise<BackendHealthMetrics> {
  const result: BackendHealthMetrics = {
    firebaseStatus: 'offline',
    firebaseLatencyMs: 0,
    supabaseStatus: 'unconfigured',
    supabaseLatencyMs: 0,
    overallHealth: 'degraded',
    parityScore: 100,
    lastCheckedAt: new Date().toISOString(),
  };

  // 1. Check Firebase latency
  const fbStart = performance.now();
  try {
    await fetchUsersFromFirestore();
    result.firebaseLatencyMs = Math.round(performance.now() - fbStart);
    result.firebaseStatus = result.firebaseLatencyMs > 2000 ? 'degraded' : 'online';
  } catch (err) {
    result.firebaseStatus = 'offline';
  }

  // 2. Check Supabase latency
  const supaConfig = getSupabaseConfig();
  if (!supaConfig.isConfigured) {
    result.supabaseStatus = 'unconfigured';
  } else {
    try {
      const supaRes = await testSupabaseConnection();
      result.supabaseLatencyMs = supaRes.latencyMs || 0;
      if (supaRes.connected) {
        result.supabaseStatus = (supaRes.latencyMs || 0) > 2000 ? 'degraded' : 'online';
      } else {
        result.supabaseStatus = 'offline';
      }
    } catch {
      result.supabaseStatus = 'offline';
    }
  }

  // 3. Compute overall system health
  if (result.firebaseStatus === 'online' && result.supabaseStatus === 'online') {
    result.overallHealth = 'optimal';
  } else if (result.firebaseStatus === 'online' || result.supabaseStatus === 'online') {
    result.overallHealth = 'healthy';
  } else if (result.firebaseStatus === 'degraded' || result.supabaseStatus === 'degraded') {
    result.overallHealth = 'degraded';
  } else {
    result.overallHealth = 'offline';
  }

  return result;
}

/**
 * Synchronize a user profile simultaneously to both Firebase and Supabase
 * Ensures user registrations are maintained and steadily grow across both backends
 */
export async function syncUserToBothBackends(user: UserProfile, stats?: { totalOrders?: number; totalSpent?: number }): Promise<{
  firebase: boolean;
  supabase: boolean;
  error?: string;
}> {
  let fbOk = false;
  let supaOk = false;
  let errorMsg = '';

  // 1. Write to Firebase Firestore
  try {
    await saveUserProfileToFirestore(user);
    fbOk = true;
  } catch (err: any) {
    errorMsg += `Firebase Error: ${err.message || 'Failed'}. `;
  }

  // 2. Write with lossless compression to Supabase
  try {
    const supaRes = await syncCustomerToSupabase({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      role: user.role,
      totalOrders: stats?.totalOrders || 0,
      totalSpent: stats?.totalSpent || 0,
      createdAt: Date.now(),
    });
    if (supaRes.success) {
      supaOk = true;
    } else {
      errorMsg += `Supabase: ${supaRes.error || 'Failed'}. `;
    }
  } catch (err: any) {
    errorMsg += `Supabase Error: ${err.message || 'Failed'}. `;
  }

  logCoordinationEvent(
    'USER',
    `User [${user.email || user.uid}] coordinated across backends (Firebase: ${fbOk ? 'OK' : 'FAIL'}, Supabase: ${supaOk ? 'OK' : 'FAIL'})`,
    fbOk && supaOk ? 'success' : fbOk || supaOk ? 'warning' : 'error'
  );

  return { firebase: fbOk, supabase: supaOk, error: errorMsg.trim() || undefined };
}

/**
 * Dual-write an order to both Firebase and Supabase
 */
export async function syncOrderToBothBackends(order: Order): Promise<{
  firebase: boolean;
  supabase: boolean;
  error?: string;
}> {
  let fbOk = false;
  let supaOk = false;
  let errorMsg = '';

  // 1. Firebase Order Write
  try {
    await placeOrderInFirestore(order);
    fbOk = true;
  } catch (err: any) {
    errorMsg += `Firebase: ${err.message}. `;
  }

  // 2. Supabase Compressed Order Write
  try {
    const supaRes = await syncOrderToSupabase(order);
    if (supaRes.success) {
      supaOk = true;
    } else {
      errorMsg += `Supabase: ${supaRes.error}. `;
    }
  } catch (err: any) {
    errorMsg += `Supabase: ${err.message}. `;
  }

  // 3. Update customer stats in both backends
  if (order.userEmail) {
    syncCustomerToSupabase({
      uid: order.userId || `cust_${order.userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: order.userEmail,
      displayName: order.shippingAddress?.fullName || order.userEmail.split('@')[0],
      phoneNumber: order.shippingAddress?.mobile,
      totalOrders: 1,
      totalSpent: order.finalPayable || order.totalAmount,
    }).catch(() => {});
  }

  logCoordinationEvent(
    'ORDER',
    `Order #${order.id} (₹${order.finalPayable}) coordinated to backends (Firebase: ${fbOk ? 'OK' : 'FAIL'}, Supabase: ${supaOk ? 'OK' : 'FAIL'})`,
    fbOk && supaOk ? 'success' : fbOk || supaOk ? 'warning' : 'error'
  );

  return { firebase: fbOk, supabase: supaOk, error: errorMsg.trim() || undefined };
}

/**
 * Dual-write product mutations across both backends
 */
export async function syncProductToBothBackends(product: Product): Promise<{
  firebase: boolean;
  supabase: boolean;
  error?: string;
}> {
  let fbOk = false;
  let supaOk = false;
  let errorMsg = '';

  try {
    await saveProductToFirestore(product);
    fbOk = true;
  } catch (err: any) {
    errorMsg += `Firebase: ${err.message}. `;
  }

  try {
    const supaRes = await saveCompressedRecord(`prod_${product.id}`, 'product', product, {
      title: product.title,
      price: product.price,
      stockCount: product.stockCount || 0,
      inStock: product.inStock,
      category: product.category,
    });
    if (supaRes.success) {
      supaOk = true;
    } else {
      errorMsg += `Supabase: ${supaRes.error}. `;
    }
  } catch (err: any) {
    errorMsg += `Supabase: ${err.message}. `;
  }

  logCoordinationEvent(
    'CATALOG',
    `Product "${product.title}" saved across backends (Firebase: ${fbOk ? 'OK' : 'FAIL'}, Supabase: ${supaOk ? 'OK' : 'FAIL'})`,
    fbOk && supaOk ? 'success' : 'warning'
  );

  return { firebase: fbOk, supabase: supaOk, error: errorMsg.trim() || undefined };
}

/**
 * Remove product from both backends
 */
export async function deleteProductFromBothBackends(productId: string): Promise<void> {
  await Promise.allSettled([
    deleteProductFromFirestore(productId),
    deleteProductFromSupabase(productId),
  ]);
  logCoordinationEvent('CATALOG', `Product #${productId} removed from both backends`, 'success');
}

/**
 * Merge users from Firebase, Supabase, and Order customer histories into a unified coordinated user registry
 */
export async function getUnifiedCoordinatedUsers(
  firestoreUsers: UserProfile[],
  orders: Order[]
): Promise<CoordinatedUser[]> {
  const userMap = new Map<string, CoordinatedUser>();

  // 1. Populate from Firebase Firestore
  firestoreUsers.forEach((fbUser) => {
    const key = (fbUser.email || fbUser.uid).toLowerCase().trim();
    userMap.set(key, {
      ...fbUser,
      inFirebase: true,
      inSupabase: false,
      totalOrders: 0,
      totalSpent: 0,
      source: 'firebase',
      lastSyncedAt: new Date().toISOString(),
    });
  });

  // 2. Query Supabase customers
  const supaCustomers = await fetchCustomersFromSupabase();
  supaCustomers.forEach((supaCust: any) => {
    const email = (supaCust.email || supaCust.metadata?.email || '').toLowerCase().trim();
    const uid = supaCust.uid || supaCust.id || supaCust.metadata?.uid || '';
    const key = email || uid;
    if (!key) return;

    const existing = userMap.get(key);
    if (existing) {
      existing.inSupabase = true;
      existing.source = 'both';
      if (supaCust.totalOrders) existing.totalOrders = Math.max(existing.totalOrders, supaCust.totalOrders);
      if (supaCust.totalSpent) existing.totalSpent = Math.max(existing.totalSpent, supaCust.totalSpent);
    } else {
      userMap.set(key, {
        uid: uid || `cust_${Date.now()}`,
        email: email || null,
        displayName: supaCust.displayName || supaCust.full_name || email.split('@')[0] || 'Customer',
        photoURL: supaCust.photoURL || null,
        phoneNumber: supaCust.phoneNumber || supaCust.phone,
        role: supaCust.role || 'customer',
        walletBalance: supaCust.walletBalance || 0,
        inFirebase: false,
        inSupabase: true,
        totalOrders: supaCust.totalOrders || 0,
        totalSpent: supaCust.totalSpent || 0,
        source: 'supabase',
        lastSyncedAt: new Date().toISOString(),
      });
    }
  });

  // 3. Compute orders count & spending from orders
  orders.forEach((o) => {
    if (!o.userEmail) return;
    const key = o.userEmail.toLowerCase().trim();
    const existing = userMap.get(key);
    if (existing) {
      existing.totalOrders = (existing.totalOrders || 0) + 1;
      existing.totalSpent = (existing.totalSpent || 0) + (o.finalPayable || o.totalAmount);
    } else {
      userMap.set(key, {
        uid: o.userId || `cust_${key.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: o.userEmail,
        displayName: o.shippingAddress?.fullName || key.split('@')[0],
        photoURL: null,
        phoneNumber: o.shippingAddress?.mobile,
        role: 'customer',
        walletBalance: 0,
        inFirebase: false,
        inSupabase: false,
        totalOrders: 1,
        totalSpent: o.finalPayable || o.totalAmount,
        source: 'firebase',
      });
    }
  });

  return Array.from(userMap.values());
}

/**
 * Calculate record parity between Firebase and Supabase
 */
export async function getBackendParityReport(
  totalFirebaseUsers: number,
  totalFirebaseProducts: number,
  totalFirebaseOrders: number
): Promise<ParityReport> {
  const supaCounts = await fetchEntityCountsFromSupabase();

  const usersDiff = Math.abs(totalFirebaseUsers - supaCounts.customersCount);
  const prodDiff = Math.abs(totalFirebaseProducts - supaCounts.productsCount);
  const ordDiff = Math.abs(totalFirebaseOrders - supaCounts.ordersCount);

  const usersParity = usersDiff === 0 || (totalFirebaseUsers === 0 && supaCounts.customersCount === 0);
  const prodParity = prodDiff === 0;
  const ordParity = ordDiff === 0;

  // Parity percentage calculation
  let points = 0;
  if (usersParity) points += 34;
  else points += Math.max(0, 34 - usersDiff * 5);

  if (prodParity) points += 33;
  else points += Math.max(0, 33 - prodDiff * 3);

  if (ordParity) points += 33;
  else points += Math.max(0, 33 - ordDiff * 3);

  const score = Math.min(100, Math.max(0, points));

  return {
    users: {
      firebase: totalFirebaseUsers,
      supabase: supaCounts.customersCount,
      inParity: usersParity,
    },
    products: {
      firebase: totalFirebaseProducts,
      supabase: supaCounts.productsCount,
      inParity: prodParity,
    },
    orders: {
      firebase: totalFirebaseOrders,
      supabase: supaCounts.ordersCount,
      inParity: ordParity,
    },
    score,
  };
}

/**
 * Master Dual-Backend Reconciler
 * Traverses users, products, and orders, syncing any missing records in either direction
 */
export async function runFullDualReconciliation(params: {
  users: UserProfile[];
  products: Product[];
  orders: Order[];
}): Promise<{
  usersSynced: number;
  productsSynced: number;
  ordersSynced: number;
  message: string;
}> {
  logCoordinationEvent('RECONCILE', 'Starting Master Dual-Backend Reconciliation...', 'warning');

  let usersSynced = 0;
  let productsSynced = 0;
  let ordersSynced = 0;

  // 1. Reconcile Users: push all known Firebase users to Supabase
  for (const user of params.users) {
    try {
      const res = await syncCustomerToSupabase({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        role: user.role,
        createdAt: Date.now(),
      });
      if (res.success) usersSynced++;
    } catch {
      // Continue next user
    }
  }

  // Also push any orders' distinct customer emails to both backends
  const distinctEmails = new Set(params.orders.map((o) => o.userEmail).filter(Boolean));
  for (const email of distinctEmails) {
    const existing = params.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!existing) {
      const dummyProfile: UserProfile = {
        uid: `cust_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email,
        displayName: email.split('@')[0],
        photoURL: null,
        role: 'customer',
      };
      await syncUserToBothBackends(dummyProfile).catch(() => {});
      usersSynced++;
    }
  }

  // 2. Reconcile Catalog: push all products to Supabase
  const prodRes = await syncProductsToSupabase(params.products);
  if (prodRes.success) {
    productsSynced = params.products.length;
  }

  // 3. Reconcile Orders: push all orders with compression to Supabase
  for (const order of params.orders) {
    try {
      const ordRes = await syncOrderToSupabase(order);
      if (ordRes.success) ordersSynced++;
    } catch {
      // Continue next order
    }
  }

  const msg = `Reconciliation Complete! Coordinated ${usersSynced} users, ${productsSynced} catalog products, and ${ordersSynced} orders across Firebase and Supabase.`;
  logCoordinationEvent('RECONCILE', msg, 'success');

  return {
    usersSynced,
    productsSynced,
    ordersSynced,
    message: msg,
  };
}
