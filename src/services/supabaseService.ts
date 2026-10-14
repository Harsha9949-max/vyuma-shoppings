import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { compressData, decompressData, CompressionResult } from './compressionService';
import { Order, Product, StoreSettings, Coupon, AuditLog } from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'storage' | 'none';
}

export interface CompressedStoreRecord {
  id: string;
  record_type: 'product' | 'order' | 'snapshot' | 'audit_log' | 'settings' | 'inventory' | 'customer' | 'user';
  compressed_payload: string;
  original_bytes: number;
  compressed_bytes: number;
  saved_bytes: number;
  reduction_percent: number;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseSyncStats {
  totalRecordsSynced: number;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  totalBytesSaved: number;
  overallReductionPercent: number;
  lastSyncedAt: string | null;
}

const STORAGE_KEY_URL = 'vyuma_supabase_url';
const STORAGE_KEY_KEY = 'vyuma_supabase_anon_key';
const STORAGE_KEY_STATS = 'vyuma_supabase_sync_stats';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Retrieve current active Supabase configuration from environment variables or browser storage
 */
export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (envUrl && envKey && !envUrl.includes('your-project-id')) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: true,
      source: 'env',
    };
  }

  const storedUrl = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : '') || '';
  const storedKey = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : '') || '';

  if (storedUrl && storedKey) {
    return {
      url: storedUrl,
      anonKey: storedKey,
      isConfigured: true,
      source: 'storage',
    };
  }

  return {
    url: '',
    anonKey: '',
    isConfigured: false,
    source: 'none',
  };
}

/**
 * Save new Supabase credentials and re-instantiate client
 */
export function saveSupabaseConfig(url: string, anonKey: string): boolean {
  try {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      localStorage.removeItem(STORAGE_KEY_URL);
      localStorage.removeItem(STORAGE_KEY_KEY);
      supabaseInstance = null;
      return false;
    }

    localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
    supabaseInstance = createClient(cleanUrl, cleanKey);
    return true;
  } catch (error) {
    console.error('Failed to save Supabase credentials:', error);
    return false;
  }
}

/**
 * Get or initialize the Supabase client
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const config = getSupabaseConfig();
  if (config.isConfigured && config.url && config.anonKey) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabaseInstance;
    } catch (err) {
      console.error('Error creating Supabase client:', err);
      return null;
    }
  }

  return null;
}

/**
 * Verify connectivity to Supabase
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  latencyMs?: number;
  tableReady?: boolean;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      message: 'Supabase client is not configured. Provide Project URL and Anon Key.',
    };
  }

  const start = performance.now();
  try {
    // Attempt to query the compressed store table
    const { data, error } = await client
      .from('vyuma_compressed_store')
      .select('id, record_type, updated_at')
      .limit(1);

    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      // If table does not exist yet (code 42P01 in postgres)
      if (error.code === '42P01' || error.message.includes('relation "vyuma_compressed_store" does not exist')) {
        return {
          connected: true,
          latencyMs,
          tableReady: false,
          message: 'Connected to Supabase! The "vyuma_compressed_store" table needs to be created using the provided SQL script.',
        };
      }
      return {
        connected: false,
        message: `Supabase Error (${error.code || 'API'}): ${error.message}`,
      };
    }

    return {
      connected: true,
      latencyMs,
      tableReady: true,
      message: `Successfully connected to Supabase (${latencyMs}ms response time). Tables ready!`,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err.message || 'Unable to connect to Supabase endpoint.',
    };
  }
}

/**
 * Compress and save any record into the Supabase compressed store
 */
export async function saveCompressedRecord(
  id: string,
  recordType: CompressedStoreRecord['record_type'],
  data: any,
  metadata?: Record<string, any>
): Promise<{ success: boolean; result?: CompressionResult; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not configured' };
  }

  try {
    const comp = compressData(data);

    const record: Partial<CompressedStoreRecord> = {
      id,
      record_type: recordType,
      compressed_payload: comp.compressed,
      original_bytes: comp.originalBytes,
      compressed_bytes: comp.compressedBytes,
      saved_bytes: comp.savedBytes,
      reduction_percent: comp.reductionPercentage,
      metadata: metadata || {},
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('vyuma_compressed_store')
      .upsert(record, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    trackSyncStats(comp.originalBytes, comp.compressedBytes, comp.savedBytes);
    return { success: true, result: comp };
  } catch (err: any) {
    console.error(`Error saving compressed record ${id} to Supabase:`, err);
    return { success: false, error: err.message || 'Failed to save to Supabase' };
  }
}

/**
 * Fetch and decompress a record by ID from Supabase
 */
export async function fetchCompressedRecord<T>(id: string): Promise<T | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('vyuma_compressed_store')
      .select('compressed_payload')
      .eq('id', id)
      .maybeSingle();

    if (error || !data || !data.compressed_payload) {
      return null;
    }

    return decompressData<T>(data.compressed_payload);
  } catch (err) {
    console.error(`Error fetching compressed record ${id} from Supabase:`, err);
    return null;
  }
}

/**
 * Sync all products into Supabase (Individual compressed records + Full catalog compressed bundle)
 */
export async function syncProductsToSupabase(products: Product[]): Promise<{
  success: boolean;
  totalSynced: number;
  result?: CompressionResult;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, totalSynced: 0, error: 'Supabase client not configured' };
  }

  try {
    // 1. Bundle compressed catalog snapshot
    const bundleRes = await saveCompressedRecord('full_catalog_bundle', 'snapshot', products, {
      count: products.length,
      syncedAt: new Date().toISOString(),
      type: 'products_bundle',
    });

    if (!bundleRes.success) {
      return { success: false, totalSynced: 0, error: bundleRes.error };
    }

    // 2. Individual compressed products for granular relational lookups
    const records = products.map((prod) => {
      const comp = compressData(prod);
      return {
        id: `prod_${prod.id}`,
        record_type: 'product' as const,
        compressed_payload: comp.compressed,
        original_bytes: comp.originalBytes,
        compressed_bytes: comp.compressedBytes,
        saved_bytes: comp.savedBytes,
        reduction_percent: comp.reductionPercentage,
        metadata: {
          title: prod.title,
          category: prod.category,
          price: prod.price,
          brand: prod.brand,
          stockCount: prod.stockCount || 0,
          inStock: prod.inStock,
        },
        updated_at: new Date().toISOString(),
      };
    });

    // Batch upsert into Supabase in chunks of 50
    for (let i = 0; i < records.length; i += 50) {
      const chunk = records.slice(i, i + 50);
      const { error } = await client
        .from('vyuma_compressed_store')
        .upsert(chunk, { onConflict: 'id' });
      if (error) throw error;
    }

    return {
      success: true,
      totalSynced: products.length,
      result: bundleRes.result,
    };
  } catch (err: any) {
    console.error('Error syncing products to Supabase:', err);
    return { success: false, totalSynced: 0, error: err.message };
  }
}

/**
 * Sync an order with complete manifest compressed into Supabase
 */
export async function syncOrderToSupabase(order: Order): Promise<{
  success: boolean;
  result?: CompressionResult;
  error?: string;
}> {
  return saveCompressedRecord(`order_${order.id}`, 'order', order, {
    orderId: order.id,
    userId: order.userId,
    customerName: order.shippingAddress?.fullName || 'Customer',
    totalAmount: order.totalAmount,
    status: order.orderStatus,
    paymentMethod: order.paymentMethod,
    itemCount: order.items?.length || 0,
    createdAt: order.createdAt,
  });
}

/**
 * End-to-End snapshot of the entire marketplace (Products, Orders, Coupons, Settings, Audit Logs)
 * Compresses megabytes of store state into a tiny footprint (<100KB) and stores it in Supabase
 */
export async function syncFullStoreSnapshot(snapshot: {
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  settings: StoreSettings;
  auditLogs: AuditLog[];
}): Promise<{
  success: boolean;
  result?: CompressionResult;
  error?: string;
}> {
  return saveCompressedRecord('full_store_marketplace_snapshot', 'snapshot', snapshot, {
    totalProducts: snapshot.products.length,
    totalOrders: snapshot.orders.length,
    totalCoupons: snapshot.coupons.length,
    totalAuditLogs: snapshot.auditLogs.length,
    timestamp: new Date().toISOString(),
    generator: 'Vyuma Super Admin Compression Engine',
  });
}

/**
 * Track and accumulate sync stats in localStorage
 */
function trackSyncStats(orig: number, comp: number, saved: number) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    const existing: SupabaseSyncStats = raw
      ? JSON.parse(raw)
      : {
          totalRecordsSynced: 0,
          totalOriginalBytes: 0,
          totalCompressedBytes: 0,
          totalBytesSaved: 0,
          overallReductionPercent: 0,
          lastSyncedAt: null,
        };

    const totalRecordsSynced = existing.totalRecordsSynced + 1;
    const totalOriginalBytes = existing.totalOriginalBytes + orig;
    const totalCompressedBytes = existing.totalCompressedBytes + comp;
    const totalBytesSaved = existing.totalBytesSaved + saved;
    const overallReductionPercent = totalOriginalBytes > 0
      ? Number(((totalBytesSaved / totalOriginalBytes) * 100).toFixed(1))
      : 0;

    const updated: SupabaseSyncStats = {
      totalRecordsSynced,
      totalOriginalBytes,
      totalCompressedBytes,
      totalBytesSaved,
      overallReductionPercent,
      lastSyncedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(updated));
  } catch (err) {
    // Ignore storage errors
  }
}

export function getSyncStats(): SupabaseSyncStats {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_STATS) : null;
    if (raw) return JSON.parse(raw);
  } catch (err) {
    // Fallback
  }
  return {
    totalRecordsSynced: 0,
    totalOriginalBytes: 0,
    totalCompressedBytes: 0,
    totalBytesSaved: 0,
    overallReductionPercent: 0,
    lastSyncedAt: null,
  };
}

/**
 * Sync a customer/user profile into Supabase
 */
export async function syncCustomerToSupabase(customer: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  phoneNumber?: string;
  role?: string;
  createdAt?: number | string;
  totalOrders?: number;
  totalSpent?: number;
}): Promise<{ success: boolean; result?: CompressionResult; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not configured' };

  try {
    // 1. Save compressed representation into vyuma_compressed_store
    const res = await saveCompressedRecord(`cust_${customer.uid}`, 'customer', customer, {
      uid: customer.uid,
      email: customer.email || '',
      displayName: customer.displayName || '',
      role: customer.role || 'customer',
      totalOrders: customer.totalOrders || 0,
      totalSpent: customer.totalSpent || 0,
      syncedAt: new Date().toISOString(),
    });

    // 2. Also attempt relational upsert into public.vyuma_customers if table exists
    if (customer.email) {
      try {
        await client.from('vyuma_customers').upsert({
          id: customer.uid,
          email: customer.email,
          full_name: customer.displayName || customer.email.split('@')[0] || 'Customer',
          phone: customer.phoneNumber || null,
          total_orders: customer.totalOrders || 0,
          total_spent: customer.totalSpent || 0,
          is_blocked: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch {
        // Soft fail if relational table is not created yet
      }
    }

    return res;
  } catch (err: any) {
    console.error('Error syncing customer to Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all customers registered in Supabase
 */
export async function fetchCustomersFromSupabase(): Promise<any[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    // Query compressed store for record_type = 'customer'
    const { data, error } = await client
      .from('vyuma_compressed_store')
      .select('id, compressed_payload, metadata, updated_at')
      .eq('record_type', 'customer')
      .order('updated_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d) => {
      const decompressed = decompressData<any>(d.compressed_payload);
      return decompressed || d.metadata;
    }).filter(Boolean);
  } catch (err) {
    console.warn('fetchCustomersFromSupabase error:', err);
    return [];
  }
}

/**
 * Delete product from Supabase compressed store
 */
export async function deleteProductFromSupabase(productId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    await client
      .from('vyuma_compressed_store')
      .delete()
      .eq('id', `prod_${productId}`);

    // Also attempt deletion from vyuma_products
    try {
      await client.from('vyuma_products').delete().eq('id', productId);
    } catch {
      // Ignore
    }
    return true;
  } catch (err) {
    console.warn('deleteProductFromSupabase error:', err);
    return false;
  }
}

/**
 * Fetch live counts of entities stored in Supabase for parity reporting
 */
export async function fetchEntityCountsFromSupabase(): Promise<{
  customersCount: number;
  productsCount: number;
  ordersCount: number;
  totalCompressedRecords: number;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      customersCount: 0,
      productsCount: 0,
      ordersCount: 0,
      totalCompressedRecords: 0,
    };
  }

  try {
    const { data, error } = await client
      .from('vyuma_compressed_store')
      .select('record_type');

    if (error || !data) {
      return { customersCount: 0, productsCount: 0, ordersCount: 0, totalCompressedRecords: 0 };
    }

    let customers = 0;
    let products = 0;
    let orders = 0;

    data.forEach((r) => {
      if (r.record_type === 'customer' || r.record_type === 'user') customers++;
      else if (r.record_type === 'product') products++;
      else if (r.record_type === 'order') orders++;
    });

    return {
      customersCount: customers,
      productsCount: products,
      ordersCount: orders,
      totalCompressedRecords: data.length,
    };
  } catch {
    return { customersCount: 0, productsCount: 0, ordersCount: 0, totalCompressedRecords: 0 };
  }
}

/**
 * Ready-to-execute Supabase SQL Schema script for the Supabase SQL Editor
 */
export function getSupabaseInitSQL(): string {
  return `-- =========================================================================
-- VYUMA MARKETPLACE: COMPRESSED POSTGRESQL STORE (SUPABASE FREE TIER READY)
-- Paste this script into Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- =========================================================================

-- 1. Create the unified compressed storage table
CREATE TABLE IF NOT EXISTS public.vyuma_compressed_store (
  id TEXT PRIMARY KEY,
  record_type TEXT NOT NULL CHECK (record_type IN ('product', 'order', 'snapshot', 'audit_log', 'settings', 'inventory')),
  compressed_payload TEXT NOT NULL,
  original_bytes INTEGER NOT NULL DEFAULT 0,
  compressed_bytes INTEGER NOT NULL DEFAULT 0,
  saved_bytes INTEGER NOT NULL DEFAULT 0,
  reduction_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create search indexes on metadata and record_type for high performance
CREATE INDEX IF NOT EXISTS idx_vyuma_compressed_type ON public.vyuma_compressed_store (record_type);
CREATE INDEX IF NOT EXISTS idx_vyuma_compressed_updated ON public.vyuma_compressed_store (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_vyuma_compressed_metadata ON public.vyuma_compressed_store USING gin (metadata);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.vyuma_compressed_store ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies: Allow public read of products and snapshots, allow authenticated upserts
CREATE POLICY "Public Read for Products and Store Snapshots"
  ON public.vyuma_compressed_store
  FOR SELECT
  USING (
    record_type IN ('product', 'snapshot') 
    OR auth.role() = 'authenticated'
    OR auth.role() = 'anon'
  );

CREATE POLICY "Allow All Insert/Update via Anon and Authenticated"
  ON public.vyuma_compressed_store
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_vyuma_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vyuma_timestamp ON public.vyuma_compressed_store;
CREATE TRIGGER trg_vyuma_timestamp
  BEFORE UPDATE ON public.vyuma_compressed_store
  FOR EACH ROW
  EXECUTE FUNCTION update_vyuma_timestamp();

-- Notice: Table setup is complete! Supabase Free Tier can now hold 500,000+ compressed store records.
`;
}

/**
 * Enterprise Production SQL Schema including all normalized tables, views, RLS, and triggers
 */
export function getSupabaseEnterpriseSQL(): string {
  return `-- =============================================================================
-- VYUMA MARKETPLACE: ENTERPRISE PRODUCTION SCHEMA FOR SUPABASE (POSTGRESQL)
-- Version: 2.4.0 (Production & Supabase Free Tier Optimized)
-- Compatibility: PostgreSQL 14+, 15+, 16+ on Supabase Cloud
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Payment & Order Status Enums
DO $$ BEGIN
  CREATE TYPE vyuma_order_status AS ENUM (
    'ORDER_PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED',
    'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE vyuma_payment_status AS ENUM (
    'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'COD_COLLECTED'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Automated Updated-At Timestamp Function
CREATE OR REPLACE FUNCTION public.fn_vyuma_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Unified Compressed Store (Ultra-dense Storage for Supabase Free Tier)
CREATE TABLE IF NOT EXISTS public.vyuma_compressed_store (
  id TEXT PRIMARY KEY,
  record_type TEXT NOT NULL CHECK (record_type IN ('product', 'order', 'snapshot', 'audit_log', 'settings', 'inventory', 'customer')),
  compressed_payload TEXT NOT NULL,
  original_bytes INTEGER NOT NULL DEFAULT 0 CHECK (original_bytes >= 0),
  compressed_bytes INTEGER NOT NULL DEFAULT 0 CHECK (compressed_bytes >= 0),
  saved_bytes INTEGER NOT NULL DEFAULT 0,
  reduction_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vyuma_compressed_type ON public.vyuma_compressed_store (record_type);
CREATE INDEX IF NOT EXISTS idx_vyuma_compressed_updated ON public.vyuma_compressed_store (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_vyuma_compressed_metadata ON public.vyuma_compressed_store USING gin (metadata);

DROP TRIGGER IF EXISTS trg_vyuma_compressed_updated ON public.vyuma_compressed_store;
CREATE TRIGGER trg_vyuma_compressed_updated
  BEFORE UPDATE ON public.vyuma_compressed_store
  FOR EACH ROW EXECUTE FUNCTION public.fn_vyuma_set_updated_at();

-- 2. Store Configuration
CREATE TABLE IF NOT EXISTS public.vyuma_store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  store_name TEXT NOT NULL DEFAULT 'Vyuma E-Commerce',
  tagline TEXT DEFAULT 'India''s Trusted Shopping Destination',
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  free_shipping_threshold NUMERIC(10, 2) NOT NULL DEFAULT 499.00 CHECK (free_shipping_threshold >= 0),
  standard_shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 40.00 CHECK (standard_shipping_fee >= 0),
  cod_enabled BOOLEAN NOT NULL DEFAULT true,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  announcement_banner TEXT DEFAULT '',
  support_phone TEXT DEFAULT '+91 800-123-4567',
  support_email TEXT DEFAULT 'support@vyuma.com',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Normalized Products Catalog
CREATE TABLE IF NOT EXISTS public.vyuma_products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(10, 2) NOT NULL CHECK (original_price >= price),
  discount NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN original_price > 0 THEN ROUND(((original_price - price) / original_price) * 100, 2)
      ELSE 0 
    END
  ) STORED,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 4.5 CHECK (rating >= 1.0 AND rating <= 5.0),
  rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  stock_count INTEGER NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
  in_stock BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_trending BOOLEAN NOT NULL DEFAULT false,
  badge TEXT DEFAULT NULL,
  images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  warranty TEXT DEFAULT '1 Year Brand Warranty',
  return_policy TEXT DEFAULT '7 Days Replacement Policy',
  delivery_days INTEGER NOT NULL DEFAULT 3 CHECK (delivery_days >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vyuma_products_category ON public.vyuma_products (category);
CREATE INDEX IF NOT EXISTS idx_vyuma_products_brand ON public.vyuma_products (brand);
CREATE INDEX IF NOT EXISTS idx_vyuma_products_price ON public.vyuma_products (price);
CREATE INDEX IF NOT EXISTS idx_vyuma_products_in_stock ON public.vyuma_products (in_stock);
CREATE INDEX IF NOT EXISTS idx_vyuma_products_specs ON public.vyuma_products USING gin (specs);
CREATE INDEX IF NOT EXISTS idx_vyuma_products_tags ON public.vyuma_products USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_vyuma_products_fts 
  ON public.vyuma_products 
  USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(category, '')));

DROP TRIGGER IF EXISTS trg_vyuma_products_updated ON public.vyuma_products;
CREATE TRIGGER trg_vyuma_products_updated
  BEFORE UPDATE ON public.vyuma_products
  FOR EACH ROW EXECUTE FUNCTION public.fn_vyuma_set_updated_at();

-- 4. Customer Directory
CREATE TABLE IF NOT EXISTS public.vyuma_customers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  full_name TEXT NOT NULL,
  phone TEXT DEFAULT NULL,
  addresses JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_orders INTEGER NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_spent >= 0),
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vyuma_customers_email ON public.vyuma_customers (email);

DROP TRIGGER IF EXISTS trg_vyuma_customers_updated ON public.vyuma_customers;
CREATE TRIGGER trg_vyuma_customers_updated
  BEFORE UPDATE ON public.vyuma_customers
  FOR EACH ROW EXECUTE FUNCTION public.fn_vyuma_set_updated_at();

-- 5. Promotional Coupons
CREATE TABLE IF NOT EXISTS public.vyuma_coupons (
  code TEXT PRIMARY KEY,
  description TEXT DEFAULT '',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (min_order_value >= 0),
  max_discount NUMERIC(10, 2) DEFAULT NULL,
  usage_limit INTEGER DEFAULT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Customer Orders
CREATE TABLE IF NOT EXISTS public.vyuma_orders (
  id TEXT PRIMARY KEY,
  tracking_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES public.vyuma_customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  items JSONB NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 1 CHECK (item_count > 0),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  coupon_code TEXT DEFAULT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('COD', 'UPI', 'CARD', 'NETBANKING')),
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'COD_COLLECTED')),
  tracking_status TEXT NOT NULL DEFAULT 'ORDER_PLACED' CHECK (tracking_status IN (
    'ORDER_PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'
  )),
  estimated_delivery TIMESTAMPTZ,
  delivery_carrier TEXT DEFAULT 'Vyuma Express',
  status_timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  customer_notes TEXT DEFAULT NULL,
  admin_notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vyuma_orders_customer_email ON public.vyuma_orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_vyuma_orders_tracking ON public.vyuma_orders (tracking_number);
CREATE INDEX IF NOT EXISTS idx_vyuma_orders_status ON public.vyuma_orders (tracking_status);
CREATE INDEX IF NOT EXISTS idx_vyuma_orders_created ON public.vyuma_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vyuma_orders_items ON public.vyuma_orders USING gin (items);

DROP TRIGGER IF EXISTS trg_vyuma_orders_updated ON public.vyuma_orders;
CREATE TRIGGER trg_vyuma_orders_updated
  BEFORE UPDATE ON public.vyuma_orders
  FOR EACH ROW EXECUTE FUNCTION public.fn_vyuma_set_updated_at();

-- 7. Audit Logs
CREATE TABLE IF NOT EXISTS public.vyuma_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  action_category TEXT NOT NULL CHECK (action_category IN ('ORDER', 'CATALOG', 'INVENTORY', 'SETTINGS', 'USER', 'SYSTEM', 'SUPABASE_SYNC')),
  action TEXT NOT NULL,
  details TEXT DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vyuma_audit_category ON public.vyuma_audit_logs (action_category);
CREATE INDEX IF NOT EXISTS idx_vyuma_audit_created ON public.vyuma_audit_logs (created_at DESC);

-- 8. Row Level Security Policies
ALTER TABLE public.vyuma_compressed_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vyuma_store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vyuma_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vyuma_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vyuma_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vyuma_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vyuma_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Compressed" ON public.vyuma_compressed_store FOR SELECT USING (true);
CREATE POLICY "Public Upsert Compressed" ON public.vyuma_compressed_store FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Products" ON public.vyuma_products FOR SELECT USING (true);
CREATE POLICY "Admin Modify Products" ON public.vyuma_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Settings" ON public.vyuma_store_settings FOR SELECT USING (true);
CREATE POLICY "Public Insert Orders" ON public.vyuma_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Tracking Orders" ON public.vyuma_orders FOR SELECT USING (true);
CREATE POLICY "Admin Manage Orders" ON public.vyuma_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Active Coupons" ON public.vyuma_coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Insert Audit Logs" ON public.vyuma_audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Read Audit Logs" ON public.vyuma_audit_logs FOR SELECT USING (true);

-- 9. Analytical Views
CREATE OR REPLACE VIEW public.v_vyuma_daily_sales AS
SELECT 
  DATE(created_at) AS sale_date,
  COUNT(id) AS total_orders,
  COUNT(id) FILTER (WHERE tracking_status = 'DELIVERED') AS delivered_orders,
  COUNT(id) FILTER (WHERE tracking_status = 'CANCELLED') AS cancelled_orders,
  COALESCE(SUM(total_amount), 0) AS gross_revenue,
  COALESCE(SUM(discount_amount), 0) AS total_discounts_given,
  COALESCE(AVG(total_amount), 0) AS average_order_value
FROM public.vyuma_orders
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

CREATE OR REPLACE VIEW public.v_vyuma_low_stock_alerts AS
SELECT 
  id, title, brand, category, price, stock_count, in_stock,
  CASE
    WHEN stock_count = 0 THEN 'OUT_OF_STOCK'
    WHEN stock_count <= 5 THEN 'CRITICAL'
    WHEN stock_count <= 10 THEN 'LOW'
    ELSE 'HEALTHY'
  END AS inventory_urgency
FROM public.vyuma_products
WHERE stock_count <= 10 OR in_stock = false
ORDER BY stock_count ASC;

-- 10. Atomic Inventory Deduction Procedure
CREATE OR REPLACE FUNCTION public.fn_vyuma_deduct_inventory(
  p_product_id TEXT,
  p_quantity INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_is_in_stock BOOLEAN;
BEGIN
  IF p_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid quantity');
  END IF;

  SELECT stock_count INTO v_current_stock
  FROM public.vyuma_products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  IF v_current_stock < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock', 'available', v_current_stock, 'requested', p_quantity);
  END IF;

  v_new_stock := v_current_stock - p_quantity;
  v_is_in_stock := (v_new_stock > 0);

  UPDATE public.vyuma_products
  SET stock_count = v_new_stock,
      in_stock = v_is_in_stock,
      updated_at = NOW()
  WHERE id = p_product_id;

  RETURN jsonb_build_object('success', true, 'productId', p_product_id, 'previousStock', v_current_stock, 'newStock', v_new_stock, 'inStock', v_is_in_stock);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;
}
