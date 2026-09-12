import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Component dùng chung bổ sung (Giai đoạn B) — thay cho các đoạn code lặp lại
 * tay ở nhiều trang (Modal, Tabs, Avatar, Pagination...) hoặc component còn
 * thiếu hoàn toàn (Toast, Checkbox, Radio, SearchInput, EmptyState, StatCard,
 * Breadcrumb, Stepper). Xem specs/07-DECISIONS-LOG.md — Giai đoạn B để biết
 * lý do từng component được tách ra.
 */

/* ───────────────────────── Checkbox / Radio ───────────────────────── */

export function Checkbox({
  checked, onChange, label, disabled = false,
}: {
  checked: boolean; onChange?: (v: boolean) => void; label?: ReactNode; disabled?: boolean;
}) {
  return (
    <label className={`inline-flex items-center gap-2 text-sm ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-brand-from focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed"
      />
      {label}
    </label>
  );
}

export function Radio({
  checked, onChange, label, name, disabled = false,
}: {
  checked: boolean; onChange?: () => void; label?: ReactNode; name: string; disabled?: boolean;
}) {
  return (
    <label className={`inline-flex items-center gap-2 text-sm ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'}`}>
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange?.()}
        className="w-4 h-4 border-gray-300 text-brand-from focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed"
      />
      {label}
    </label>
  );
}

/* ───────────────────────── SearchInput ───────────────────────── */

export function SearchInput({
  value, onChange, placeholder = 'Tìm kiếm...', className = '',
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <svg
        width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      >
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-400"
      />
    </div>
  );
}

/* ───────────────────────── Modal ───────────────────────── */

export function Modal({
  open, onClose, title, children, footer, size = 'md',
}: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${widths[size]} mx-4 p-6 max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
        {footer && <div className="flex gap-3 mt-6">{footer}</div>}
      </div>
    </div>
  );
}

/* ───────────────────────── Toast ───────────────────────── */

type ToastKind = 'success' | 'error' | 'warning' | 'info';
interface ToastItem { id: number; kind: ToastKind; message: string; }

const TOAST_STYLES: Record<ToastKind, { bg: string; icon: string }> = {
  success: { bg: 'bg-success', icon: 'M5 13l4 4L19 7' },
  error: { bg: 'bg-danger', icon: 'M6 18L18 6M6 6l12 12' },
  warning: { bg: 'bg-warning', icon: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
  info: { bg: 'bg-info', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
};

const ToastContext = createContext<{ show: (kind: ToastKind, message: string) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end">
        {items.map((t) => {
          const s = TOAST_STYLES[t.kind];
          return (
            <div key={t.id} className="flex items-center gap-2.5 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 min-w-[260px] max-w-sm animate-in fade-in slide-in-from-bottom-2">
              <span className={`w-6 h-6 rounded-full ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
              </span>
              <span className="text-sm text-gray-700">{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** Gọi bên trong component con của <ToastProvider> (App.tsx đã bọc sẵn toàn app). */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast phải được gọi bên trong <ToastProvider>');
  return ctx;
}

/* ───────────────────────── Tabs ───────────────────────── */

export function Tabs<T extends string>({
  value, onChange, options,
}: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[];
}) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-4 py-1.5 rounded-md font-medium transition-all ${
            value === o.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────── Breadcrumb ───────────────────────── */

export function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-2" aria-label="breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-gray-300">/</span>}
          {item.onClick ? (
            <button onClick={item.onClick} className="hover:text-indigo-600 transition-colors">{item.label}</button>
          ) : (
            <span className={i === items.length - 1 ? 'text-gray-700 font-medium' : ''}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/* ───────────────────────── Avatar ───────────────────────── */

const AVATAR_COLORS: Record<string, string> = {
  indigo: 'bg-indigo-100 text-indigo-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-gray-100 text-gray-600',
  /** Dùng trên nền gradient thương hiệu (sidebar) thay vì nền trắng. */
  brand: 'bg-white/20 text-white',
};

const AVATAR_SIZES = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-12 h-12 text-lg' };

export function Avatar({
  name, color = 'indigo', size = 'sm',
}: {
  name: string; color?: keyof typeof AVATAR_COLORS; size?: keyof typeof AVATAR_SIZES;
}) {
  return (
    <div className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 ${AVATAR_COLORS[color]} ${AVATAR_SIZES[size]}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ───────────────────────── Progress Stepper ───────────────────────── */

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className={`flex items-center gap-2.5 ${i + 1 <= current ? 'text-brand-from' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0 ${
              i + 1 < current ? 'bg-brand-from border-brand-from text-white'
              : i + 1 === current ? 'border-brand-from text-brand-from bg-white'
              : 'border-gray-200 text-gray-400 bg-white'
            }`}>
              {i + 1 < current ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ) : i + 1}
            </div>
            <span className="text-sm font-medium hidden sm:inline">{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-3 ${i + 1 < current ? 'bg-brand-from' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── Pagination ───────────────────────── */

export function Pagination({
  page, totalPages, totalItems, pageSize, onChange,
}: {
  page: number; totalPages: number; totalItems: number; pageSize: number; onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
      <span className="text-xs text-gray-400">
        Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} / {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Trang trước"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-brand-from text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Trang sau"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── EmptyState ───────────────────────── */

export function EmptyState({
  title = 'Không tìm thấy kết quả', description, action,
}: {
  title?: string; description?: string; action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="py-16 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="text-gray-500 font-medium">{title}</p>
      {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="mt-3 text-sm text-brand-from hover:underline">
          {action.label}
        </button>
      )}
    </div>
  );
}

/* ───────────────────────── TableSkeleton ───────────────────────── */

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3 border-b border-gray-50">
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} className="h-3 bg-gray-100 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── StatCard ───────────────────────── */

export function StatCard({
  label, value, sub, icon, onClick, variant = 'flat', color = 'brand',
}: {
  label: string; value: string | number; sub?: string; icon?: string; onClick?: () => void;
  variant?: 'flat' | 'hero';
  color?: 'brand' | 'danger' | 'warning' | 'success';
}) {
  const iconBg: Record<string, string> = {
    brand: 'bg-gradient-to-br from-brand-from to-brand-to',
    danger: 'bg-danger',
    warning: 'bg-warning',
    success: 'bg-success',
  };
  const flatColors: Record<string, string> = {
    brand: 'text-brand-from bg-indigo-50 border-indigo-100',
    danger: 'text-danger bg-red-50 border-red-100',
    warning: 'text-warning bg-amber-50 border-amber-100',
    success: 'text-success bg-green-50 border-green-100',
  };

  if (variant === 'hero') {
    return (
      <div
        onClick={onClick}
        className={`bg-white rounded-2xl p-4 shadow-lg shadow-black/10 transition-all ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-0.5' : ''}`}
      >
        {icon && (
          <div className={`w-9 h-9 rounded-xl ${iconBg[color]} flex items-center justify-center mb-3`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d={icon} />
            </svg>
          </div>
        )}
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 font-medium mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      </div>
    );
  }

  const [textCls, bgCls, borderCls] = flatColors[color].split(' ');
  return (
    <button
      onClick={onClick}
      className={`${bgCls} border ${borderCls} rounded-xl px-5 py-4 flex items-center justify-between hover:shadow-sm transition-all text-left ${onClick ? '' : 'cursor-default'}`}
    >
      <span className="text-sm text-gray-600 font-medium">{label}</span>
      <span className={`text-2xl font-bold ${textCls}`}>{value}</span>
    </button>
  );
}
