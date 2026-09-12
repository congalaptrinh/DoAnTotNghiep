import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth, RequireGuest, PagePermission } from './components/RouteGuards';
import AppShell from './layouts/AppShell';
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

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <RequireGuest>
                    <LoginPage />
                  </RequireGuest>
                }
              />

              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<PagePermission page="dashboard"><DashboardPage /></PagePermission>} />
                  <Route path="/inventory" element={<PagePermission page="inventory"><InventoryPage /></PagePermission>} />
                  <Route path="/categories" element={<PagePermission page="categories"><CategoriesPage /></PagePermission>} />
                  <Route path="/warehouses" element={<PagePermission page="warehouses"><WarehousesPage /></PagePermission>} />
                  <Route path="/suppliers" element={<PagePermission page="suppliers"><SuppliersPage /></PagePermission>} />
                  <Route path="/import" element={<PagePermission page="import"><ImportPage /></PagePermission>} />
                  <Route path="/export" element={<PagePermission page="export"><ExportPage /></PagePermission>} />
                  <Route path="/transfer" element={<PagePermission page="transfer"><TransferPage /></PagePermission>} />
                  <Route path="/recovery" element={<PagePermission page="recovery"><RecoveryPage /></PagePermission>} />
                  <Route path="/stocktake" element={<PagePermission page="stocktake"><StocktakePage /></PagePermission>} />
                  <Route path="/disposal" element={<PagePermission page="disposal"><DisposalPage /></PagePermission>} />
                  <Route path="/history" element={<PagePermission page="history"><HistoryPage /></PagePermission>} />
                  <Route path="/users" element={<PagePermission page="users"><UsersPage /></PagePermission>} />
                  <Route path="/roles" element={<PagePermission page="roles"><RolesPage /></PagePermission>} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
