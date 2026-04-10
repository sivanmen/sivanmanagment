import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/auth.store';
import { useUIStore } from './store/ui.store';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PropertiesListPage from './pages/PropertiesListPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import PropertyFormPage from './pages/PropertyFormPage';
import OwnersListPage from './pages/OwnersListPage';
import OwnerDetailPage from './pages/OwnerDetailPage';

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
          <Route path="/" element={<DashboardPage />} />
          <Route path="/properties" element={<PropertiesListPage />} />
          <Route path="/properties/new" element={<PropertyFormPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/properties/:id/edit" element={<PropertyFormPage />} />
          <Route path="/bookings" element={<div className="p-6 font-headline text-2xl">Bookings — Coming Soon</div>} />
          <Route path="/owners" element={<OwnersListPage />} />
          <Route path="/owners/new" element={<div className="p-6 font-headline text-2xl">New Owner — Coming Soon</div>} />
          <Route path="/owners/:id" element={<OwnerDetailPage />} />
          <Route path="/finance" element={<div className="p-6 font-headline text-2xl">Finance — Coming Soon</div>} />
          <Route path="/calendar" element={<div className="p-6 font-headline text-2xl">Calendar — Coming Soon</div>} />
          <Route path="/maintenance" element={<div className="p-6 font-headline text-2xl">Maintenance — Coming Soon</div>} />
          <Route path="/communications" element={<div className="p-6 font-headline text-2xl">Inbox — Coming Soon</div>} />
          <Route path="/reports" element={<div className="p-6 font-headline text-2xl">Reports — Coming Soon</div>} />
          <Route path="/channels" element={<div className="p-6 font-headline text-2xl">Channels — Coming Soon</div>} />
          <Route path="/loyalty" element={<div className="p-6 font-headline text-2xl">Loyalty — Coming Soon</div>} />
          <Route path="/affiliates" element={<div className="p-6 font-headline text-2xl">Affiliates — Coming Soon</div>} />
          <Route path="/settings" element={<div className="p-6 font-headline text-2xl">Settings — Coming Soon</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
