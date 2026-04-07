export interface ItemConfig {
  required: number;
  unit: string;
  pledged: number;
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