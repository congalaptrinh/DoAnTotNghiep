import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function PageLayout({ title, subtitle, actions, children }: Props) {
  return (
    <div className="p-6 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Card({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ color, children }: { color: 'green' | 'red' | 'yellow' | 'blue' | 'indigo' | 'purple' | 'gray'; children: ReactNode }) {
  const styles: Record<string, string> = {
    green: 'bg-green-50 text-green-700 border border-green-200',
    red: 'bg-red-50 text-red-700 border border-red-200',
    yellow: 'bg-amber-50 text-amber-700 border border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
    gray: 'bg-gray-50 text-gray-600 border border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${styles[color]}`}>
      {children}
    </span>
  );
}

export function Btn({
  children, onClick, variant = 'primary', size = 'md', type = 'button', disabled = false,
}: {
  children: ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const base = 'inline-flex items-center gap-2 font-medium rounded-lg transition-all';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  const variants = {
    primary: 'bg-gradient-to-r from-brand-from to-brand-to text-white hover:opacity-90 shadow-sm',
    secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm',
    danger: 'bg-danger text-white hover:opacity-90',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
      }`}
    >
      {children}
    </button>
  );
}

export function Input({ placeholder, value, onChange, type = 'text', className = '', error, disabled = false }: {
  placeholder?: string; value?: string; onChange?: (v: string) => void; type?: string; className?: string;
  error?: string; disabled?: boolean;
}) {
  return (
    <div className={className}>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400 transition-colors ${
          error
            ? 'border-danger focus:ring-danger/40'
            : 'border-gray-200 focus:ring-indigo-400'
        } ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Select({ value, onChange, options, className = '', error, disabled = false }: {
  value?: string; onChange?: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string; error?: string; disabled?: boolean;
}) {
  return (
    <div className={className}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-transparent text-gray-700 transition-colors ${
          error
            ? 'border-danger focus:ring-danger/40'
            : 'border-gray-200 focus:ring-indigo-400'
        } ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-sm text-gray-700 border-b border-gray-50 ${className}`}>
      {children}
    </td>
  );
}
