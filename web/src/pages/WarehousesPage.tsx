import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageLayout, { Card, Badge, Btn, Th, Td, Input, Select } from '../components/PageLayout';
import { Tabs, Modal, ConfirmDialog, useToast, EmptyState } from '../components/ui';
import { usePermission } from '../hooks/usePermission';
import { ApiError } from '../services/apiClient';
import { listWarehouses, createWarehouse, updateWarehouse, deleteWarehouse, type Warehouse } from '../services/warehouse.service';
import {
  listStorageLocations, createStorageLocation, updateStorageLocation, deleteStorageLocation, type StorageLocation,
} from '../services/storageLocation.service';

type WarehouseModal = { mode: 'add' } | { mode: 'edit'; warehouse: Warehouse };
type LocationModal = { mode: 'add' } | { mode: 'edit'; location: StorageLocation };
type DeleteTarget = { type: 'warehouse'; id: string; name: string } | { type: 'location'; id: string; name: string };

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export default function WarehousesPage() {
  const [tab, setTab] = useState<'warehouses' | 'locations'>('warehouses');
  const [whFilter, setWhFilter] = useState('all');
  const [warehouseModal, setWarehouseModal] = useState<WarehouseModal | null>(null);
  const [locationModal, setLocationModal] = useState<LocationModal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [warehouseForm, setWarehouseForm] = useState({ warehouse_name: '', address: '', description: '' });
  const [locationForm, setLocationForm] = useState({ warehouse_id: '', location_code: '', area: '', shelf: '', drawer: '', box: '' });

  const { canWrite } = usePermission();
  /** Kho và Vị trí lưu trữ có quyền ghi KHÁC NHAU (staff được sửa vị trí nhưng không được sửa kho) — xem `config/permissions.ts`. */
  const canWriteCurrentTab = tab === 'warehouses' ? canWrite('warehouses') : canWrite('storage_locations');

  const { show } = useToast();
  const qc = useQueryClient();

  const warehousesQuery = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses });
  const locationsQuery = useQuery({ queryKey: ['storage-locations'], queryFn: () => listStorageLocations() });

  const warehouses = warehousesQuery.data ?? [];
  const locations = locationsQuery.data ?? [];
  const warehouseName = (id: string) => warehouses.find((w) => w.warehouse_id === id)?.warehouse_name ?? '—';
  const locationCountOf = (warehouseId: string) => locations.filter((l) => l.warehouse_id === warehouseId).length;
  const filteredLocs = locations.filter((l) => whFilter === 'all' || l.warehouse_id === whFilter);

  /* ───────────── Warehouse mutations ───────────── */

  const createWhMut = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); show('success', 'Đã tạo kho mới'); setWarehouseModal(null); },
    onError: (err) => show('error', errMsg(err, 'Tạo kho thất bại')),
  });
  const updateWhMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateWarehouse>[1] }) => updateWarehouse(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); show('success', 'Đã cập nhật kho'); setWarehouseModal(null); },
    onError: (err) => show('error', errMsg(err, 'Cập nhật kho thất bại')),
  });
  const deleteWhMut = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); show('success', 'Đã ngừng sử dụng kho'); setDeleteTarget(null); },
    onError: (err) => { show('error', errMsg(err, 'Ngừng sử dụng kho thất bại')); setDeleteTarget(null); },
  });

  /* ───────────── Location mutations ───────────── */

  const createLocMut = useMutation({
    mutationFn: createStorageLocation,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['storage-locations'] }); show('success', 'Đã tạo vị trí mới'); setLocationModal(null); },
    onError: (err) => show('error', errMsg(err, 'Tạo vị trí thất bại')),
  });
  const updateLocMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateStorageLocation>[1] }) => updateStorageLocation(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['storage-locations'] }); show('success', 'Đã cập nhật vị trí'); setLocationModal(null); },
    onError: (err) => show('error', errMsg(err, 'Cập nhật vị trí thất bại')),
  });
  const deleteLocMut = useMutation({
    mutationFn: deleteStorageLocation,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['storage-locations'] }); show('success', 'Đã ngừng sử dụng vị trí'); setDeleteTarget(null); },
    onError: (err) => { show('error', errMsg(err, 'Ngừng sử dụng vị trí thất bại')); setDeleteTarget(null); },
  });

  /* ───────────── Modal openers ───────────── */

  function openAddWarehouse() {
    setWarehouseForm({ warehouse_name: '', address: '', description: '' });
    setWarehouseModal({ mode: 'add' });
  }
  function openEditWarehouse(w: Warehouse) {
    setWarehouseForm({ warehouse_name: w.warehouse_name, address: w.address ?? '', description: w.description ?? '' });
    setWarehouseModal({ mode: 'edit', warehouse: w });
  }
  function saveWarehouseModal() {
    if (!warehouseForm.warehouse_name.trim()) return;
    const data = { warehouse_name: warehouseForm.warehouse_name.trim(), address: warehouseForm.address || undefined, description: warehouseForm.description || undefined };
    if (warehouseModal?.mode === 'add') createWhMut.mutate(data);
    else if (warehouseModal?.mode === 'edit') updateWhMut.mutate({ id: warehouseModal.warehouse.warehouse_id, data });
  }

  function openAddLocation() {
    setLocationForm({ warehouse_id: warehouses[0]?.warehouse_id ?? '', location_code: '', area: '', shelf: '', drawer: '', box: '' });
    setLocationModal({ mode: 'add' });
  }
  function openEditLocation(loc: StorageLocation) {
    setLocationForm({
      warehouse_id: loc.warehouse_id, location_code: loc.location_code,
      area: loc.area ?? '', shelf: loc.shelf ?? '', drawer: loc.drawer ?? '', box: loc.box ?? '',
    });
    setLocationModal({ mode: 'edit', location: loc });
  }
  function saveLocationModal() {
    if (!locationForm.warehouse_id || !locationForm.location_code.trim()) return;
    const data = {
      warehouse_id: locationForm.warehouse_id,
      location_code: locationForm.location_code.trim(),
      area: locationForm.area || undefined,
      shelf: locationForm.shelf || undefined,
      drawer: locationForm.drawer || undefined,
      box: locationForm.box || undefined,
    };
    if (locationModal?.mode === 'add') createLocMut.mutate(data);
    else if (locationModal?.mode === 'edit') updateLocMut.mutate({ id: locationModal.location.location_id, data });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'warehouse') deleteWhMut.mutate(deleteTarget.id);
    else deleteLocMut.mutate(deleteTarget.id);
  }

  const isLoading = warehousesQuery.isLoading || locationsQuery.isLoading;
  const loadError = warehousesQuery.error || locationsQuery.error;

  return (
    <PageLayout
      title="Kho & Vị trí lưu trữ"
      subtitle="Quản lý danh sách kho và sơ đồ vị trí lưu trữ"
      actions={
        <>
          <Tabs
            value={tab}
            onChange={setTab}
            options={[
              { value: 'warehouses', label: 'Danh sách kho' },
              { value: 'locations', label: 'Vị trí lưu trữ' },
            ]}
          />
          {canWriteCurrentTab && (
            <Btn onClick={() => (tab === 'warehouses' ? openAddWarehouse() : openAddLocation())}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7-7 7 7" />
              </svg>
              {tab === 'warehouses' ? 'Thêm kho' : 'Thêm vị trí'}
            </Btn>
          )}
        </>
      }
    >
      {isLoading ? (
        <div className="py-16 text-center text-sm text-gray-400">Đang tải dữ liệu...</div>
      ) : loadError ? (
        <EmptyState title="Không tải được dữ liệu" description={errMsg(loadError, 'Lỗi không xác định')} />
      ) : tab === 'warehouses' ? (
        warehouses.length === 0 ? (
          <EmptyState title="Chưa có kho nào" action={canWriteCurrentTab ? { label: 'Thêm kho đầu tiên', onClick: openAddWarehouse } : undefined} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {warehouses.map((wh) => {
              const locCount = locationCountOf(wh.warehouse_id);
              return (
                <Card key={wh.warehouse_id} className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-from)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{wh.warehouse_name}</h3>
                        {wh.manager && <p className="text-xs text-gray-400">QL: {wh.manager.full_name}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={wh.status === 'ACTIVE' ? 'green' : 'gray'}>
                        {wh.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                      </Badge>
                      {canWriteCurrentTab && (
                        <div className="flex items-center gap-0.5">
                          <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600 transition-colors" onClick={() => openEditWarehouse(wh)} title="Sửa">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {wh.status === 'ACTIVE' && (
                            <button className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-danger transition-colors" onClick={() => setDeleteTarget({ type: 'warehouse', id: wh.warehouse_id, name: wh.warehouse_name })} title="Ngừng sử dụng">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    {wh.address && (
                      <div className="flex items-start gap-2 text-gray-600">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-gray-400">
                          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{wh.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">{locCount}</span> vị trí lưu trữ
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <Select
              value={whFilter}
              onChange={setWhFilter}
              options={[{ value: 'all', label: 'Tất cả kho' }, ...warehouses.map((w) => ({ value: w.warehouse_id, label: w.warehouse_name }))]}
            />
            <span className="text-sm text-gray-400 ml-auto">{filteredLocs.length} vị trí</span>
          </div>
          {filteredLocs.length === 0 ? (
            <EmptyState title="Chưa có vị trí nào" action={canWriteCurrentTab ? { label: 'Thêm vị trí đầu tiên', onClick: openAddLocation } : undefined} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Mã vị trí</Th>
                    <Th>Kho</Th>
                    <Th>Khu vực</Th>
                    <Th>Kệ</Th>
                    <Th>Ngăn</Th>
                    <Th>Hộp</Th>
                    <Th>Trạng thái</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocs.map((loc) => (
                    <tr key={loc.location_id} className="hover:bg-gray-50/60 transition-colors">
                      <Td><code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{loc.location_code}</code></Td>
                      <Td>{warehouseName(loc.warehouse_id)}</Td>
                      <Td>{loc.area || '—'}</Td>
                      <Td>{loc.shelf || '—'}</Td>
                      <Td>{loc.drawer || '—'}</Td>
                      <Td>{loc.box || '—'}</Td>
                      <Td>
                        <Badge color={loc.status === 'ACTIVE' ? 'indigo' : 'gray'}>
                          {loc.status === 'ACTIVE' ? 'Đang dùng' : 'Ngừng dùng'}
                        </Badge>
                      </Td>
                      <Td>
                        {canWriteCurrentTab && (
                          <div className="flex items-center gap-0.5">
                            <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors" onClick={() => openEditLocation(loc)} title="Sửa">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {loc.status === 'ACTIVE' && (
                              <button className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-danger transition-colors" onClick={() => setDeleteTarget({ type: 'location', id: loc.location_id, name: loc.location_code })} title="Ngừng sử dụng">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Warehouse modal */}
      <Modal
        open={!!warehouseModal}
        onClose={() => setWarehouseModal(null)}
        title={warehouseModal?.mode === 'add' ? 'Thêm kho mới' : 'Chỉnh sửa kho'}
        footer={
          <>
            <Btn onClick={saveWarehouseModal} disabled={createWhMut.isPending || updateWhMut.isPending}>
              {createWhMut.isPending || updateWhMut.isPending ? 'Đang lưu...' : (warehouseModal?.mode === 'add' ? 'Tạo kho' : 'Lưu thay đổi')}
            </Btn>
            <Btn variant="secondary" onClick={() => setWarehouseModal(null)}>Huỷ</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên kho *</label>
            <Input value={warehouseForm.warehouse_name} onChange={(v) => setWarehouseForm({ ...warehouseForm, warehouse_name: v })} placeholder="VD: Kho A - Chính" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ</label>
            <Input value={warehouseForm.address} onChange={(v) => setWarehouseForm({ ...warehouseForm, address: v })} placeholder="Không bắt buộc" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
            <Input value={warehouseForm.description} onChange={(v) => setWarehouseForm({ ...warehouseForm, description: v })} placeholder="Không bắt buộc" />
          </div>
        </div>
      </Modal>

      {/* Location modal */}
      <Modal
        open={!!locationModal}
        onClose={() => setLocationModal(null)}
        title={locationModal?.mode === 'add' ? 'Thêm vị trí mới' : 'Chỉnh sửa vị trí'}
        footer={
          <>
            <Btn onClick={saveLocationModal} disabled={createLocMut.isPending || updateLocMut.isPending}>
              {createLocMut.isPending || updateLocMut.isPending ? 'Đang lưu...' : (locationModal?.mode === 'add' ? 'Tạo vị trí' : 'Lưu thay đổi')}
            </Btn>
            <Btn variant="secondary" onClick={() => setLocationModal(null)}>Huỷ</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kho *</label>
            <Select
              value={locationForm.warehouse_id}
              onChange={(v) => setLocationForm({ ...locationForm, warehouse_id: v })}
              options={warehouses.map((w) => ({ value: w.warehouse_id, label: w.warehouse_name }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã vị trí *</label>
            <Input value={locationForm.location_code} onChange={(v) => setLocationForm({ ...locationForm, location_code: v })} placeholder="VD: A1-01-K3" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Khu vực</label>
              <Input value={locationForm.area} onChange={(v) => setLocationForm({ ...locationForm, area: v })} placeholder="Khu A1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kệ</label>
              <Input value={locationForm.shelf} onChange={(v) => setLocationForm({ ...locationForm, shelf: v })} placeholder="Kệ 01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngăn</label>
              <Input value={locationForm.drawer} onChange={(v) => setLocationForm({ ...locationForm, drawer: v })} placeholder="Ngăn 01" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hộp</label>
            <Input value={locationForm.box} onChange={(v) => setLocationForm({ ...locationForm, box: v })} placeholder="Hộp K1" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.type === 'warehouse' ? 'Ngừng sử dụng kho' : 'Ngừng sử dụng vị trí'}
        message={
          deleteTarget?.type === 'warehouse'
            ? `Ngừng sử dụng kho "${deleteTarget.name}"? Không thể ngừng sử dụng nếu kho còn dữ liệu tồn kho/vị trí đang tham chiếu.`
            : `Ngừng sử dụng vị trí "${deleteTarget?.name}"?`
        }
        confirmLabel="Ngừng sử dụng"
        loading={deleteWhMut.isPending || deleteLocMut.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageLayout>
  );
}
