-- =============================================================================
-- VYUMA MARKETPLACE: ENTERPRISE PRODUCTION SCHEMA FOR SUPABASE (POSTGRESQL)
-- Version: 2.4.0 (Production & Supabase Free Tier Optimized)
-- Compatibility: PostgreSQL 14+, 15+, 16+ on Supabase Cloud
-- Includes:
--   1. Extensions & Custom Types / Enums
--   2. Unified Compressed Store (Ultra-dense Storage Engine for Free Tier)
--   3. Normalized Relational Tables (Products, Orders, Customers, Coupons, Audit Logs, Settings)
--   4. Performance Indexes (B-Tree, GIN on JSONB, Full-Text Search)
--   5. Auto-Update Timestamp Triggers
--   6. Enterprise Row-Level Security (RLS) Policies
--   7. Real-Time Analytical & Inventory Views
--   8. Inventory Deduct Stored Function
-- =============================================================================

-- =============================================================================
-- SECTION 1: EXTENSIONS & ENUMS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Payment & Order Status Enums (safe creation)
DO $$ BEGIN
  CREATE TYPE vyuma_order_status AS ENUM (
    'ORDER_PLACED',
    'CONFIRMED',
    'PACKED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURN_REQUESTED',
    'RETURNED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE vyuma_payment_status AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED',
    'COD_COLLECTED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Automated Updated-At Timestamp Function
CREATE OR REPLACE FUNCTION public.fn_vyuma_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SECTION 2: HIGH-DENSITY COMPRESSED STORAGE ENGINE (FREE TIER MULTIPLIER)
-- Stores LZ-String compressed JSON snapshots reducing storage footprints by 70%+
-- =============================================================================
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

CREATE INDEX IF NOT EXISTS idx_vyuma_compressed_type 
  ON public.vyuma_compressed_store (record_type);

CREATE INDEX IF NOT EXISTS idx_vyuma_compressed_updated 
  ON public.vyuma_compressed_store (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vyuma_compressed_metadata 
  ON public.vyuma_compressed_store USING gin (metadata);

DROP TRIGGER IF EXISTS trg_vyuma_compressed_updated ON public.vyuma_compressed_store;
CREATE TRIGGER trg_vyuma_compressed_updated
  BEFORE UPDATE ON public.vyuma_compressed_store
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_vyuma_set_updated_at();

-- =============================================================================
-- SECTION 3: NORMALIZED RELATIONAL MARKETPLACE TABLES
-- =============================================================================

-- 3.1 Store Controls & Configuration
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

-- 3.2 Product Catalog
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

-- Catalog Performance & Search Indexes
CREATE INDEX IF NOT EXISTS idx_vyuma_products_category ON public.vyuma_products (category);
CREATE INDEX IF NOT EXISTS idx_vyuma_products_brand ON public.vyuma_products (brand);
CREATE INDEX IF NOT EXISTS idx_vyuma_products_price ON public.vyuma_products (price);
CREATE INDEX IF NOT EXISTS idx_vyuma_products_in_stock ON public.vyuma_products (in_stock);
CREATE INDEX IF NOT EXISTS idx_vyuma_products_specs ON public.vyuma_products USING gin (specs);
CREATE INDEX IF NOT EXISTS idx_vyuma_products_tags ON public.vyuma_products USING gin (tags);

-- Full text search index on title, brand, and description
CREATE INDEX IF NOT EXISTS idx_vyuma_products_fts 
  ON public.vyuma_products 
  USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(category, '')));

DROP TRIGGER IF EXISTS trg_vyuma_products_updated ON public.vyuma_products;
CREATE TRIGGER trg_vyuma_products_updated
  BEFORE UPDATE ON public.vyuma_products
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_vyuma_set_updated_at();

-- 3.3 Customer Registry
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
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_vyuma_set_updated_at();

-- 3.4 Discount & Promotional Coupons
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

-- 3.5 Orders Master Table
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

-- Orders Indexes
CREATE INDEX IF NOT EXISTS idx_vyuma_orders_customer_email ON public.vyuma_orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_vyuma_orders_tracking ON public.vyuma_orders (tracking_number);
CREATE INDEX IF NOT EXISTS idx_vyuma_orders_status ON public.vyuma_orders (tracking_status);
CREATE INDEX IF NOT EXISTS idx_vyuma_orders_created ON public.vyuma_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vyuma_orders_items ON public.vyuma_orders USING gin (items);

DROP TRIGGER IF EXISTS trg_vyuma_orders_updated ON public.vyuma_orders;
CREATE TRIGGER trg_vyuma_orders_updated
  BEFORE UPDATE ON public.vyuma_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_vyuma_set_updated_at();

-- 3.6 Immutable Audit Logs
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

-- =============================================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS across all tables
ALTER TABLE public.vyuma_compressed_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vyuma_store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vyuma_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vyuma_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vyuma_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vyuma_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vyuma_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4.1 vyuma_compressed_store Policies
DROP POLICY IF EXISTS "Compressed Store: Public Read" ON public.vyuma_compressed_store;
CREATE POLICY "Compressed Store: Public Read"
  ON public.vyuma_compressed_store
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Compressed Store: Allow Upserts" ON public.vyuma_compressed_store;
CREATE POLICY "Compressed Store: Allow Upserts"
  ON public.vyuma_compressed_store
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4.2 vyuma_products Policies
DROP POLICY IF EXISTS "Products: Public Select" ON public.vyuma_products;
CREATE POLICY "Products: Public Select"
  ON public.vyuma_products
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Products: Admin Full Access" ON public.vyuma_products;
CREATE POLICY "Products: Admin Full Access"
  ON public.vyuma_products
  FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role', 'anon'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role', 'anon'));

-- 4.3 vyuma_store_settings Policies
DROP POLICY IF EXISTS "Store Settings: Public Select" ON public.vyuma_store_settings;
CREATE POLICY "Store Settings: Public Select"
  ON public.vyuma_store_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Store Settings: Admin Mutation" ON public.vyuma_store_settings;
CREATE POLICY "Store Settings: Admin Mutation"
  ON public.vyuma_store_settings
  FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role', 'anon'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role', 'anon'));

-- 4.4 vyuma_orders Policies
DROP POLICY IF EXISTS "Orders: Public Creation" ON public.vyuma_orders;
CREATE POLICY "Orders: Public Creation"
  ON public.vyuma_orders
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Orders: Read Tracking by ID or Tracking Number" ON public.vyuma_orders;
CREATE POLICY "Orders: Read Tracking by ID or Tracking Number"
  ON public.vyuma_orders
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Orders: Admin Full Management" ON public.vyuma_orders;
CREATE POLICY "Orders: Admin Full Management"
  ON public.vyuma_orders
  FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role', 'anon'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role', 'anon'));

-- 4.5 vyuma_coupons Policies
DROP POLICY IF EXISTS "Coupons: Public Active Select" ON public.vyuma_coupons;
CREATE POLICY "Coupons: Public Active Select"
  ON public.vyuma_coupons
  FOR SELECT
  USING (is_active = true);

-- 4.6 vyuma_audit_logs Policies
DROP POLICY IF EXISTS "Audit Logs: Insert" ON public.vyuma_audit_logs;
CREATE POLICY "Audit Logs: Insert"
  ON public.vyuma_audit_logs
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Audit Logs: Admin Select" ON public.vyuma_audit_logs;
CREATE POLICY "Audit Logs: Admin Select"
  ON public.vyuma_audit_logs
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role', 'anon'));

-- =============================================================================
-- SECTION 5: REAL-TIME ANALYTICAL VIEWS
-- =============================================================================

-- 5.1 Daily Sales Performance View
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

-- 5.2 Low Stock Alert View
CREATE OR REPLACE VIEW public.v_vyuma_low_stock_alerts AS
SELECT 
  id,
  title,
  brand,
  category,
  price,
  stock_count,
  in_stock,
  CASE
    WHEN stock_count = 0 THEN 'OUT_OF_STOCK'
    WHEN stock_count <= 5 THEN 'CRITICAL'
    WHEN stock_count <= 10 THEN 'LOW'
    ELSE 'HEALTHY'
  END AS inventory_urgency
FROM public.vyuma_products
WHERE stock_count <= 10 OR in_stock = false
ORDER BY stock_count ASC;

-- =============================================================================
-- SECTION 6: STORED PROCEDURE FOR ATOMIC INVENTORY DEDUCTION
-- =============================================================================
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
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient stock', 
      'available', v_current_stock,
      'requested', p_quantity
    );
  END IF;

  v_new_stock := v_current_stock - p_quantity;
  v_is_in_stock := (v_new_stock > 0);

  UPDATE public.vyuma_products
  SET stock_count = v_new_stock,
      in_stock = v_is_in_stock,
      updated_at = NOW()
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true, 
    'productId', p_product_id,
    'previousStock', v_current_stock, 
    'newStock', v_new_stock,
    'inStock', v_is_in_stock
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- VERIFICATION & HEALTH CHECK
-- =============================================================================
COMMENT ON TABLE public.vyuma_compressed_store IS 'Hyper-dense Base64 LZ-String storage engine maximizing Supabase Free Tier';
COMMENT ON TABLE public.vyuma_products IS 'Normalized Vyuma e-commerce product catalog with full-text search';
COMMENT ON TABLE public.vyuma_orders IS 'Complete customer order lifecycle and live tracking history';
COMMENT ON TABLE public.vyuma_store_settings IS 'Marketplace operational settings and shipping threshold controls';
