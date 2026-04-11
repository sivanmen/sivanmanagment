import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/auth.store';
import { useUIStore } from './store/ui.store';
import AuthLayout from './layouts/AuthLayout';
import AppLayout from './components/AppLayout';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PropertiesListPage = lazy(() => import('./pages/PropertiesListPage'));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage'));
const PropertyFormPage = lazy(() => import('./pages/PropertyFormPage'));
const OwnersListPage = lazy(() => import('./pages/OwnersListPage'));
const OwnerDetailPage = lazy(() => import('./pages/OwnerDetailPage'));
const OwnerFormPage = lazy(() => import('./pages/OwnerFormPage'));
const BookingsListPage = lazy(() => import('./pages/BookingsListPage'));
const BookingDetailPage = lazy(() => import('./pages/BookingDetailPage'));
const BookingFormPage = lazy(() => import('./pages/BookingFormPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const GuestsListPage = lazy(() => import('./pages/GuestsListPage'));
const GuestDetailPage = lazy(() => import('./pages/GuestDetailPage'));
const FinanceDashboardPage = lazy(() => import('./pages/FinanceDashboardPage'));
const IncomeListPage = lazy(() => import('./pages/IncomeListPage'));
const IncomeFormPage = lazy(() => import('./pages/IncomeFormPage'));
const ExpenseListPage = lazy(() => import('./pages/ExpenseListPage'));
const ExpenseFormPage = lazy(() => import('./pages/ExpenseFormPage'));
const ManagementFeesPage = lazy(() => import('./pages/ManagementFeesPage'));
const DocumentsListPage = lazy(() => import('./pages/DocumentsListPage'));
const MaintenanceListPage = lazy(() => import('./pages/MaintenanceListPage'));
const MaintenanceDetailPage = lazy(() => import('./pages/MaintenanceDetailPage'));
const MaintenanceFormPage = lazy(() => import('./pages/MaintenanceFormPage'));
const TasksListPage = lazy(() => import('./pages/TasksListPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const ChannelsPage = lazy(() => import('./pages/ChannelsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const LoyaltyAdminPage = lazy(() => import('./pages/LoyaltyAdminPage'));
const AffiliatesPage = lazy(() => import('./pages/AffiliatesPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const AutomationsPage = lazy(() => import('./pages/AutomationsPage'));
const MarketingPage = lazy(() => import('./pages/MarketingPage'));
const SystemSettingsPage = lazy(() => import('./pages/SystemSettingsPage'));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));
const GuestExperiencePage = lazy(() => import('./pages/GuestExperiencePage'));
const GuestPortalPreviewPage = lazy(() => import('./pages/GuestPortalPreviewPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const BookingExtrasPage = lazy(() => import('./pages/BookingExtrasPage'));
const AnalyticsDashboardPage = lazy(() => import('./pages/AnalyticsDashboardPage'));
const PropertyScoringPage = lazy(() => import('./pages/PropertyScoringPage'));
const TeamManagementPage = lazy(() => import('./pages/TeamManagementPage'));
const BookingEnginePage = lazy(() => import('./pages/BookingEnginePage'));
const OwnerPortalConfigPage = lazy(() => import('./pages/OwnerPortalConfigPage'));
const OwnerStatementsPage = lazy(() => import('./pages/OwnerStatementsPage'));
const WebhooksPage = lazy(() => import('./pages/WebhooksPage'));
const OnboardingWizardPage = lazy(() => import('./pages/OnboardingWizardPage'));
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
            <Route path="/" element={<DashboardPage />} />
            <Route path="/properties" element={<PropertiesListPage />} />
            <Route path="/properties/new" element={<PropertyFormPage />} />
            <Route path="/properties/:id" element={<PropertyDetailPage />} />
            <Route path="/properties/:id/edit" element={<PropertyFormPage />} />
            <Route path="/bookings" element={<BookingsListPage />} />
            <Route path="/bookings/new" element={<BookingFormPage />} />
            <Route path="/bookings/:id" element={<BookingDetailPage />} />
            <Route path="/bookings/:id/edit" element={<BookingFormPage />} />
            <Route path="/owners" element={<OwnersListPage />} />
            <Route path="/owners/new" element={<OwnerFormPage />} />
            <Route path="/owners/:id" element={<OwnerDetailPage />} />
            <Route path="/owners/:id/edit" element={<OwnerFormPage />} />
            <Route path="/finance" element={<FinanceDashboardPage />} />
            <Route path="/finance/income" element={<IncomeListPage />} />
            <Route path="/finance/income/new" element={<IncomeFormPage />} />
            <Route path="/finance/income/:id/edit" element={<IncomeFormPage />} />
            <Route path="/finance/expenses" element={<ExpenseListPage />} />
            <Route path="/finance/expenses/new" element={<ExpenseFormPage />} />
            <Route path="/finance/expenses/:id/edit" element={<ExpenseFormPage />} />
            <Route path="/finance/fees" element={<ManagementFeesPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/guests" element={<GuestsListPage />} />
            <Route path="/guests/:id" element={<GuestDetailPage />} />
            <Route path="/documents" element={<DocumentsListPage />} />
            <Route path="/maintenance" element={<MaintenanceListPage />} />
            <Route path="/maintenance/new" element={<MaintenanceFormPage />} />
            <Route path="/maintenance/:id" element={<MaintenanceDetailPage />} />
            <Route path="/maintenance/:id/edit" element={<MaintenanceFormPage />} />
            <Route path="/tasks" element={<TasksListPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/communications" element={<MessagesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/channels" element={<ChannelsPage />} />
            <Route path="/loyalty" element={<LoyaltyAdminPage />} />
            <Route path="/affiliates" element={<AffiliatesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/automations" element={<AutomationsPage />} />
            <Route path="/marketing" element={<MarketingPage />} />
            <Route path="/settings" element={<SystemSettingsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/guest-experience" element={<GuestExperiencePage />} />
            <Route path="/guest-portal-preview" element={<GuestPortalPreviewPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/booking-extras" element={<BookingExtrasPage />} />
            <Route path="/analytics" element={<AnalyticsDashboardPage />} />
            <Route path="/scoring" element={<PropertyScoringPage />} />
            <Route path="/teams" element={<TeamManagementPage />} />
            <Route path="/booking-engine" element={<BookingEnginePage />} />
            <Route path="/owner-portal-config" element={<OwnerPortalConfigPage />} />
            <Route path="/owner-statements" element={<OwnerStatementsPage />} />
            <Route path="/webhooks" element={<WebhooksPage />} />
            <Route path="/onboarding" element={<OnboardingWizardPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}
