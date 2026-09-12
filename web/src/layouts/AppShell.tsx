import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

/** Khung ứng dụng dùng chung cho mọi trang sau khi đăng nhập: sidebar trái cố định + content area. */
export default function AppShell() {
  return (
    <div className="flex h-full bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-auto" style={{ marginLeft: '220px' }}>
        <Outlet />
      </main>
    </div>
  );
}
