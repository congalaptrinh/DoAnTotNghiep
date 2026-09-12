import { request } from './apiClient';
import type { Item } from './item.service';
import type { StorageLocation } from './storageLocation.service';
import type { OrderStatus } from './orders.service';

export interface LiquidationOrderItem {
  liquidation_item_id: string;
  item_id: string;
  location_id: string;
  quantity: number;
  note: string | null;
  item: Item;
  location: StorageLocation;
}

export interface LiquidationOrder {
  liquidation_id: string;
  liquidation_code: string;
  warehouse_id: string;
  liquidation_date: string;
  reason: string | null;
  note: string | null;
  status: OrderStatus;
  created_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  warehouse: { warehouse_id: string; warehouse_name: string };
  creator: { user_id: string; full_name: string; email: string };
  approver: { user_id: string; full_name: string; email: string } | null;
  items: LiquidationOrderItem[];
}

export interface LiquidationOrderItemInput {
  item_id: string;
  location_id: string;
  quantity: number;
  note?: string;
}

export interface LiquidationOrderInput {
  warehouse_id: string;
  liquidation_date?: string;
  reason?: string;
  note?: string;
  items: LiquidationOrderItemInput[];
}

export interface LiquidationOrderFilters {
  warehouse_id?: string;
  status?: OrderStatus;
}

export function listLiquidationOrders(filters: LiquidationOrderFilters = {}): Promise<LiquidationOrder[]> {
  return request<LiquidationOrder[]>({ method: 'GET', url: '/liquidation-orders', params: filters });
}

export function createLiquidationOrder(data: LiquidationOrderInput): Promise<LiquidationOrder> {
  return request<LiquidationOrder>({ method: 'POST', url: '/liquidation-orders', data });
}

export function confirmLiquidationOrder(id: string): Promise<LiquidationOrder> {
  return request<LiquidationOrder>({ method: 'POST', url: `/liquidation-orders/${id}/confirm` });
}
