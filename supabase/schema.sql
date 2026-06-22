CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  category text,
  unit text,
  mrp numeric,
  selling_price numeric,
  brand text,
  low_stock_at integer DEFAULT 10,
  created_at timestamp DEFAULT now()
);

CREATE TABLE inventory_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  change_qty integer NOT NULL,
  reason text,
  sale_id uuid,
  note text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text UNIQUE NOT NULL,
  total_amount numeric,
  discount numeric DEFAULT 0,
  created_at timestamp DEFAULT now()
);

CREATE TABLE sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id),
  product_id uuid REFERENCES products(id),
  quantity integer,
  unit_price numeric,
  subtotal numeric
);
