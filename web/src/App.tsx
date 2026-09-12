import { useState } from 'react';
import type { Page, UserRole } from './types';
import { ToastProvider } from './components/ui';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import CategoriesPage from './pages/CategoriesPage';
import WarehousesPage from './pages/WarehousesPage';
import SuppliersPage from './pages/SuppliersPage';
import ImportPage from './pages/ImportPage';
import ExportPage from './pages/ExportPage';
import TransferPage from './pages/TransferPage';
import RecoveryPage from './pages/RecoveryPage';
import StocktakePage from './pages/StocktakePage';
import DisposalPage from './pages/DisposalPage';
import HistoryPage from './pages/HistoryPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';

function PageRouter({ page, onNavigate }: { page: Page; onNavigate: (p: Page) => void }) {
  switch (page) {
    case 'dashboard': return <DashboardPage onNavigate={onNavigate} />;
    case 'inventory': return <InventoryPage onNavigate={onNavigate} />;
    case 'categories': return <CategoriesPage />;
    case 'warehouses': return <WarehousesPage />;
    case 'suppliers': return <SuppliersPage />;
    case 'import': return <ImportPage />;
    case 'export': return <ExportPage />;
    case 'transfer': return <TransferPage />;
    case 'recovery': return <RecoveryPage />;
    case 'stocktake': return <StocktakePage />;
    case 'disposal': return <DisposalPage />;
    case 'history': return <HistoryPage />;
    case 'users': return <UsersPage />;
    case 'roles': return <RolesPage />;
    default: return <DashboardPage onNavigate={onNavigate} />;
  }
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('admin');

  if (!isLoggedIn) {
    return (
      <ToastProvider>
        <LoginPage onLogin={() => setIsLoggedIn(true)} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="flex h-full bg-bg">
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          userRole={userRole}
          onRoleChange={setUserRole}
          onLogout={() => setIsLoggedIn(false)}
          userName="Cao Xuân Khu"
        />
        <main className="flex-1 overflow-auto" style={{ marginLeft: '220px' }}>
          <PageRouter page={currentPage} onNavigate={setCurrentPage} />
        </main>
      </div>
    </ToastProvider>
  );
}
