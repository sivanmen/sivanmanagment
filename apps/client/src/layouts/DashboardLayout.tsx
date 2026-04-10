import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Wrench,
  MessageSquare,
  Heart,
  Briefcase,
  Settings,
  HelpCircle,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Globe,
  Moon,
  Sun,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/ui.store';

const navItems = [
  { key: 'dashboard', path: '/', icon: LayoutDashboard },
  { key: 'properties', path: '/properties', icon: Building2 },
  { key: 'calendar', path: '/calendar', icon: Calendar },
  { key: 'finance', path: '/financials', icon: DollarSign },
  { key: 'documents', path: '/documents', icon: FileText },
  { key: 'maintenance', path: '/maintenance', icon: Wrench },
  { key: 'messages', path: '/messages', icon: MessageSquare },
  { key: 'loyalty', path: '/loyalty', icon: Heart },
  { key: 'portfolio', path: '/portfolio', icon: Briefcase },
];

export default function DashboardLayout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, locale, setLocale, theme, setTheme } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLocaleToggle = () => {
    const newLocale = locale === 'en' ? 'he' : 'en';
    setLocale(newLocale);
    i18n.changeLanguage(newLocale);
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarWidth = sidebarOpen ? 'w-64' : 'w-20';

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          glass-card ambient-shadow border-r-0
          transition-all duration-300 ease-in-out
          ${sidebarWidth}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-surface-container-high/50">
          <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="font-headline font-bold text-on-surface text-sm leading-tight">Sivan</h1>
              <p className="text-[10px] text-on-surface-variant tracking-widest uppercase">Client Portal</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-secondary/10 text-secondary'
                  : 'text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface'
                }
                ${!sidebarOpen ? 'justify-center' : ''}
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{t(`nav.${item.key}`)}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-surface-container-high/50 py-4 px-3 space-y-1">
          <NavLink
            to="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-secondary/10 text-secondary'
                : 'text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface'
              }
              ${!sidebarOpen ? 'justify-center' : ''}
            `}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>{t('nav.settings')}</span>}
          </NavLink>
          <button
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface transition-all duration-200 w-full ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Support</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface transition-all duration-200 w-full justify-center"
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 glass-card ambient-shadow px-4 lg:px-6 py-3 flex items-center gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high/60 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                placeholder={t('common.search') + '...'}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-container-low/80 backdrop-blur-sm text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
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
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full pulse-chip" />
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 glass-card rounded-xl ambient-shadow p-4 z-50">
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
                    <div className="flex gap-3 p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                      <div className="w-2 h-2 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-on-surface">Maintenance approval needed</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">3 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-container-high/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold">
                  {user?.firstName?.[0] || 'S'}{user?.lastName?.[0] || 'M'}
                </div>
                <ChevronDown className="w-4 h-4 text-on-surface-variant hidden sm:block" />
              </button>
              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 glass-card rounded-xl ambient-shadow py-2 z-50">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-surface-container-high/50">
                    <p className="text-sm font-headline font-semibold text-on-surface">
                      {user?.firstName || 'Sivan'} {user?.lastName || 'Client'}
                    </p>
                    <p className="text-xs text-on-surface-variant">{user?.email || 'client@sivan.com'}</p>
                  </div>

                  {/* Language */}
                  <button
                    onClick={handleLocaleToggle}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span>{locale === 'en' ? 'Switch to Hebrew' : 'Switch to English'}</span>
                  </button>

                  {/* Theme */}
                  <button
                    onClick={handleThemeToggle}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                  </button>

                  <div className="border-t border-surface-container-high/50 my-1" />

                  {/* Logout */}
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
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Click outside to close dropdowns */}
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
