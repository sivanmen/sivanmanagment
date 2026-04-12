import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Search,
  Home,
} from 'lucide-react';

const quickLinks = [
  { label: 'Properties', path: '/properties', icon: Building2 },
  { label: 'Bookings', path: '/bookings', icon: CalendarCheck },
  { label: 'Calendar', path: '/calendar', icon: Calendar },
  { label: 'Finance', path: '/finance', icon: DollarSign },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function NotFoundPage() {
  const navigate = useNavigate();

  const openCommandPalette = useCallback(() => {
    window.dispatchEvent(new Event('open-command-palette'));
  }, []);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        {/* Floating gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-[#6b38d4]/5 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-[#6b38d4]/3 blur-3xl animate-[float_12s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full bg-[#6b38d4]/4 blur-2xl animate-[float_10s_ease-in-out_2s_infinite]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#6b38d4 1px, transparent 1px), linear-gradient(90deg, #6b38d4 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl w-full">
        {/* 404 hero */}
        <div className="mb-6">
          <h1
            className="text-[clamp(100px,20vw,200px)] font-heading font-extrabold leading-none select-none gradient-accent bg-clip-text text-transparent"
            aria-label="404"
          >
            404
          </h1>
        </div>

        {/* Heading and subtitle */}
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-on-surface mb-3">
          Page Not Found
        </h2>
        <p className="text-sm sm:text-base text-on-surface-variant mb-8 max-w-md mx-auto leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Search bar */}
        <button
          onClick={openCommandPalette}
          className="glass-card mx-auto mb-10 flex items-center gap-3 w-full max-w-md px-4 py-3 rounded-xl text-on-surface-variant text-sm hover:border-[#6b38d4]/30 transition-colors cursor-text group"
        >
          <Search className="w-4 h-4 shrink-0 text-on-surface-variant group-hover:text-[#6b38d4] transition-colors" />
          <span className="flex-1 text-start">Search for a page...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-surface-variant text-[11px] font-mono text-on-surface-variant">
            Ctrl+K
          </kbd>
        </button>

        {/* Primary actions */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => navigate(-1)}
            className="glass-card flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:border-[#6b38d4]/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white gradient-accent hover:opacity-90 transition-opacity shadow-lg shadow-[#6b38d4]/20"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Quick navigation links */}
        <div className="glass-card rounded-2xl p-6 max-w-lg mx-auto">
          <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-4">
            Quick Navigation
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {quickLinks.map(({ label, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-on-surface hover:bg-surface-variant transition-colors group"
              >
                <Icon className="w-4 h-4 text-on-surface-variant group-hover:text-[#6b38d4] transition-colors" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Keyframe for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-24px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
