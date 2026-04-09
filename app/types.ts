export interface ItemConfig {
  required: number;
  unit: string;
  pledged: number;
  unitPrice?: number; // optional for backward compatibility
}
export interface ItemsMap {
  [itemName: string]: ItemConfig;
}

export interface Pledge {
  id?: string;
  memberName: string;
  phone: string;
  items: { [itemName: string]: number };
  timestamp: string;
}

export interface Pledge {
  id?: string;
  memberName: string;
  phone: string;
  items: { [itemName: string]: number };
  timestamp: string;
  totalAmount?: number;        // Total cash value of pledged items
  paymentStatus?: 'pending' | 'paid'; // Default 'pending'
}