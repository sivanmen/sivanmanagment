import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api-client';
import {
  ArrowLeft,
  UserPlus,
  Play,
  CheckCircle,
  XCircle,
  Building2,
  MapPin,
  DollarSign,
  User,
  Clock,
  Wrench,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

type MaintenanceStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED' | 'CANCELLED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface MaintenanceDetail {
  id: string;
  title: string;
  description: string;
  propertyName: string;
  propertyId: string;
  propertyAddress: string;
  category: string;
  priority: Priority;
  status: MaintenanceStatus;
  reportedBy: string;
  reportedByEmail: string;
  assignedTo?: string;
  assignedToPhone?: string;
  scheduledDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  completionNotes?: string;
  createdAt: string;
  images: string[];
  timeline?: { date: string; event: string; type: string }[];
  vendors?: string[];
  property?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
  };
  reportedByUser?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  assignedToUser?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

const statusStyles: Record<MaintenanceStatus, string> = {
  OPEN: 'bg-error/10 text-error',
  ASSIGNED: 'bg-blue-500/10 text-blue-600',
  IN_PROGRESS: 'bg-warning/10 text-warning',
  WAITING_PARTS: 'bg-secondary/10 text-secondary',
  COMPLETED: 'bg-success/10 text-success',
  CANCELLED: 'bg-outline-variant/20 text-on-surface-variant',
};

const priorityStyles: Record<Priority, string> = {
  LOW: 'bg-outline-variant/20 text-on-surface-variant',
  MEDIUM: 'bg-blue-500/10 text-blue-600',
  HIGH: 'bg-warning/10 text-warning',
  URGENT: 'bg-error/10 text-error',
};

export default function MaintenanceDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [completionNotes, setCompletionNotes] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');

  // Fetch maintenance detail from API
  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['maintenance', id],
    queryFn: async () => {
      const res = await apiClient.get(`/maintenance/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  // Normalize API data to the expected shape
  const data: MaintenanceDetail | undefined = rawData
    ? {
        id: rawData.id,
        title: rawData.title,
        description: rawData.description ?? '',
        propertyName: rawData.property?.name ?? rawData.propertyName ?? '',
        propertyId: rawData.propertyId ?? rawData.property?.id ?? '',
        propertyAddress:
          rawData.propertyAddress ??
          (rawData.property ? `${rawData.property.address ?? ''}, ${rawData.property.city ?? ''}` : ''),
        category: rawData.category ?? '',
        priority: rawData.priority ?? 'MEDIUM',
        status: rawData.status ?? 'OPEN',
        reportedBy:
          rawData.reportedBy ??
          (rawData.reportedByUser
            ? `${rawData.reportedByUser.firstName ?? ''} ${rawData.reportedByUser.lastName ?? ''}`.trim()
            : ''),
        reportedByEmail: rawData.reportedByEmail ?? rawData.reportedByUser?.email ?? '',
        assignedTo:
          rawData.assignedTo ??
          (rawData.assignedToUser
            ? `${rawData.assignedToUser.firstName ?? ''} ${rawData.assignedToUser.lastName ?? ''}`.trim()
            : undefined),
        assignedToPhone: rawData.assignedToPhone ?? rawData.assignedToUser?.phone ?? undefined,
        scheduledDate: rawData.scheduledDate ?? undefined,
        estimatedCost: rawData.estimatedCost != null ? Number(rawData.estimatedCost) : undefined,
        actualCost: rawData.actualCost != null ? Number(rawData.actualCost) : undefined,
        completionNotes: rawData.completionNotes ?? rawData.notes ?? '',
        createdAt: rawData.createdAt,
        images: rawData.images ?? [],
        timeline: rawData.timeline ?? [],
        vendors: rawData.vendors ?? [],
      }
    : undefined;

  // Initialize local state from fetched data
  useState(() => {
    if (data) {
      setCompletionNotes(data.completionNotes ?? '');
      setActualCost(data.actualCost?.toString() ?? '');
      setSelectedVendor(data.assignedTo ?? '');
    }
  });

  // Update maintenance request mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const res = await apiClient.put(`/maintenance/${id}`, updates);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', id] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
    onError: () => {
      toast.error('Failed to update request');
    },
  });

  const handleStatusChange = (newStatus: MaintenanceStatus) => {
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'ASSIGNED' && selectedVendor) {
      updates.assignedTo = selectedVendor;
    }
    updateMutation.mutate(updates, {
      onSuccess: () => toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`),
    });
  };

  const handleSaveNotes = () => {
    const updates: Record<string, unknown> = {};
    if (completionNotes) updates.completionNotes = completionNotes;
    if (actualCost) updates.actualCost = parseFloat(actualCost);
    updateMutation.mutate(updates, {
      onSuccess: () => toast.success('Notes saved'),
    });
  };

  const handleAssign = () => {
    if (!selectedVendor) {
      toast.error('Please select a vendor');
      return;
    }
    updateMutation.mutate(
      { status: 'ASSIGNED', assignedTo: selectedVendor },
      { onSuccess: () => toast.success('Vendor assigned') },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 lg:p-6 text-center py-24">
        <p className="text-on-surface-variant">Maintenance request not found.</p>
        <button
          onClick={() => navigate('/maintenance')}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent"
        >
          Back to List
        </button>
      </div>
    );
  }

  const timeline = data.timeline ?? [];
  const vendors = data.vendors ?? ['Nikos Plumbing Co.', 'Cool Air Services', 'Dimitri Repairs', 'Pool Masters GR', 'SparkClean Crete', 'Green Garden Co.'];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/maintenance')}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline text-2xl font-bold text-on-surface">{data.title}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyles[data.status]}`}
              >
                {data.status.replace(/_/g, ' ')}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${priorityStyles[data.priority]}`}
              >
                {data.priority}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mt-0.5">
              {data.propertyName} &middot; {data.category}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {data.status === 'OPEN' && (
            <button
              onClick={handleAssign}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>Assign</span>
            </button>
          )}
          {(data.status === 'ASSIGNED' || data.status === 'WAITING_PARTS') && (
            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>Start Work</span>
            </button>
          )}
          {data.status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleStatusChange('COMPLETED')}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete</span>
            </button>
          )}
          {!['COMPLETED', 'CANCELLED'].includes(data.status) && (
            <button
              onClick={() => handleStatusChange('CANCELLED')}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-error bg-error/5 hover:bg-error/10 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column - 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
              <Wrench className="w-5 h-5 inline-block me-2 text-secondary" />
              Description
            </h3>
            <p className="text-sm text-on-surface leading-relaxed">{data.description}</p>
          </div>

          {/* Images */}
          {data.images.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
                <ImageIcon className="w-5 h-5 inline-block me-2 text-secondary" />
                Attached Images
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="aspect-video rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/20"
                  >
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-on-surface-variant mx-auto mb-1" />
                      <p className="text-[10px] text-on-surface-variant">{typeof img === 'string' ? img : `Image ${idx + 1}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignment */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
              <User className="w-5 h-5 inline-block me-2 text-secondary" />
              Assignment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-surface-container-low">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
                  Reported By
                </p>
                <p className="text-sm font-semibold text-on-surface">{data.reportedBy || '--'}</p>
                <p className="text-xs text-on-surface-variant">{data.reportedByEmail}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
                  {t('maintenance.assignedTo')}
                </p>
                {data.assignedTo ? (
                  <>
                    <p className="text-sm font-semibold text-on-surface">{data.assignedTo}</p>
                    {data.assignedToPhone && (
                      <p className="text-xs text-on-surface-variant">{data.assignedToPhone}</p>
                    )}
                  </>
                ) : (
                  <div className="mt-1">
                    <select
                      value={selectedVendor}
                      onChange={(e) => setSelectedVendor(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all border border-outline-variant/30"
                    >
                      <option value="">Select vendor...</option>
                      {vendors.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Completion Section */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
              <CheckCircle className="w-5 h-5 inline-block me-2 text-secondary" />
              Completion
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">
                  {t('maintenance.actualCost')} (EUR)
                </label>
                <input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all border border-outline-variant/30"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">
                  {t('maintenance.completionNotes')}
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={3}
                  placeholder="Add completion notes..."
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all resize-none border border-outline-variant/30"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
                <Clock className="w-5 h-5 inline-block me-2 text-secondary" />
                Activity Timeline
              </h3>
              <div className="space-y-3">
                {timeline.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-on-surface">{item.event}</p>
                      <p className="text-xs text-on-surface-variant">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Property Card */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
              <Building2 className="w-5 h-5 inline-block me-2 text-secondary" />
              Property
            </h3>
            <p className="font-semibold text-on-surface mb-1">{data.propertyName}</p>
            <div className="flex items-start gap-2 text-sm text-on-surface-variant mb-2">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{data.propertyAddress}</span>
            </div>
            <button
              onClick={() => navigate(`/properties/${data.propertyId}`)}
              className="flex items-center justify-center gap-2 w-full mt-4 px-4 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
            >
              View Property
            </button>
          </div>

          {/* Cost Card */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
              <DollarSign className="w-5 h-5 inline-block me-2 text-secondary" />
              Cost Summary
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">{t('maintenance.estimatedCost')}</span>
                <span className="text-on-surface font-medium">
                  {data.estimatedCost ? `\u20AC${data.estimatedCost.toLocaleString()}` : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">{t('maintenance.actualCost')}</span>
                <span className="text-on-surface font-medium">
                  {data.actualCost ? `\u20AC${data.actualCost.toLocaleString()}` : '-'}
                </span>
              </div>
              {data.estimatedCost && data.actualCost && (
                <div className="border-t border-outline-variant/20 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">Variance</span>
                    <span
                      className={`font-semibold ${
                        data.actualCost <= data.estimatedCost ? 'text-success' : 'text-error'
                      }`}
                    >
                      {data.actualCost <= data.estimatedCost ? '-' : '+'}
                      {'\u20AC'}
                      {Math.abs(data.actualCost - data.estimatedCost).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
              Request Details
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">ID</span>
                <span className="text-on-surface font-medium">{data.id.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Category</span>
                <span className="text-on-surface font-medium">{data.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Created</span>
                <span className="text-on-surface font-medium">
                  {new Date(data.createdAt).toLocaleDateString()}
                </span>
              </div>
              {data.scheduledDate && (
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Scheduled</span>
                  <span className="text-on-surface font-medium">
                    {new Date(data.scheduledDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
