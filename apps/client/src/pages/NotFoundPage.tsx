import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  ArrowLeft,
  Building2,
  CalendarCheck,
  DollarSign,
  FileText,
  Mail,
  Compass,
} from 'lucide-react';

const quickLinks = [
  { label: 'My Properties', path: '/properties', icon: Building2 },
  { label: 'Bookings', path: '/bookings', icon: CalendarCheck },
  { label: 'Financial Summary', path: '/financials', icon: DollarSign },
  { label: 'Documents', path: '/documents', icon: FileText },
  { label: 'Messages', path: '/messages', icon: Mail },
];

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#6b38d4]/5 blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-[#6b38d4]/3 blur-3xl animate-pulse"
          style={{ animationDelay: '1.5s', animationDuration: '4s' }}
        />
        <div
          className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-[#6b38d4]/4 blur-3xl animate-pulse"
          style={{ animationDelay: '3s', animationDuration: '5s' }}
        />

        {/* Floating geometric shapes */}
        <div
          className="absolute top-[15%] right-[20%] w-3 h-3 rounded-full bg-[#6b38d4]/20"
          style={{
            animation: 'float 6s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-[60%] left-[15%] w-2 h-2 rounded-full bg-[#6b38d4]/15"
          style={{
            animation: 'float 8s ease-in-out infinite',
            animationDelay: '2s',
          }}
        />
        <div
          className="absolute bottom-[25%] right-[30%] w-4 h-4 rounded-sm bg-[#6b38d4]/10 rotate-45"
          style={{
            animation: 'float 7s ease-in-out infinite',
            animationDelay: '1s',
          }}
        />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>

      <div className="relative z-10 text-center max-w-lg w-full">
        {/* 404 display */}
        <div className="relative mb-6 select-none">
          <h1
            className="text-[160px] sm:text-[200px] font-heading font-black leading-none tracking-tighter gradient-accent bg-clip-text text-transparent"
          >
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <Compass
              className="w-12 h-12 text-[#6b38d4]/30"
              style={{
                animation: 'spin 12s linear infinite',
              }}
            />
          </div>
        </div>

        {/* Copy */}
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-on-surface mb-3">
          Page Not Found
        </h2>
        <p className="text-on-surface-variant text-base mb-10 max-w-sm mx-auto leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-on-surface glass-card hover:bg-surface-variant transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white gradient-accent hover:opacity-90 transition-all duration-200 shadow-lg shadow-[#6b38d4]/25"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Quick navigation links */}
        <div className="glass-card rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-4">
            Quick Navigation
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-variant transition-all duration-200 group"
              >
                <link.icon className="w-4 h-4 text-on-surface-variant group-hover:text-[#6b38d4] transition-colors duration-200" />
                <span className="truncate">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
