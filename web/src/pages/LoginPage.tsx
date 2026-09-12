import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/apiClient';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@warehouse.local');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng nhập thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left gradient panel */}
      <div className="hidden md:flex w-[55%] flex-col items-center justify-center p-12 relative overflow-hidden bg-gradient-to-br from-brand-from to-brand-to">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-12 w-40 h-40 rounded-full bg-white/8" />
        <div className="absolute bottom-1/4 left-8 w-24 h-24 rounded-full bg-white/6" />

        <div className="relative z-10 max-w-md w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7l-8-4-8 4 8 4 8-4zM4 7v10l8 4m0-14v14m8-14v10l-8 4" />
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-2xl">TechStore WMS</div>
              <div className="text-white/50 text-sm">Warehouse Management System</div>
            </div>
          </div>

          <h1 className="text-white text-4xl font-bold mb-4 leading-tight">
            Quản lý kho<br />thông minh
          </h1>
          <p className="text-white/70 mb-10 text-lg leading-relaxed">
            Hệ thống quản lý kho linh kiện điện tử tích hợp AI nhận diện vật tư tự động.
          </p>

          <div className="space-y-4">
            {[
              'Nhận diện linh kiện tự động bằng AI qua ảnh chụp',
              'Quản lý tồn kho theo thời gian thực, cảnh báo tức thì',
              'Phân quyền chi tiết: Admin, Quản lý, Nhân viên, Xem báo cáo',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/85 text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-[360px]">
          <div className="md:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-brand-from to-brand-to">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7l-8-4-8 4 8 4 8-4zM4 7v10l8 4m0-14v14m8-14v10l-8 4" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">TechStore WMS</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Đăng nhập</h2>
          <p className="text-gray-500 text-sm mb-8">Nhập thông tin tài khoản để tiếp tục</p>

          {error && (
            <div className="mb-5 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="email@techstore.vn"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-70 bg-gradient-to-r from-brand-from to-brand-to"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-2">Tài khoản demo:</p>
            <div className="space-y-1 text-xs text-gray-500">
              <div><span className="text-gray-700 font-medium">Admin:</span> admin@warehouse.local</div>
              <div><span className="text-gray-700 font-medium">Mật khẩu:</span> Admin@123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
