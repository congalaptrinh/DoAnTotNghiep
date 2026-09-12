import { request } from './apiClient';

export type MovementType = 'IMPORT' | 'EXPORT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'RECOVERY' | 'ADJUSTMENT_STOCKTAKE' | 'LIQUIDATION';
export type ReferenceType = 'IMPORT_ORDER' | 'EXPORT_ORDER' | 'TRANSFER_ORDER' | 'RECOVERY_ORDER' | 'STOCKTAKE_SESSION' | 'LIQUIDATION_ORDER';

export interface StockMovementRow {
  movement_id: string;
  item_id: string;
  warehouse_id: string;
  location_id: string;
  movement_type: MovementType;
  quantity: number;
  reference_type: ReferenceType;
  reference_id: string;
  performed_by: string;
  movement_date: string;
  note: string | null;
  item: { item_id: string; item_code: string; item_name: string; unit: string };
  warehouse: { warehouse_id: string; warehouse_name: string };
  location: { location_id: string; location_code: string };
  performer: { user_id: string; full_name: string; email: string };
}

export interface StockMovementFilters {
  item_id?: string;
  warehouse_id?: string;
  location_id?: string;
  movement_type?: MovementType;
  reference_type?: ReferenceType;
  from?: string;
  to?: string;
}

/** Backend luôn trả `orderBy: movement_date asc` (cũ→mới, xem 07-DECISIONS-LOG.md) — tự đảo mảng ở client nếu cần mới→cũ. */
export function listStockMovements(filters: StockMovementFilters = {}): Promise<StockMovementRow[]> {
  return request<StockMovementRow[]>({ method: 'GET', url: '/stock-movements', params: filters });
}
