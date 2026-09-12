import { useQueries, useQuery } from '@tanstack/react-query';
import { listItems } from '../services/item.service';
import { listInventory } from '../services/inventory.service';
import { listWarehouses } from '../services/warehouse.service';
import { listStockMovements, type StockMovementRow } from '../services/stockMovement.service';
import { listOrders, type OrderResource } from '../services/orders.service';

/**
 * Dashboard (Giai đoạn D) không có endpoint tổng hợp riêng ở Backend — gọi
 * kết hợp nhiều API (`GET /api/items`, `/inventory`, `/warehouses`,
 * `/stock-movements`, + 6 loại phiếu với `?status=DRAFT`) rồi tự tính ở FE,
 * đúng theo gợi ý D1 trong `08-WEB-BUILD-CHECKLIST.md`. Chi tiết quyết định:
 * xem `07-DECISIONS-LOG.md` (Giai đoạn D).
 */

const PENDING_RESOURCES: { resource: OrderResource; label: string }[] = [
  { resource: 'import-orders', label: 'nhập kho' },
  { resource: 'export-orders', label: 'xuất kho' },
  { resource: 'transfer-orders', label: 'chuyển kho' },
  { resource: 'recovery-orders', label: 'thu hồi' },
  { resource: 'stocktake-sessions', label: 'kiểm kê' },
  { resource: 'liquidation-orders', label: 'thanh lý' },
];

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Dấu +/- hiển thị theo Ý NGHĨA thật của movement_type — `quantity` trong DB luôn dương
 * (trừ ADJUSTMENT_STOCKTAKE đã lưu sẵn có dấu, xem 07-DECISIONS-LOG.md Giai đoạn E5). */
export function signedQuantity(row: StockMovementRow): number {
  if (row.movement_type === 'ADJUSTMENT_STOCKTAKE') return row.quantity;
  const negative: string[] = ['EXPORT', 'TRANSFER_OUT', 'LIQUIDATION'];
  return negative.includes(row.movement_type) ? -row.quantity : row.quantity;
}

const MOVEMENT_LABELS: Record<StockMovementRow['movement_type'], string> = {
  IMPORT: 'Nhập kho',
  EXPORT: 'Xuất kho',
  TRANSFER_IN: 'Chuyển kho (nhận)',
  TRANSFER_OUT: 'Chuyển kho (gửi)',
  RECOVERY: 'Thu hồi',
  ADJUSTMENT_STOCKTAKE: 'Điều chỉnh kiểm kê',
  LIQUIDATION: 'Thanh lý',
};

export function useDashboardStats() {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const itemsQuery = useQuery({ queryKey: ['items', { status: 'ACTIVE' }], queryFn: () => listItems({ status: 'ACTIVE' }) });
  const inventoryQuery = useQuery({ queryKey: ['inventory'], queryFn: () => listInventory() });
  const warehousesQuery = useQuery({ queryKey: ['warehouses'], queryFn: () => listWarehouses() });
  const movementsQuery = useQuery({
    queryKey: ['stock-movements', 'last30d'],
    queryFn: () => listStockMovements({ from: since30d }),
  });

  const pendingQueries = useQueries({
    queries: PENDING_RESOURCES.map(({ resource }) => ({
      queryKey: ['orders', resource, { status: 'DRAFT' }],
      queryFn: () => listOrders(resource, { status: 'DRAFT' }),
    })),
  });

  const isLoading =
    itemsQuery.isLoading || inventoryQuery.isLoading || warehousesQuery.isLoading ||
    movementsQuery.isLoading || pendingQueries.some((q) => q.isLoading);

  const error =
    itemsQuery.error || inventoryQuery.error || warehousesQuery.error || movementsQuery.error ||
    pendingQueries.find((q) => q.error)?.error || null;

  const totalItems = itemsQuery.data?.length ?? 0;

  const lowStockRows = (inventoryQuery.data ?? []).filter((row) => row.available_quantity <= row.item.min_stock);
  const lowStockCount = lowStockRows.length;
  const lowStockPreview = lowStockRows.slice(0, 4).map((row) => ({
    name: row.item.item_name,
    current: row.available_quantity,
    min: row.item.min_stock,
    unit: row.item.unit,
  }));

  const activeWarehousesCount = (warehousesQuery.data ?? []).filter((w) => w.status === 'ACTIVE').length;
  const totalWarehousesCount = warehousesQuery.data?.length ?? 0;

  const pendingCounts = PENDING_RESOURCES.map(({ label }, i) => ({ label, count: pendingQueries[i].data?.length ?? 0 }));
  const pendingTotal = pendingCounts.reduce((sum, p) => sum + p.count, 0);
  const pendingSummary = pendingCounts.filter((p) => p.count > 0).map((p) => `${p.count} ${p.label}`).join(', ') || 'Không có phiếu nào';

  // Biểu đồ 7 ngày gần nhất: chỉ IMPORT vs EXPORT (giống thiết kế gốc)
  const days: { key: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ key: dayKey(d), label: WEEKDAY_LABELS[d.getDay()] });
  }
  const movements = movementsQuery.data ?? [];
  const weeklyChart = days.map(({ key, label }) => {
    const dayRows = movements.filter((m) => m.movement_date.slice(0, 10) === key);
    const nhap = dayRows.filter((m) => m.movement_type === 'IMPORT').reduce((s, m) => s + m.quantity, 0);
    const xuat = dayRows.filter((m) => m.movement_type === 'EXPORT').reduce((s, m) => s + m.quantity, 0);
    return { day: label, nhap, xuat };
  });
  const totalImportWeek = weeklyChart.reduce((s, d) => s + d.nhap, 0);
  const totalExportWeek = weeklyChart.reduce((s, d) => s + d.xuat, 0);

  // Hoạt động gần đây: đảo ngược (Backend luôn trả cũ→mới), lấy 5 dòng mới nhất
  const recentActivity = [...movements]
    .reverse()
    .slice(0, 5)
    .map((m) => {
      const qty = signedQuantity(m);
      return {
        id: m.movement_id,
        time: new Date(m.movement_date).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
        desc: `${MOVEMENT_LABELS[m.movement_type]}: ${qty > 0 ? '+' : ''}${qty} ${m.item.unit} ${m.item.item_name} tại ${m.warehouse.warehouse_name} (${m.location.location_code})`,
        user: m.performer.full_name,
      };
    });

  return {
    isLoading,
    error,
    totalItems,
    lowStockCount,
    lowStockPreview,
    activeWarehousesCount,
    totalWarehousesCount,
    pendingTotal,
    pendingSummary,
    weeklyChart,
    totalImportWeek,
    totalExportWeek,
    recentActivity,
  };
}
