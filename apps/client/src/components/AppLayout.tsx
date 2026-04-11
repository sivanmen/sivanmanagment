import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Bell,
  Menu,
  ChevronRight,
  ChevronDown,
  LogOut,
  Globe,
  Moon,
  Sun,
} from 'lucide-react';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/ui.store';

const pathLabels: Record<string, string> = {
  '': 'Dashboard',
  properties: 'My Properties',
  bookings: 'Bookings',
  financials: 'Financial Summary',
  documents: 'Documents',
  maintenance: 'Maintenance',
  loyalty: 'Loyalty',
  messages: 'Messages',
  portfolio: 'Portfolio',
  calendar: 'Calendar',
  settings: 'Settings',
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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass-card ambient-shadow px-4 lg:px-6 py-3 flex items-center gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={() => {
              const sidebar = document.querySelector('aside');
              if (sidebar) {
                sidebar.classList.remove('-translate-x-full', 'translate-x-full');
                sidebar.classList.add('translate-x-0');
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

          <div className="hidden md:block">
            <Breadcrumbs />
          </div>

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

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setUserDropdownOpen(false);
              }}
              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high/60 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-secondary rounded-full pulse-chip" />
            </button>
            {notificationsOpen && (
              <div className="absolute end-0 top-full mt-2 w-72 glass-card rounded-xl ambient-shadow p-4 z-50">
                <p className="text-sm font-headline font-semibold text-on-surface mb-3">Notifications</p>
                <div className="space-y-3">
                  <div className="flex gap-3 p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                    <div className="w-2 h-2 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-on-surface">Your monthly income report is ready</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">5 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                    <div className="w-2 h-2 rounded-full bg-success mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-on-surface">New booking confirmed for your property</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => {
                setUserDropdownOpen(!userDropdownOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-container-high/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold">
                {user?.firstName?.[0] || 'S'}{user?.lastName?.[0] || 'C'}
              </div>
              <ChevronDown className="w-4 h-4 text-on-surface-variant hidden sm:block" />
            </button>
            {userDropdownOpen && (
              <div className="absolute end-0 top-full mt-2 w-56 glass-card rounded-xl ambient-shadow py-2 z-50">
                <div className="px-4 py-3 border-b border-surface-container-high/50">
                  <p className="text-sm font-headline font-semibold text-on-surface">
                    {user?.firstName || 'Sivan'} {user?.lastName || 'Client'}
                  </p>
                  <p className="text-xs text-on-surface-variant">{user?.email || 'client@sivan.com'}</p>
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

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <CommandPalette />

      {(userDropdownOpen || notificationsOpen) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setUserDropdownOpen(false);
            setNotificationsOpen(false);
          }}
        />
      )}
    </div>
  );
}
