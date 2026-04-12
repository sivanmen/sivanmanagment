import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Mail, Phone, Globe, MapPin, Star, Calendar,
  MessageSquare, Shield, AlertTriangle, Check, Clock, CreditCard,
  Heart, Award, Loader2, Trash2, Pencil, Save, X,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

interface GuestBooking {
  id: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
}

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  passportNumber: string | null;
  dateOfBirth: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  preferredLanguage: string | null;
  tags: string[] | null;
  notes: string | null;
  isVip: boolean;
  rating: number | null;
  bookingsCount: number;
  totalSpent: number | string;
  lastStayAt: string | null;
  bookings: GuestBooking[];
}

const statusColors: Record<string, string> = {
  completed: 'bg-blue-500/10 text-blue-400',
  confirmed: 'bg-emerald-500/10 text-emerald-400',
  cancelled: 'bg-red-500/10 text-red-400',
  COMPLETED: 'bg-blue-500/10 text-blue-400',
  CONFIRMED: 'bg-emerald-500/10 text-emerald-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
  PENDING: 'bg-amber-500/10 text-amber-400',
  pending: 'bg-amber-500/10 text-amber-400',
};

function nightsBetween(checkIn: string, checkOut: string): number {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export default function GuestDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'bookings' | 'communications' | 'documents'>('bookings');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Guest>>({});

  // ── Fetch guest ──────────────────────────────────────────
  const { data: guest, isLoading, error } = useQuery<Guest>({
    queryKey: ['guest', id],
    queryFn: async () => {
      const res = await apiClient.get(`/guests/${id}`);
      return res.data.data ?? res.data;
    },
    enabled: !!id,
  });

  // ── Update guest mutation ────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<Guest>) => {
      const res = await apiClient.put(`/guests/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest', id] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast.success('Guest updated successfully');
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update guest');
    },
  });

  // ── Delete guest mutation ────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/guests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast.success('Guest deleted');
      navigate('/guests');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete guest');
    },
  });

  // ── Loading state ────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  // ── Error / Not found state ──────────────────────────────
  if (error || !guest) {
    return (
      <div className="p-6 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <p className="text-on-surface-variant">Guest not found</p>
        <button
          onClick={() => navigate('/guests')}
          className="text-secondary font-medium text-sm"
        >
          Back to guests
        </button>
      </div>
    );
  }

  const bookings = guest.bookings ?? [];
  const totalSpent = typeof guest.totalSpent === 'string' ? parseFloat(guest.totalSpent) : (guest.totalSpent ?? 0);
  const tags = guest.tags ?? [];

  function startEditing() {
    setEditForm({
      firstName: guest!.firstName,
      lastName: guest!.lastName,
      email: guest!.email,
      phone: guest!.phone,
      nationality: guest!.nationality,
      notes: guest!.notes,
      tags: guest!.tags,
      isVip: guest!.isVip,
    });
    setIsEditing(true);
  }

  function saveEdit() {
    updateMutation.mutate(editForm);
  }

  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this guest? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  }

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
            {guest.isVip && (
              <span className="flex items-center gap-1 text-xs font-semibold text-yellow-400">
                <Award className="w-3.5 h-3.5" />
                VIP
              </span>
            )}
          </div>
          {guest.lastStayAt && (
            <p className="text-sm text-on-surface-variant mt-0.5">
              Last stay {new Date(guest.lastStayAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={startEditing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
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
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Info */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-3">
            <h3 className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Contact</h3>
            <div className="space-y-2.5">
              {guest.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-on-surface-variant" />
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="text-sm bg-surface-container rounded px-2 py-1 text-on-surface w-full"
                    />
                  ) : (
                    <a href={`mailto:${guest.email}`} className="text-sm text-secondary hover:underline">{guest.email}</a>
                  )}
                </div>
              )}
              {guest.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-on-surface-variant" />
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.phone ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="text-sm bg-surface-container rounded px-2 py-1 text-on-surface w-full"
                    />
                  ) : (
                    <span className="text-sm text-on-surface">{guest.phone}</span>
                  )}
                </div>
              )}
              {(guest.nationality || guest.preferredLanguage) && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-on-surface-variant" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.nationality ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                      className="text-sm bg-surface-container rounded px-2 py-1 text-on-surface w-full"
                      placeholder="Nationality"
                    />
                  ) : (
                    <span className="text-sm text-on-surface">
                      {[guest.nationality, guest.preferredLanguage?.toUpperCase()].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>
              )}
              {(guest.address || guest.city || guest.country) && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-on-surface-variant" />
                  <span className="text-sm text-on-surface">
                    {[guest.address, guest.city, guest.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Identity */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-3">
            <h3 className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Identity</h3>
            <div className="space-y-2">
              {guest.passportNumber && (
                <div className="flex justify-between">
                  <span className="text-xs text-on-surface-variant">Passport</span>
                  <span className="text-xs text-on-surface font-mono">{guest.passportNumber}</span>
                </div>
              )}
              {guest.dateOfBirth && (
                <div className="flex justify-between">
                  <span className="text-xs text-on-surface-variant">Date of Birth</span>
                  <span className="text-xs text-on-surface">
                    {new Date(guest.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-3">
              <h3 className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-3">
            <h3 className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Notes</h3>
            {isEditing ? (
              <textarea
                value={editForm.notes ?? ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={4}
                className="text-sm bg-surface-container rounded px-2 py-1 text-on-surface w-full resize-none"
              />
            ) : (
              <p className="text-sm text-on-surface leading-relaxed">
                {guest.notes || <span className="text-on-surface-variant italic">No notes</span>}
              </p>
            )}
          </div>
        </div>

        {/* Right Column — Stats & Bookings */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Bookings', value: (guest.bookingsCount ?? bookings.length).toString(), icon: Calendar },
              { label: 'Total Spent', value: `€${totalSpent.toLocaleString()}`, icon: CreditCard },
              { label: 'Rating', value: guest.rating?.toString() ?? '—', icon: Star },
              { label: 'VIP Status', value: guest.isVip ? 'VIP' : 'Standard', icon: Heart },
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
              {bookings.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant text-sm">
                  No bookings found for this guest.
                </div>
              ) : (
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
                    {bookings.map((b) => {
                      const nights = nightsBetween(b.checkIn, b.checkOut);
                      const price = typeof b.totalPrice === 'string' ? parseFloat(b.totalPrice) : (b.totalPrice ?? 0);
                      return (
                        <tr
                          key={b.id}
                          onClick={() => navigate(`/bookings/${b.id}`)}
                          className="border-b border-outline/5 hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-on-surface">{b.propertyName}</td>
                          <td className="px-4 py-3 text-sm text-on-surface-variant">
                            {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-on-surface text-right">{nights}</td>
                          <td className="px-4 py-3 text-sm font-medium text-on-surface text-right">€{price.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${statusColors[b.status] ?? 'bg-outline-variant/20 text-on-surface-variant'}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Communications Tab */}
          {activeTab === 'communications' && (
            <div className="p-8 text-center text-on-surface-variant text-sm rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Communication history will be loaded from the messaging module.
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="p-8 text-center text-on-surface-variant text-sm rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Guest documents will be loaded from the documents module.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
