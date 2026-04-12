import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/auth.store';
import { useUIStore } from './store/ui.store';
import AuthLayout from './layouts/AuthLayout';
import AppLayout from './components/AppLayout';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ClientDashboardPage = lazy(() => import('./pages/ClientDashboardPage'));
const MyPropertiesPage = lazy(() => import('./pages/MyPropertiesPage'));
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage'));
const MyCalendarPage = lazy(() => import('./pages/MyCalendarPage'));
const FinancialSummaryPage = lazy(() => import('./pages/FinancialSummaryPage'));
const MyDocumentsPage = lazy(() => import('./pages/MyDocumentsPage'));
const MaintenanceRequestsPage = lazy(() => import('./pages/MaintenanceRequestsPage'));
const LoyaltyPage = lazy(() => import('./pages/LoyaltyPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PortfolioOverviewPage = lazy(() => import('./pages/PortfolioOverviewPage'));
const OwnerReservationsPage = lazy(() => import('./pages/OwnerReservationsPage'));
const StatementsPage = lazy(() => import('./pages/StatementsPage'));
const AffiliatePage = lazy(() => import('./pages/AffiliatePage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const PendingApprovalsPage = lazy(() => import('./pages/PendingApprovalsPage'));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Loading screen component - Sivan Obsidian design
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-secondary/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-secondary animate-spin" />
        </div>
        <p className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">Loading</p>
      </div>
    </div>
  );
}

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
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route element={<GuestGuard><AuthLayout /></GuestGuard>}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
          <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
            <Route path="/" element={<ClientDashboardPage />} />
            <Route path="/properties" element={<MyPropertiesPage />} />
            <Route path="/properties/:id" element={<PropertyDetailPage />} />
            <Route path="/bookings" element={<MyBookingsPage />} />
            <Route path="/financials" element={<FinancialSummaryPage />} />
            <Route path="/documents" element={<MyDocumentsPage />} />
            <Route path="/maintenance" element={<MaintenanceRequestsPage />} />
            <Route path="/loyalty" element={<LoyaltyPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/portfolio" element={<PortfolioOverviewPage />} />
            <Route path="/calendar" element={<MyCalendarPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/owner-reservations" element={<OwnerReservationsPage />} />
            <Route path="/statements" element={<StatementsPage />} />
            <Route path="/affiliate" element={<AffiliatePage />} />
            <Route path="/approvals" element={<PendingApprovalsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}
