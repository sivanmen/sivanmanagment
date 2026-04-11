import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Globe, MapPin, Star, Calendar,
  MessageSquare, Shield, AlertTriangle, Check, Clock, CreditCard,
  Heart, Award,
} from 'lucide-react';
import { toast } from 'sonner';

type Booking = {
  id: string;
  property: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  status: 'completed' | 'confirmed' | 'cancelled';
};

const demoGuest = {
  id: '1',
  firstName: 'Michael',
  lastName: 'Schmidt',
  email: 'michael.schmidt@gmail.com',
  phone: '+49-171-555-1234',
  nationality: 'German',
  language: 'de',
  address: 'Kurfürstendamm 45, Berlin, Germany',
  idType: 'Passport',
  idNumber: 'C4XK9R7P2',
  dateOfBirth: '1985-06-15',
  status: 'verified' as const,
  loyaltyTier: 'Gold',
  loyaltyPoints: 4250,
  totalBookings: 7,
  totalSpent: 12450,
  avgRating: 4.8,
  firstStay: '2024-05-12',
  lastStay: '2026-03-20',
  notes: 'Prefers ground floor. Allergic to cats. Always books extra airport transfer.',
  tags: ['Returning', 'VIP', 'Direct Booker', 'Family'],
  screeningScore: 92,
  communicationPreference: 'WhatsApp',
};

const demoBookings: Booking[] = [
  { id: 'b1', property: 'Villa Athena - Chania', checkIn: '2026-03-15', checkOut: '2026-03-22', nights: 7, total: 2100, status: 'completed' },
  { id: 'b2', property: 'Sunset Suite - Rethymno', checkIn: '2025-08-10', checkOut: '2025-08-20', nights: 10, total: 2800, status: 'completed' },
  { id: 'b3', property: 'Villa Athena - Chania', checkIn: '2025-05-01', checkOut: '2025-05-08', nights: 7, total: 1890, status: 'completed' },
  { id: 'b4', property: 'Blue Horizon Apt', checkIn: '2024-09-15', checkOut: '2024-09-22', nights: 7, total: 1260, status: 'completed' },
  { id: 'b5', property: 'Villa Athena - Chania', checkIn: '2026-07-05', checkOut: '2026-07-15', nights: 10, total: 3200, status: 'confirmed' },
  { id: 'b6', property: 'Olive Garden Villa', checkIn: '2024-06-10', checkOut: '2024-06-14', nights: 4, total: 720, status: 'cancelled' },
];

const statusColors: Record<string, string> = {
  completed: 'bg-blue-500/10 text-blue-400',
  confirmed: 'bg-emerald-500/10 text-emerald-400',
  cancelled: 'bg-red-500/10 text-red-400',
  verified: 'bg-emerald-500/10 text-emerald-400',
  unverified: 'bg-amber-500/10 text-amber-400',
  flagged: 'bg-red-500/10 text-red-400',
};

const tierColors: Record<string, string> = {
  Bronze: 'text-amber-600',
  Silver: 'text-gray-300',
  Gold: 'text-yellow-400',
  Platinum: 'text-gray-200',
  Diamond: 'text-cyan-300',
};

export default function GuestDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'bookings' | 'communications' | 'documents'>('bookings');
  const guest = demoGuest;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-headline text-2xl font-bold text-on-surface">
              {guest.firstName} {guest.lastName}
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${statusColors[guest.status]}`}>
              {guest.status}
            </span>
            {guest.loyaltyTier && (
              <span className={`flex items-center gap-1 text-xs font-semibold ${tierColors[guest.loyaltyTier]}`}>
                <Award className="w-3.5 h-3.5" />
                {guest.loyaltyTier} Star
              </span>
            )}
          </div>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Guest since {new Date(guest.firstStay).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info('Message composer opening...')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Message
          </button>
          <button
            onClick={() => navigate(`/bookings/new?guestId=${id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:opacity-90 transition-opacity"
          >
            <Calendar className="w-4 h-4" />
            New Booking
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Info */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-3">
            <h3 className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Contact</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-on-surface-variant" />
                <a href={`mailto:${guest.email}`} className="text-sm text-secondary hover:underline">{guest.email}</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-on-surface-variant" />
                <span className="text-sm text-on-surface">{guest.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-on-surface-variant" />
                <span className="text-sm text-on-surface">{guest.nationality} · {guest.language.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-on-surface-variant" />
                <span className="text-sm text-on-surface">{guest.address}</span>
              </div>
            </div>
          </div>

          {/* Identity */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-3">
            <h3 className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Identity</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-on-surface-variant">ID Type</span>
                <span className="text-xs text-on-surface font-medium">{guest.idType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-on-surface-variant">ID Number</span>
                <span className="text-xs text-on-surface font-mono">{guest.idNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-on-surface-variant">Date of Birth</span>
                <span className="text-xs text-on-surface">{guest.dateOfBirth}</span>
              </div>
            </div>
          </div>

          {/* Screening */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Screening Score</h3>
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#1a1a1a" strokeWidth="4" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#10b981" strokeWidth="4"
                    strokeDasharray={`${(guest.screeningScore / 100) * 176} 176`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-on-surface">
                  {guest.screeningScore}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-400">Low Risk</p>
                <p className="text-xs text-on-surface-variant">All checks passed</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-3">
            <h3 className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {guest.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-3">
            <h3 className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Notes</h3>
            <p className="text-sm text-on-surface leading-relaxed">{guest.notes}</p>
          </div>
        </div>

        {/* Right Column — Stats & Bookings */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Bookings', value: guest.totalBookings.toString(), icon: Calendar },
              { label: 'Total Spent', value: `€${guest.totalSpent.toLocaleString()}`, icon: CreditCard },
              { label: 'Avg Rating', value: guest.avgRating.toString(), icon: Star },
              { label: 'Loyalty Points', value: guest.loyaltyPoints.toLocaleString(), icon: Heart },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4 text-secondary" />
                  </div>
                  <p className="text-xl font-headline font-bold text-on-surface">{kpi.value}</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{kpi.label}</p>
                </div>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-lg bg-surface-container-low w-fit">
            {(['bookings', 'communications', 'documents'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline/5">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Property</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Dates</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Nights</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {demoBookings.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => navigate(`/bookings/${b.id}`)}
                      className="border-b border-outline/5 hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-on-surface">{b.property}</td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">{b.checkIn} → {b.checkOut}</td>
                      <td className="px-4 py-3 text-sm text-on-surface text-right">{b.nights}</td>
                      <td className="px-4 py-3 text-sm font-medium text-on-surface text-right">€{b.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${statusColors[b.status]}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Communications Tab */}
          {activeTab === 'communications' && (
            <div className="space-y-3">
              {[
                { date: '2026-03-22', type: 'WhatsApp', subject: 'Thank you for staying!', status: 'delivered' },
                { date: '2026-03-15', type: 'Email', subject: 'Check-in instructions & access codes', status: 'read' },
                { date: '2026-03-13', type: 'Email', subject: 'Booking confirmation #B-2026-089', status: 'read' },
                { date: '2025-08-21', type: 'Email', subject: 'Review request - Sunset Suite', status: 'read' },
                { date: '2025-08-10', type: 'WhatsApp', subject: 'Welcome! Here are your check-in details', status: 'delivered' },
              ].map((msg, i) => (
                <div key={i} className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow flex items-center justify-between hover:border-secondary/20 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${msg.type === 'WhatsApp' ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`}>
                      <MessageSquare className={`w-4 h-4 ${msg.type === 'WhatsApp' ? 'text-emerald-400' : 'text-blue-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{msg.subject}</p>
                      <p className="text-xs text-on-surface-variant">{msg.type} · {msg.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {msg.status === 'read' ? (
                      <><Check className="w-3 h-3 text-blue-400" /><Check className="w-3 h-3 text-blue-400 -ml-2" /></>
                    ) : (
                      <Check className="w-3 h-3 text-on-surface-variant" />
                    )}
                    <span className="text-[10px] text-on-surface-variant capitalize">{msg.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-3">
              {[
                { name: 'Passport Scan', type: 'ID', date: '2024-05-10', size: '2.4 MB' },
                { name: 'Rental Agreement #B-2026-089', type: 'Contract', date: '2026-03-13', size: '450 KB' },
                { name: 'Rental Agreement #B-2025-156', type: 'Contract', date: '2025-08-08', size: '445 KB' },
              ].map((doc, i) => (
                <div key={i} className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow flex items-center justify-between hover:border-secondary/20 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-secondary">PDF</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{doc.name}</p>
                      <p className="text-xs text-on-surface-variant">{doc.type} · {doc.size}</p>
                    </div>
                  </div>
                  <span className="text-xs text-on-surface-variant">{doc.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
