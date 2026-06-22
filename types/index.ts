export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  unit: string | null;
  mrp: number | null;
  selling_price: number | null;
  brand: string | null;
  low_stock_at: number;
  created_at: string;
};

export type InventoryLog = {
  id: string;
  product_id: string;
  change_qty: number;
  reason: string | null;
  sale_id: string | null;
  note: string | null;
  created_at: string;
};

export type Sale = {
  id: string;
  bill_number: string;
  total_amount: number | null;
  discount: number;
  created_at: string;
};

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};
