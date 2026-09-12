import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageLayout, { Card, Badge, Btn, Th, Td, Input, Select } from '../components/PageLayout';
import { Tabs, Modal, ConfirmDialog, useToast, EmptyState } from '../components/ui';
import { usePermission } from '../hooks/usePermission';
import { ApiError } from '../services/apiClient';
import {
  listItemCategories, createItemCategory, updateItemCategory, deleteItemCategory, type ItemCategory,
} from '../services/itemCategory.service';
import { listItems, createItem, updateItem, deleteItem, type Item } from '../services/item.service';

type CategoryModal = { mode: 'add' } | { mode: 'edit'; category: ItemCategory };
type ItemModal = { mode: 'add' } | { mode: 'edit'; item: Item };
type DeleteTarget = { type: 'category'; id: string; name: string } | { type: 'item'; id: string; name: string };

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export default function CategoriesPage() {
  const [tab, setTab] = useState<'categories' | 'items'>('categories');
  const [expanded, setExpanded] = useState<string[]>([]);
  const [categoryModal, setCategoryModal] = useState<CategoryModal | null>(null);
  const [itemModal, setItemModal] = useState<ItemModal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [categoryForm, setCategoryForm] = useState({ category_name: '', parent_id: '', description: '' });
  const [itemForm, setItemForm] = useState({ item_code: '', item_name: '', category_id: '', unit: '', min_stock: '0', max_stock: '' });

  const { canWrite } = usePermission();
  /** Danh mục (item_categories) và Vật tư (items) hiện cùng 1 quyền ghi (admin+manager) — vẫn tra theo resource, không giả định "cả trang 1 quyền", để không lệch nếu Backend đổi RBAC sau này. */
  const canWriteCurrentTab = tab === 'categories' ? canWrite('item_categories') : canWrite('items');

  const { show } = useToast();
  const qc = useQueryClient();

  const categoriesQuery = useQuery({ queryKey: ['item-categories'], queryFn: listItemCategories });
  const itemsQuery = useQuery({ queryKey: ['items'], queryFn: () => listItems() });

  const categories = categoriesQuery.data ?? [];
  const items = itemsQuery.data ?? [];
  const rootCategories = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);
  const itemCountOf = (categoryId: string) => items.filter((i) => i.category_id === categoryId).length;
  const categoryName = (id: string) => categories.find((c) => c.category_id === id)?.category_name ?? '—';

  const toggle = (id: string) => {
    setExpanded((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  /* ───────────── Category mutations ───────────── */

  const createCategoryMut = useMutation({
    mutationFn: createItemCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['item-categories'] });
      show('success', 'Đã tạo danh mục mới');
      setCategoryModal(null);
    },
    onError: (err) => show('error', errMsg(err, 'Tạo danh mục thất bại')),
  });

  const updateCategoryMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateItemCategory>[1] }) => updateItemCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['item-categories'] });
      show('success', 'Đã cập nhật danh mục');
      setCategoryModal(null);
    },
    onError: (err) => show('error', errMsg(err, 'Cập nhật danh mục thất bại')),
  });

  const deleteCategoryMut = useMutation({
    mutationFn: deleteItemCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['item-categories'] });
      show('success', 'Đã xoá danh mục');
      setDeleteTarget(null);
    },
    onError: (err) => {
      show('error', errMsg(err, 'Xoá danh mục thất bại'));
      setDeleteTarget(null);
    },
  });

  /* ───────────── Item mutations ───────────── */

  const createItemMut = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      show('success', 'Đã tạo vật tư mới');
      setItemModal(null);
    },
    onError: (err) => show('error', errMsg(err, 'Tạo vật tư thất bại')),
  });

  const updateItemMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateItem>[1] }) => updateItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      show('success', 'Đã cập nhật vật tư');
      setItemModal(null);
    },
    onError: (err) => show('error', errMsg(err, 'Cập nhật vật tư thất bại')),
  });

  const deleteItemMut = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      show('success', 'Đã ngừng sử dụng vật tư');
      setDeleteTarget(null);
    },
    onError: (err) => {
      show('error', errMsg(err, 'Ngừng sử dụng vật tư thất bại'));
      setDeleteTarget(null);
    },
  });

  /* ───────────── Modal openers ───────────── */

  function openAddCategory(parentId?: string) {
    setCategoryForm({ category_name: '', parent_id: parentId ?? '', description: '' });
    setCategoryModal({ mode: 'add' });
  }
  function openEditCategory(cat: ItemCategory) {
    setCategoryForm({ category_name: cat.category_name, parent_id: cat.parent_id ?? '', description: cat.description ?? '' });
    setCategoryModal({ mode: 'edit', category: cat });
  }
  function saveCategoryModal() {
    if (!categoryForm.category_name.trim()) return;
    const data = {
      category_name: categoryForm.category_name.trim(),
      parent_id: categoryForm.parent_id || null,
      description: categoryForm.description || undefined,
    };
    if (categoryModal?.mode === 'add') createCategoryMut.mutate(data);
    else if (categoryModal?.mode === 'edit') updateCategoryMut.mutate({ id: categoryModal.category.category_id, data });
  }

  function openAddItem() {
    setItemForm({ item_code: '', item_name: '', category_id: rootCategories[0]?.category_id ?? '', unit: '', min_stock: '0', max_stock: '' });
    setItemModal({ mode: 'add' });
  }
  function openEditItem(item: Item) {
    setItemForm({
      item_code: item.item_code, item_name: item.item_name, category_id: item.category_id, unit: item.unit,
      min_stock: String(item.min_stock), max_stock: item.max_stock != null ? String(item.max_stock) : '',
    });
    setItemModal({ mode: 'edit', item });
  }
  function saveItemModal() {
    if (!itemForm.item_code.trim() || !itemForm.item_name.trim() || !itemForm.category_id || !itemForm.unit.trim()) return;
    const data = {
      item_code: itemForm.item_code.trim(),
      item_name: itemForm.item_name.trim(),
      category_id: itemForm.category_id,
      unit: itemForm.unit.trim(),
      min_stock: Number(itemForm.min_stock) || 0,
      max_stock: itemForm.max_stock ? Number(itemForm.max_stock) : undefined,
    };
    if (itemModal?.mode === 'add') createItemMut.mutate(data);
    else if (itemModal?.mode === 'edit') updateItemMut.mutate({ id: itemModal.item.item_id, data });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'category') deleteCategoryMut.mutate(deleteTarget.id);
    else deleteItemMut.mutate(deleteTarget.id);
  }

  const isLoading = categoriesQuery.isLoading || itemsQuery.isLoading;
  const loadError = categoriesQuery.error || itemsQuery.error;

  return (
    <PageLayout
      title={tab === 'categories' ? 'Danh mục vật tư' : 'Danh mục & Vật tư'}
      subtitle="Quản lý cây danh mục và từ điển vật tư của hệ thống"
      actions={
        <>
          <Tabs
            value={tab}
            onChange={setTab}
            options={[
              { value: 'categories', label: 'Danh mục' },
              { value: 'items', label: 'Vật tư' },
            ]}
          />
          {canWriteCurrentTab && (
            <Btn onClick={() => (tab === 'categories' ? openAddCategory() : openAddItem())}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7-7 7 7" />
              </svg>
              {tab === 'categories' ? 'Thêm danh mục' : 'Thêm vật tư'}
            </Btn>
          )}
        </>
      }
    >
      {isLoading ? (
        <div className="py-16 text-center text-sm text-gray-400">Đang tải dữ liệu...</div>
      ) : loadError ? (
        <EmptyState title="Không tải được dữ liệu" description={errMsg(loadError, 'Lỗi không xác định')} />
      ) : tab === 'categories' ? (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Tổng: <b className="text-gray-900">{rootCategories.length} danh mục chính</b>, <b className="text-gray-900">{categories.length - rootCategories.length} danh mục con</b>
            </span>
          </div>
          {categories.length === 0 ? (
            <EmptyState title="Chưa có danh mục nào" action={canWriteCurrentTab ? { label: 'Thêm danh mục đầu tiên', onClick: () => openAddCategory() } : undefined} />
          ) : (
            <div className="divide-y divide-gray-50">
              {rootCategories.map((cat) => (
                <div key={cat.category_id}>
                  {/* Parent row */}
                  <div
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer transition-colors"
                    onClick={() => toggle(cat.category_id)}
                  >
                    <button className="w-5 h-5 rounded flex items-center justify-center text-gray-400 flex-shrink-0">
                      <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                        strokeLinecap="round" strokeLinejoin="round"
                        className={`transition-transform ${expanded.includes(cat.category_id) ? 'rotate-90' : ''}`}
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 font-bold text-xs">{cat.category_name.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">{cat.category_name}</span>
                    </div>
                    <Badge color="indigo">{itemCountOf(cat.category_id)} vật tư</Badge>
                    {canWriteCurrentTab && (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600 transition-colors"
                          onClick={(e) => { e.stopPropagation(); openEditCategory(cat); }}
                          title="Sửa"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-danger transition-colors"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'category', id: cat.category_id, name: cat.category_name }); }}
                          title="Xoá"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Children */}
                  {expanded.includes(cat.category_id) && childrenOf(cat.category_id).map((child) => (
                    <div key={child.category_id} className="flex items-center gap-3 px-5 py-2.5 pl-14 bg-gray-50/40 hover:bg-gray-50 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                      <span className="text-sm text-gray-700 flex-1">{child.category_name}</span>
                      <Badge color="gray">{itemCountOf(child.category_id)} vật tư</Badge>
                      {canWriteCurrentTab && (
                        <div className="flex items-center gap-1 ml-2">
                          <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600 transition-colors" onClick={() => openEditCategory(child)} title="Sửa">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-danger transition-colors" onClick={() => setDeleteTarget({ type: 'category', id: child.category_id, name: child.category_name })} title="Xoá">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm text-gray-500">Tổng: <b className="text-gray-900">{items.length} vật tư</b></p>
          </div>
          {items.length === 0 ? (
            <EmptyState title="Chưa có vật tư nào" action={canWriteCurrentTab ? { label: 'Thêm vật tư đầu tiên', onClick: openAddItem } : undefined} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Mã vật tư</Th>
                    <Th>Tên vật tư</Th>
                    <Th>Danh mục</Th>
                    <Th>Đơn vị</Th>
                    <Th className="text-right">Ngưỡng min</Th>
                    <Th className="text-right">Ngưỡng max</Th>
                    <Th>Trạng thái</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.item_id} className="hover:bg-gray-50/60 transition-colors">
                      <Td><span className="font-mono text-xs text-gray-500">{item.item_code}</span></Td>
                      <Td><span className="font-semibold text-gray-900">{item.item_name}</span></Td>
                      <Td><span className="text-gray-500 text-sm">{categoryName(item.category_id)}</span></Td>
                      <Td>{item.unit}</Td>
                      <Td className="text-right text-gray-700">{item.min_stock.toLocaleString('vi-VN')}</Td>
                      <Td className="text-right text-gray-700">{item.max_stock != null ? item.max_stock.toLocaleString('vi-VN') : '—'}</Td>
                      <Td>
                        <Badge color={item.status === 'ACTIVE' ? 'green' : 'gray'}>
                          {item.status === 'ACTIVE' ? 'Đang dùng' : 'Ngưng dùng'}
                        </Badge>
                      </Td>
                      <Td>
                        {canWriteCurrentTab && (
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors" onClick={() => openEditItem(item)} title="Sửa">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {item.status === 'ACTIVE' && (
                              <button className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-danger transition-colors" onClick={() => setDeleteTarget({ type: 'item', id: item.item_id, name: item.item_name })} title="Ngừng sử dụng">
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

      {/* Category modal */}
      <Modal
        open={!!categoryModal}
        onClose={() => setCategoryModal(null)}
        title={categoryModal?.mode === 'add' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
        footer={
          <>
            <Btn onClick={saveCategoryModal} disabled={createCategoryMut.isPending || updateCategoryMut.isPending}>
              {createCategoryMut.isPending || updateCategoryMut.isPending ? 'Đang lưu...' : (categoryModal?.mode === 'add' ? 'Tạo danh mục' : 'Lưu thay đổi')}
            </Btn>
            <Btn variant="secondary" onClick={() => setCategoryModal(null)}>Huỷ</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên danh mục *</label>
            <Input value={categoryForm.category_name} onChange={(v) => setCategoryForm({ ...categoryForm, category_name: v })} placeholder="VD: Vi mạch tích hợp" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục cha</label>
            <Select
              value={categoryForm.parent_id}
              onChange={(v) => setCategoryForm({ ...categoryForm, parent_id: v })}
              options={[
                { value: '', label: '— Danh mục gốc (không có cha) —' },
                ...rootCategories
                  .filter((c) => categoryModal?.mode !== 'edit' || c.category_id !== categoryModal.category.category_id)
                  .map((c) => ({ value: c.category_id, label: c.category_name })),
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
            <Input value={categoryForm.description} onChange={(v) => setCategoryForm({ ...categoryForm, description: v })} placeholder="Không bắt buộc" />
          </div>
        </div>
      </Modal>

      {/* Item modal */}
      <Modal
        open={!!itemModal}
        onClose={() => setItemModal(null)}
        title={itemModal?.mode === 'add' ? 'Thêm vật tư mới' : 'Chỉnh sửa vật tư'}
        footer={
          <>
            <Btn onClick={saveItemModal} disabled={createItemMut.isPending || updateItemMut.isPending}>
              {createItemMut.isPending || updateItemMut.isPending ? 'Đang lưu...' : (itemModal?.mode === 'add' ? 'Tạo vật tư' : 'Lưu thay đổi')}
            </Btn>
            <Btn variant="secondary" onClick={() => setItemModal(null)}>Huỷ</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã vật tư *</label>
              <Input value={itemForm.item_code} onChange={(v) => setItemForm({ ...itemForm, item_code: v })} placeholder="VD: SP-0001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Đơn vị tính *</label>
              <Input value={itemForm.unit} onChange={(v) => setItemForm({ ...itemForm, unit: v })} placeholder="VD: Cái" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên vật tư *</label>
            <Input value={itemForm.item_name} onChange={(v) => setItemForm({ ...itemForm, item_name: v })} placeholder="VD: IC555 Timer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục *</label>
            <Select
              value={itemForm.category_id}
              onChange={(v) => setItemForm({ ...itemForm, category_id: v })}
              options={categories.map((c) => ({ value: c.category_id, label: c.category_name }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngưỡng tối thiểu</label>
              <Input type="number" value={itemForm.min_stock} onChange={(v) => setItemForm({ ...itemForm, min_stock: v })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngưỡng tối đa</label>
              <Input type="number" value={itemForm.max_stock} onChange={(v) => setItemForm({ ...itemForm, max_stock: v })} placeholder="Không bắt buộc" />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.type === 'category' ? 'Xoá danh mục' : 'Ngừng sử dụng vật tư'}
        message={
          deleteTarget?.type === 'category'
            ? `Xoá danh mục "${deleteTarget.name}"? Không thể xoá nếu còn vật tư hoặc danh mục con đang tham chiếu tới danh mục này.`
            : `Ngừng sử dụng vật tư "${deleteTarget?.name}"? Vật tư sẽ được ẩn khỏi danh sách chọn khi tạo phiếu mới, dữ liệu tồn kho hiện có vẫn được giữ nguyên.`
        }
        confirmLabel={deleteTarget?.type === 'category' ? 'Xoá' : 'Ngừng sử dụng'}
        loading={deleteCategoryMut.isPending || deleteItemMut.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageLayout>
  );
}
