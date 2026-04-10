import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      {/* Background architectural image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary-container/80" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(135deg, #6b38d4 25%, transparent 25%, transparent 75%, #6b38d4 75%)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-2xl font-headline font-bold text-white">Sivan Management</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-8 ambient-shadow">
          <Outlet />
        </div>

        <div className="text-center mt-6 text-sm text-white/50">
          ENCRYPTED &bull; &copy; {new Date().getFullYear()} SIVAN MANAGEMENT PMS
        </div>
      </div>
    </div>
  );
}
