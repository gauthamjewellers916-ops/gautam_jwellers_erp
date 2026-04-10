
export interface MetalRates {
  goldStd: number;
  gold22k: number;
  gold18k: number;
  silver925: number;
  silver70: number;
  selamSilver: number;
}

export type StockStatus = 'in_stock' | 'out_of_stock' | 'sold';

export interface InventoryItem {
  id: string;
  barcode: string;
  item_name: string;
  category?: string;
  weight?: number;
  purity?: string;
  making_charges?: number;
  stone_type?: string;
  hsn_code?: string;
  gst_rate?: number;
  price_per_gram?: number;
  net_price?: number;
  stock_status?: StockStatus;
  location?: string;
  remarks?: string;
  created_at?: string;
  metal_type?: string;
  huid?: string;
  gross_weight?: number;
  net_weight?: number;
  quantity?: number;
}

export interface BillItem {
  id: string;
  barcode: string;
  item_name: string;
  gross_weight: number;
  net_weight: number;
  weight: number; // For backward compatibility or if used as net_weight
  huid?: string;
  rate: number;
  making_charges: number;
  gst_rate: number;
  line_total: number;
  purity?: string;
  hsn_code?: string;
  sl_no?: number;
  metal_type?: string;
  // UI helper fields for editing
  weightInput?: string;
  grossWeightInput?: string;
  netWeightInput?: string;
  makingChargesInput?: string;
  makingChargesPercentage?: string;
  makingChargesAmount?: string;
}

export interface OldGoldExchange {
  description: string;
  hsnCode: string;
  weight: number;
  purity: number;
  rate: number;
  total_value?: number; // Added for consistency
}

export type PaymentMethodType = 'cash' | 'card' | 'upi' | 'cheque' | 'bank_transfer' | 'other';

export interface PaymentRecord {
  id: string;
  type: PaymentMethodType;
  amount: string;
  reference: string;
}

export interface Customer {
  id: number;
  customer_code?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at?: string;
}

export interface LayawayTransaction {
  id: number;
  bill_id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdvanceBooking {
  id: number;
  bill_id: number;
  booking_date: string;
  delivery_date: string;
  advance_amount: number;
  total_amount: number;
  remaining_amount?: number;
  item_description: string;
  customer_notes: string;
  booking_status: 'active' | 'delivered' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}
