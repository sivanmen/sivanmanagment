import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Menu,
  ChevronRight,
  ChevronDown,
  Plus,
  LogOut,
  Globe,
  Moon,
  Sun,
} from 'lucide-react';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import NotificationBell from './NotificationBell';
import LanguageSelector from './LanguageSelector';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/ui.store';

// Breadcrumb mapping
const pathLabels: Record<string, string> = {
  '': 'Dashboard',
  properties: 'Properties',
  bookings: 'Bookings',
  owners: 'Owners',
  finance: 'Finance',
  calendar: 'Calendar',
  guests: 'Guests',
  documents: 'Documents',
  maintenance: 'Maintenance',
  tasks: 'Tasks',
  messages: 'Messages',
  communications: 'Messages',
  reports: 'Reports',
  channels: 'Channels',
  loyalty: 'Loyalty',
  affiliates: 'Affiliates',
  notifications: 'Notifications',
  portfolio: 'Portfolio',
  settings: 'Settings',
  income: 'Income',
  expenses: 'Expenses',
  fees: 'Management Fees',
  new: 'New',
  edit: 'Edit',
  marketing: 'Marketing',
  automations: 'Automations',
  integrations: 'Integrations',
  templates: 'Templates',
  'guest-experience': 'Guest Experience',
  'guest-portal-preview': 'Guest Portal Preview',
  pricing: 'Revenue Management',
  'booking-extras': 'Booking Extras',
  users: 'User Management',
};

function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return <span className="text-sm font-medium text-on-surface">Dashboard</span>;
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <span className="text-on-surface-variant">Dashboard</span>
      {segments.map((segment, i) => {
        const label = pathLabels[segment] || segment;
        const isLast = i === segments.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant/50" />
            <span className={isLast ? 'font-medium text-on-surface' : 'text-on-surface-variant'}>
              {label}
            </span>
          </span>
        );
      })}
    </nav>
  );
}

export default function AppLayout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { locale, setLocale, theme, setTheme } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const openCommandPalette = () => {
    window.dispatchEvent(new Event('open-command-palette'));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass-card ambient-shadow px-4 lg:px-6 py-3 flex items-center gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={() => {
              // Dispatch custom event to open sidebar mobile
              const sidebar = document.querySelector('aside');
              if (sidebar) {
                sidebar.classList.remove('-translate-x-full', 'translate-x-full');
                sidebar.classList.add('translate-x-0');
                // Create overlay
                const overlay = document.createElement('div');
                overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden sidebar-overlay';
                overlay.onclick = () => {
                  const isRtl = locale === 'he';
                  sidebar.classList.remove('translate-x-0');
                  sidebar.classList.add(isRtl ? 'translate-x-full' : '-translate-x-full');
                  overlay.remove();
                };
                document.body.appendChild(overlay);
              }
            }}
            className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high/60 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs */}
          <div className="hidden md:block">
            <Breadcrumbs />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search trigger */}
          <button
            onClick={openCommandPalette}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low/80 backdrop-blur-sm text-sm text-on-surface-variant/60 hover:bg-surface-container-high/60 transition-colors max-w-xs w-full sm:w-auto"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:flex items-center gap-0.5 ms-auto px-1.5 py-0.5 rounded bg-surface-container-high/80 text-[10px] font-mono text-on-surface-variant/50">
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </button>

          {/* Add Property */}
          <button
            onClick={() => navigate('/properties/new')}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-secondary gradient-accent hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </button>

          {/* Language Selector */}
          <LanguageSelector />

          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => {
                setUserDropdownOpen(!userDropdownOpen);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-container-high/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold">
                {user?.firstName?.[0] || 'S'}{user?.lastName?.[0] || 'M'}
              </div>
              <ChevronDown className="w-4 h-4 text-on-surface-variant hidden sm:block" />
            </button>
            {userDropdownOpen && (
              <div className="absolute end-0 top-full mt-2 w-56 glass-card rounded-xl ambient-shadow py-2 z-50">
                <div className="px-4 py-3 border-b border-surface-container-high/50">
                  <p className="text-sm font-headline font-semibold text-on-surface">
                    {user?.firstName || 'Sivan'} {user?.lastName || 'Admin'}
                  </p>
                  <p className="text-xs text-on-surface-variant">{user?.email || 'admin@sivan.com'}</p>
                </div>
                <button
                  onClick={() => {
                    const newLocale = locale === 'en' ? 'he' : 'en';
                    setLocale(newLocale);
                    i18n.changeLanguage(newLocale);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>{locale === 'en' ? 'Switch to Hebrew' : 'Switch to English'}</span>
                </button>
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
                <div className="border-t border-surface-container-high/50 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-container/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Command palette - always rendered, hidden until triggered */}
      <CommandPalette />

      {/* Click outside to close dropdowns */}
      {userDropdownOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setUserDropdownOpen(false);
          }}
        />
      )}
    </div>
  );
}
