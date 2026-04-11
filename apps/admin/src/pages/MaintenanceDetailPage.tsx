import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
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

const demoDetails: Record<string, MaintenanceDetail> = {
  'mnt-001': {
    id: 'mnt-001',
    title: 'Kitchen faucet leaking',
    description:
      'The kitchen faucet has been dripping continuously since yesterday. Water is pooling under the sink and may cause damage to the cabinet. Guest reported hearing dripping sounds at night. Needs urgent attention to prevent water damage.',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    propertyAddress: '12 Coastal Road, Elounda, Crete',
    category: 'PLUMBING',
    priority: 'HIGH',
    status: 'OPEN',
    reportedBy: 'Maria Papadopoulos',
    reportedByEmail: 'maria.p@gmail.com',
    estimatedCost: 180,
    createdAt: '2026-04-10T09:30:00Z',
    images: ['placeholder-1.jpg', 'placeholder-2.jpg'],
  },
  'mnt-002': {
    id: 'mnt-002',
    title: 'AC unit not cooling properly',
    description:
      'Air conditioning unit in the main bedroom is running but not cooling. Temperature stays at 28C despite being set to 22C. Guest has complained multiple times. Filter was cleaned last month so likely a refrigerant issue.',
    propertyName: 'Heraklion Harbor Suite',
    propertyId: 'prop-002',
    propertyAddress: '8 Venetian Port Street, Heraklion, Crete',
    category: 'HVAC',
    priority: 'URGENT',
    status: 'ASSIGNED',
    reportedBy: 'Hans Mueller',
    reportedByEmail: 'h.mueller@outlook.de',
    assignedTo: 'Cool Air Services',
    assignedToPhone: '+30 694 555 1234',
    scheduledDate: '2026-04-12',
    estimatedCost: 350,
    createdAt: '2026-04-09T14:15:00Z',
    images: ['placeholder-3.jpg'],
  },
  'mnt-003': {
    id: 'mnt-003',
    title: 'Broken window latch - bedroom 2',
    description:
      'The latch on the second bedroom window is broken and the window cannot be secured. This is a security concern. The latch mechanism appears to have worn out over time.',
    propertyName: 'Chania Old Town Residence',
    propertyId: 'prop-003',
    propertyAddress: '5 Zambeliou Street, Chania, Crete',
    category: 'STRUCTURAL',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    reportedBy: 'Sophie Laurent',
    reportedByEmail: 'sophie.l@yahoo.fr',
    assignedTo: 'Dimitri Repairs',
    assignedToPhone: '+30 694 555 5678',
    scheduledDate: '2026-04-11',
    estimatedCost: 90,
    actualCost: 75,
    createdAt: '2026-04-08T11:00:00Z',
    images: ['placeholder-4.jpg', 'placeholder-5.jpg', 'placeholder-6.jpg'],
  },
};

const timeline = [
  { date: '2026-04-10 09:30', event: 'Request created', type: 'create' },
  { date: '2026-04-10 10:00', event: 'Priority set to HIGH', type: 'update' },
  { date: '2026-04-10 14:00', event: 'Vendor contacted', type: 'communication' },
  { date: '2026-04-11 09:00', event: 'Scheduled for repair', type: 'status' },
];

const vendors = ['Nikos Plumbing Co.', 'Cool Air Services', 'Dimitri Repairs', 'Pool Masters GR', 'SparkClean Crete', 'Green Garden Co.'];

export default function MaintenanceDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const detail = id ? demoDetails[id] : undefined;
  const data = detail ?? Object.values(demoDetails)[0];

  const [completionNotes, setCompletionNotes] = useState(data.completionNotes ?? '');
  const [actualCost, setActualCost] = useState(data.actualCost?.toString() ?? '');
  const [selectedVendor, setSelectedVendor] = useState(data.assignedTo ?? '');

  const handleAction = (action: string) => {
    toast.success(`${action} action triggered for ${data.id}`);
  };

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
              onClick={() => handleAction('Assign')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Assign</span>
            </button>
          )}
          {(data.status === 'ASSIGNED' || data.status === 'WAITING_PARTS') && (
            <button
              onClick={() => handleAction('Start')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
            >
              <Play className="w-4 h-4" />
              <span>Start Work</span>
            </button>
          )}
          {data.status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleAction('Complete')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete</span>
            </button>
          )}
          {!['COMPLETED', 'CANCELLED'].includes(data.status) && (
            <button
              onClick={() => handleAction('Cancel')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-error bg-error/5 hover:bg-error/10 transition-colors"
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
                    <p className="text-[10px] text-on-surface-variant">{img}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
                <p className="text-sm font-semibold text-on-surface">{data.reportedBy}</p>
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
                  onClick={() => toast.success('Notes saved')}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Timeline */}
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
