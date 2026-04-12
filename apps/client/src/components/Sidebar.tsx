import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  CalendarCheck,
  Calendar,
  CalendarHeart,
  DollarSign,
  FileText,
  FileBarChart,
  Wrench,
  Mail,
  Heart,
  Settings,
  Share2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Globe,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/ui.store';

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  end?: boolean;
}

interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    key: 'overview',
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard, end: true },
      { key: 'portfolio', label: 'Portfolio', path: '/portfolio', icon: Briefcase },
    ],
  },
  {
    key: 'myProperties',
    label: 'My Properties',
    items: [
      { key: 'properties', label: 'Properties', path: '/properties', icon: Building2 },
      { key: 'bookings', label: 'Bookings', path: '/bookings', icon: CalendarCheck, badge: 2 },
      { key: 'calendar', label: 'Calendar', path: '/calendar', icon: Calendar },
      { key: 'owner-reservations', label: 'My Reservations', path: '/owner-reservations', icon: CalendarHeart },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    items: [
      { key: 'financials', label: 'Financial Summary', path: '/financials', icon: DollarSign },
      { key: 'approvals', label: 'Pending Approvals', path: '/approvals', icon: CalendarCheck, badge: 0 },
      { key: 'statements', label: 'Statements', path: '/statements', icon: FileBarChart },
      { key: 'documents', label: 'Documents', path: '/documents', icon: FileText },
    ],
  },
  {
    key: 'support',
    label: 'Support',
    items: [
      { key: 'maintenance', label: 'Maintenance', path: '/maintenance', icon: Wrench, badge: 1 },
      { key: 'messages', label: 'Messages', path: '/messages', icon: Mail },
    ],
  },
  {
    key: 'account',
    label: 'Account',
    items: [
      { key: 'loyalty', label: 'Loyalty', path: '/loyalty', icon: Heart },
      { key: 'affiliate', label: 'Affiliate', path: '/affiliate', icon: Share2 },
      { key: 'settings', label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

const GROUPS_KEY = 'sivan-client-sidebar-groups';

/** Individual nav item using location match for active indicator */
function SidebarNavItem({
  item,
  collapsed,
  isRtl,
}: {
  item: NavItem;
  collapsed: boolean;
  isRtl: boolean;
}) {
  const Icon = item.icon;
  const location = useLocation();
  const isActive = item.end
    ? location.pathname === item.path
    : location.pathname.startsWith(item.path);
  return (
    <NavLink
      to={item.path}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={
        `group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${isActive
          ? 'bg-white/10 text-white'
          : 'text-white/50 hover:bg-white/5 hover:text-white/80'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
    >
      {/* Active indicator - accent gradient border */}
      {isActive && (
        <div
          className={`absolute top-1 bottom-1 w-[3px] rounded-full gradient-accent ${
            isRtl ? 'end-0' : 'start-0'
          }`}
        />
      )}
      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="truncate">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="ms-auto flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-secondary/80 text-white text-[10px] font-bold flex items-center justify-center">
              {item.badge}
            </span>
          )}
        </>
      )}
      {collapsed && item.badge !== undefined && item.badge > 0 && (
        <span className="absolute top-0.5 end-0.5 w-2 h-2 rounded-full bg-secondary" />
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, locale, setLocale, theme, setTheme } = useUIStore();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(GROUPS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(collapsedGroups));
  }, [collapsedGroups]);

  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isRtl = locale === 'he';
  const userInitials = `${user?.firstName?.[0] || 'S'}${user?.lastName?.[0] || 'C'}`;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <h1 className="font-headline font-bold text-white text-base tracking-wider leading-tight">
              SIVAN
            </h1>
            <div className="h-0.5 w-8 rounded-full bg-gradient-to-r from-secondary to-secondary-container mt-1" />
            <p className="text-[9px] text-white/30 tracking-widest uppercase mt-0.5">Client Portal</p>
          </div>
        )}
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
        {navGroups.map((group) => (
          <div key={group.key} className="mb-1">
            {sidebarOpen && (
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold tracking-[0.15em] text-white/30 uppercase hover:text-white/50 transition-colors"
              >
                <span>{group.label}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    collapsedGroups[group.key] ? (isRtl ? 'rotate-90' : '-rotate-90') : ''
                  }`}
                />
              </button>
            )}

            {(!collapsedGroups[group.key] || !sidebarOpen) && (
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={item.key}
                    item={item}
                    collapsed={!sidebarOpen}
                    isRtl={isRtl}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/5 p-3 space-y-2">
        <div className={`flex items-center gap-3 px-2 py-2 rounded-lg ${!sidebarOpen ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {userInitials}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName || 'Sivan'} {user?.lastName || 'Client'}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-secondary/20 text-secondary-container">
                  Owner
                </span>
              </div>
            </div>
          )}
        </div>

        <div className={`flex items-center ${sidebarOpen ? 'gap-1' : 'flex-col gap-1'}`}>
          <button
            onClick={() => {
              const newLocale = locale === 'en' ? 'he' : 'en';
              setLocale(newLocale);
              i18n.changeLanguage(newLocale);
            }}
            title={locale === 'en' ? 'Hebrew' : 'English'}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Globe className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
          {sidebarOpen && <div className="flex-1" />}
          <button
            onClick={toggleSidebar}
            title={sidebarOpen ? 'Collapse' : 'Expand'}
            className="hidden lg:flex p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            {sidebarOpen ? (
              isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
            ) : (
              isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <aside
      style={{ backgroundColor: '#030303' }}
      className={`
        fixed top-0 z-50 h-full flex flex-col
        transition-all duration-300 ease-in-out
        border-e border-white/[0.04]
        ${isRtl ? 'right-0' : 'left-0'}
        ${sidebarOpen ? 'w-64' : 'w-[68px]'}
        ${isRtl ? 'translate-x-full' : '-translate-x-full'}
        lg:translate-x-0 lg:static
        shadow-2xl lg:shadow-none
      `}
    >
      {sidebarContent}
    </aside>
  );
}
