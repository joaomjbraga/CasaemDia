// types/inventory.ts

export interface InventoryItem {
  id: number;
  user_id: string;
  name: string;
  category: 'alimentos' | 'limpeza' | 'higiene' | 'outros';
  current_quantity: number;
  minimum_quantity: number;
  unit: string;
  expiration_date: string | null;
  location: string | null;
  notes: string | null;
  needs_restock: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryFormData {
  name: string;
  category: InventoryItem['category'];
  current_quantity: string;
  minimum_quantity: string;
  unit: string;
  expiration_date: Date | null;
  location: string;
  notes: string;
}

export interface CategoryConfig {
  label: string;
  value: InventoryItem['category'];
  icon: string;
}

export interface InventoryStats {
  totalItems: number;
  needRestockCount: number;
  expiringSoonCount: number;
  categories: {
    alimentos: number;
    limpeza: number;
    higiene: number;
    outros: number;
  };
}

export type InventoryFilterType = 'todos' | InventoryItem['category'];

export interface InventoryFilters {
  category: InventoryFilterType;
  showOnlyRestock: boolean;
  searchText: string;
}