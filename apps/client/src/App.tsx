import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/auth.store';
import { useUIStore } from './store/ui.store';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/LoginPage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import MyPropertiesPage from './pages/MyPropertiesPage';
import MyBookingsPage from './pages/MyBookingsPage';
import MyCalendarPage from './pages/MyCalendarPage';
import FinancialSummaryPage from './pages/FinancialSummaryPage';
import MyDocumentsPage from './pages/MyDocumentsPage';
import MaintenanceRequestsPage from './pages/MaintenanceRequestsPage';
import LoyaltyPage from './pages/LoyaltyPage';
import SettingsPage from './pages/SettingsPage';
import PortfolioOverviewPage from './pages/PortfolioOverviewPage';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { locale } = useUIStore();
  const dir = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <div dir={dir} className="min-h-screen bg-surface">
      <Toaster position={dir === 'rtl' ? 'top-left' : 'top-right'} richColors />
      <Routes>
        <Route element={<GuestGuard><AuthLayout /></GuestGuard>}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<AuthGuard><DashboardLayout /></AuthGuard>}>
          <Route path="/" element={<ClientDashboardPage />} />
          <Route path="/properties" element={<MyPropertiesPage />} />
          <Route path="/bookings" element={<MyBookingsPage />} />
          <Route path="/financials" element={<FinancialSummaryPage />} />
          <Route path="/documents" element={<MyDocumentsPage />} />
          <Route path="/maintenance" element={<MaintenanceRequestsPage />} />
          <Route path="/loyalty" element={<LoyaltyPage />} />
          <Route path="/messages" element={<div className="p-6 font-headline text-2xl">Messages — Coming Soon</div>} />
          <Route path="/portfolio" element={<PortfolioOverviewPage />} />
          <Route path="/calendar" element={<MyCalendarPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
