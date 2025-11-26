export type InventoryStatus =
  | "available"
  | "reserved"
  | "paid_complete"
  | "paid_partial"
  | "delivered"
  | "cancelled";

export type InventoryGender = "men" | "women" | "unisex";

export interface InventoryItem {
  id: string;
  model_name: string;
  color: string;
  size: string;
  price_mxn: number;
  status: InventoryStatus;   // <-- this is what TypeScript couldn't find
  customer_name: string | null;
  customer_whatsapp: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}
