// types/inventory.ts
export type InventoryStatus =
  | "available"
  | "reserved"
  | "paid_complete"
  | "paid_partial"
  | "cancelled";

export type InventoryItem = {
  id: string;
  model_id: string;
  color_id: string;
  model_name: string | null;
  color: string | null;
  size: string;   // label from sizes.label (e.g. "M10-W12", "C8", "J1")
  size_id: string; // FK to sizes.id
  price_mxn: number;
  status: InventoryStatus;
  customer_name: string | null;
  customer_whatsapp: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
