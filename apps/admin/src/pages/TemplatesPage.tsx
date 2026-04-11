import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  MessageSquare,
  Smartphone,
  Plus,
  Copy,
  Trash2,
  Edit3,
  Eye,
  X,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────
type Channel = 'EMAIL' | 'WHATSAPP' | 'SMS';
type Category = 'BOOKING' | 'PAYMENT' | 'MAINTENANCE' | 'MARKETING' | 'SYSTEM';

interface MessageTemplate {
  id: string;
  name: string;
  slug: string;
  channel: Channel;
  subject?: string;
  body: string;
  variables: string[];
  category: Category;
  language: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Sample Data For Preview ──────────────────────────────────────
const sampleData: Record<string, string> = {
  property_name: 'Aegean Sunset Villa',
  guest_name: 'Sarah Mueller',
  check_in_date: '2026-05-15',
  check_out_date: '2026-05-22',
  check_in_time: '15:00',
  check_out_time: '11:00',
  total_amount: '1,960',
  amount: '1,960',
  owner_name: 'David Cohen',
  net_amount: '4,200',
  wifi_name: 'AegeanVilla_5G',
  wifi_password: 'sunset2026!',
  title: 'Leaking kitchen faucet',
  booking_id: 'BK-20260415',
};

// ── Seed Templates ───────────────────────────────────────────────
const seedTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Booking Confirmed',
    slug: 'booking_confirmed',
    channel: 'EMAIL',
    subject: 'Your booking at {{property_name}} is confirmed!',
    body: 'Dear {{guest_name}},\n\nYour booking at {{property_name}} is confirmed!\n\nCheck-in: {{check_in_date}}\nCheck-out: {{check_out_date}}\nTotal: \u20AC{{total_amount}}\n\nWe look forward to welcoming you!\n\nBest regards,\nSivan Management',
    variables: ['guest_name', 'property_name', 'check_in_date', 'check_out_date', 'total_amount'],
    category: 'BOOKING',
    language: 'en',
    isActive: true,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: '2',
    name: 'Booking Cancelled',
    slug: 'booking_cancelled',
    channel: 'EMAIL',
    subject: 'Booking at {{property_name}} has been cancelled',
    body: 'Dear {{guest_name}},\n\nWe are sorry to inform you that your booking at {{property_name}} ({{check_in_date}} - {{check_out_date}}) has been cancelled.\n\nIf you have any questions about the refund, please contact us.\n\nBest regards,\nSivan Management',
    variables: ['guest_name', 'property_name', 'check_in_date', 'check_out_date'],
    category: 'BOOKING',
    language: 'en',
    isActive: true,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: '3',
    name: 'Check-in Reminder',
    slug: 'check_in_reminder',
    channel: 'WHATSAPP',
    body: 'Hi {{guest_name}}! Your stay at {{property_name}} starts tomorrow. Check-in: {{check_in_time}}. WiFi: {{wifi_name}}/{{wifi_password}}. We are excited to host you!',
    variables: ['guest_name', 'property_name', 'check_in_time', 'wifi_name', 'wifi_password'],
    category: 'BOOKING',
    language: 'en',
    isActive: true,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: '4',
    name: 'Check-out Reminder',
    slug: 'check_out_reminder',
    channel: 'WHATSAPP',
    body: 'Hi {{guest_name}}, checkout is today by {{check_out_time}}. Thank you for staying at {{property_name}}! We hope you had a wonderful time.',
    variables: ['guest_name', 'check_out_time', 'property_name'],
    category: 'BOOKING',
    language: 'en',
    isActive: true,
    createdAt: new Date('2026-01-16'),
    updatedAt: new Date('2026-01-16'),
  },
  {
    id: '5',
    name: 'Welcome Back Guest',
    slug: 'welcome_back',
    channel: 'WHATSAPP',
    body: 'Welcome back, {{guest_name}}! As a returning guest at {{property_name}}, enjoy a special rate on your next stay. Contact us for exclusive offers!',
    variables: ['guest_name', 'property_name'],
    category: 'MARKETING',
    language: 'en',
    isActive: true,
    createdAt: new Date('2026-01-17'),
    updatedAt: new Date('2026-01-17'),
  },
  {
    id: '6',
    name: 'Payment Received',
    slug: 'payment_received',
    channel: 'EMAIL',
    subject: 'Payment received for {{property_name}}',
    body: 'Dear {{guest_name}},\n\nWe have received your payment of \u20AC{{amount}} for your booking at {{property_name}}.\n\nBooking reference: {{booking_id}}\n\nThank you!\nSivan Management',
    variables: ['guest_name', 'amount', 'property_name', 'booking_id'],
    category: 'PAYMENT',
    language: 'en',
    isActive: true,
    createdAt: new Date('2026-01-18'),
    updatedAt: new Date('2026-01-18'),
  },
  {
    id: '7',
    name: 'Owner Payout Notification',
    slug: 'owner_payout',
    channel: 'EMAIL',
    subject: 'Monthly payout processed - {{property_name}}',
    body: 'Dear {{owner_name}},\n\nYour monthly payout of \u20AC{{net_amount}} for {{property_name}} has been processed and should arrive in your account within 2-3 business days.\n\nBest regards,\nSivan Management',
    variables: ['owner_name', 'net_amount', 'property_name'],
    category: 'PAYMENT',
    language: 'en',
    isActive: true,
    createdAt: new Date('2026-01-19'),
    updatedAt: new Date('2026-01-19'),
  },
  {
    id: '8',
    name: 'Maintenance Reported',
    slug: 'maintenance_reported',
    channel: 'EMAIL',
    subject: 'New maintenance request: {{title}}',
    body: 'A new maintenance request has been submitted:\n\nTitle: {{title}}\nProperty: {{property_name}}\n\nPlease review and assign this request.',
    variables: ['title', 'property_name'],
    category: 'MAINTENANCE',
    language: 'en',
    isActive: true,
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-01-20'),
  },
  {
    id: '9',
    name: 'Maintenance Completed',
    slug: 'maintenance_completed',
    channel: 'WHATSAPP',
    body: 'Maintenance for "{{title}}" at {{property_name}} has been completed. If you have further issues, please let us know.',
    variables: ['title', 'property_name'],
    category: 'MAINTENANCE',
    language: 'en',
    isActive: true,
    createdAt: new Date('2026-01-21'),
    updatedAt: new Date('2026-01-21'),
  },
  {
    id: '10',
    name: 'Welcome Owner',
    slug: 'welcome_owner',
    channel: 'EMAIL',
    subject: 'Welcome to Sivan Management, {{owner_name}}!',
    body: 'Dear {{owner_name}},\n\nWelcome to Sivan Management! Your owner portal is now ready.\n\nYou can log in at any time to view your properties, financial reports, and booking calendar.\n\nWe are excited to manage your properties and maximize your returns.\n\nBest regards,\nThe Sivan Team',
    variables: ['owner_name'],
    category: 'SYSTEM',
    language: 'en',
    isActive: true,
    createdAt: new Date('2026-01-22'),
    updatedAt: new Date('2026-01-22'),
  },
];

// ── Styles ───────────────────────────────────────────────────────
const channelBadge: Record<Channel, string> = {
  EMAIL: 'bg-blue-500/10 text-blue-600',
  WHATSAPP: 'bg-green-500/10 text-green-600',
  SMS: 'bg-amber-500/10 text-amber-600',
};

const channelIcon: Record<Channel, React.ComponentType<{ className?: string }>> = {
  EMAIL: Mail,
  WHATSAPP: MessageSquare,
  SMS: Smartphone,
};

const categoryBadge: Record<Category, string> = {
  BOOKING: 'bg-secondary/10 text-secondary',
  PAYMENT: 'bg-success/10 text-success',
  MAINTENANCE: 'bg-warning/10 text-warning',
  MARKETING: 'bg-blue-500/10 text-blue-600',
  SYSTEM: 'bg-outline-variant/20 text-on-surface-variant',
};

const inputClasses =
  'w-full px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';
const labelClasses =
  'block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5';

function replaceVariables(text: string, data: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || `{{${key}}}`);
}

// ── Main Component ───────────────────────────────────────────────
export default function TemplatesPage() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<MessageTemplate[]>(seedTemplates);
  const [channelFilter, setChannelFilter] = useState<Channel | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'ALL'>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  // Editor state
  const [editorName, setEditorName] = useState('');
  const [editorChannel, setEditorChannel] = useState<Channel>('EMAIL');
  const [editorCategory, setEditorCategory] = useState<Category>('BOOKING');
  const [editorLanguage, setEditorLanguage] = useState('en');
  const [editorSubject, setEditorSubject] = useState('');
  const [editorBody, setEditorBody] = useState('');
  const [editorVariables, setEditorVariables] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const filtered = useMemo(() => {
    return templates.filter((tpl) => {
      if (channelFilter !== 'ALL' && tpl.channel !== channelFilter) return false;
      if (categoryFilter !== 'ALL' && tpl.category !== categoryFilter) return false;
      return true;
    });
  }, [templates, channelFilter, categoryFilter]);

  const allVariables = [
    'guest_name',
    'property_name',
    'check_in_date',
    'check_out_date',
    'check_in_time',
    'check_out_time',
    'total_amount',
    'amount',
    'owner_name',
    'net_amount',
    'wifi_name',
    'wifi_password',
    'title',
    'booking_id',
  ];

  const openEditor = (tpl?: MessageTemplate) => {
    if (tpl) {
      setEditingId(tpl.id);
      setEditorName(tpl.name);
      setEditorChannel(tpl.channel);
      setEditorCategory(tpl.category);
      setEditorLanguage(tpl.language);
      setEditorSubject(tpl.subject || '');
      setEditorBody(tpl.body);
      setEditorVariables(tpl.variables);
      setIsCreating(false);
    } else {
      setEditingId(null);
      setEditorName('');
      setEditorChannel('EMAIL');
      setEditorCategory('BOOKING');
      setEditorLanguage('en');
      setEditorSubject('');
      setEditorBody('');
      setEditorVariables([]);
      setIsCreating(true);
    }
  };

  const closeEditor = () => {
    setEditingId(null);
    setIsCreating(false);
  };

  const saveTemplate = () => {
    if (!editorName.trim() || !editorBody.trim()) {
      toast.error('Name and body are required');
      return;
    }

    // Extract variables from body
    const foundVars: string[] = [];
    const regex = /\{\{(\w+)\}\}/g;
    let match;
    const bodyAndSubject = editorBody + (editorSubject || '');
    while ((match = regex.exec(bodyAndSubject)) !== null) {
      if (!foundVars.includes(match[1])) foundVars.push(match[1]);
    }

    if (isCreating) {
      const newTpl: MessageTemplate = {
        id: String(Date.now()),
        name: editorName,
        slug: editorName.toLowerCase().replace(/\s+/g, '_'),
        channel: editorChannel,
        subject: editorChannel === 'EMAIL' ? editorSubject : undefined,
        body: editorBody,
        variables: foundVars,
        category: editorCategory,
        language: editorLanguage,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setTemplates((prev) => [...prev, newTpl]);
      toast.success(t('templates.created'));
    } else if (editingId) {
      setTemplates((prev) =>
        prev.map((tpl) =>
          tpl.id === editingId
            ? {
                ...tpl,
                name: editorName,
                channel: editorChannel,
                category: editorCategory,
                language: editorLanguage,
                subject: editorChannel === 'EMAIL' ? editorSubject : undefined,
                body: editorBody,
                variables: foundVars,
                updatedAt: new Date(),
              }
            : tpl,
        ),
      );
      toast.success(t('templates.updated'));
    }
    closeEditor();
  };

  const duplicateTemplate = (tpl: MessageTemplate) => {
    const newTpl: MessageTemplate = {
      ...tpl,
      id: String(Date.now()),
      name: `${tpl.name} (Copy)`,
      slug: `${tpl.slug}_copy_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTemplates((prev) => [...prev, newTpl]);
    toast.success(t('templates.duplicated'));
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
    toast.success(t('templates.deleted'));
  };

  const toggleActive = (id: string) => {
    setTemplates((prev) =>
      prev.map((tpl) => (tpl.id === id ? { ...tpl, isActive: !tpl.isActive } : tpl)),
    );
  };

  const insertVariable = (varName: string) => {
    setEditorBody((prev) => prev + `{{${varName}}}`);
  };

  const isEditorOpen = editingId !== null || isCreating;
  const previewTemplate = showPreview ? templates.find((t) => t.id === showPreview) : null;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('nav.settings')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('templates.title')}
          </h1>
        </div>
        <button
          onClick={() => openEditor()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('templates.create')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Channel tabs */}
        <div className="flex gap-1">
          {(['ALL', 'EMAIL', 'WHATSAPP', 'SMS'] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                channelFilter === ch
                  ? 'bg-secondary/10 text-secondary'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {ch === 'ALL' ? t('templates.all') : ch}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as Category | 'ALL')}
          className="px-4 py-2 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        >
          <option value="ALL">{t('templates.allCategories')}</option>
          <option value="BOOKING">{t('templates.catBooking')}</option>
          <option value="PAYMENT">{t('templates.catPayment')}</option>
          <option value="MAINTENANCE">{t('templates.catMaintenance')}</option>
          <option value="MARKETING">{t('templates.catMarketing')}</option>
          <option value="SYSTEM">{t('templates.catSystem')}</option>
        </select>

        <span className="text-xs text-on-surface-variant ms-auto">
          {filtered.length} {t('templates.templatesCount')}
        </span>
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((tpl) => {
          const ChIcon = channelIcon[tpl.channel];
          return (
            <div
              key={tpl.id}
              className={`bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden transition-all ${
                !tpl.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="p-5 space-y-3">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-headline text-base font-semibold text-on-surface truncate">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">{tpl.slug}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${channelBadge[tpl.channel]}`}
                    >
                      <ChIcon className="w-3 h-3" />
                      {tpl.channel}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${categoryBadge[tpl.category]}`}
                    >
                      {tpl.category}
                    </span>
                  </div>
                </div>

                {/* Subject for email */}
                {tpl.subject && (
                  <p className="text-xs font-medium text-on-surface-variant">
                    Subject: {tpl.subject}
                  </p>
                )}

                {/* Body preview */}
                <p className="text-sm text-on-surface-variant line-clamp-2">{tpl.body}</p>

                {/* Variable tags */}
                {tpl.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tpl.variables.map((v) => (
                      <span
                        key={v}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-low text-[10px] font-mono text-on-surface-variant"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {v}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(tpl.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                        tpl.isActive
                          ? 'bg-success/10 text-success'
                          : 'bg-outline-variant/10 text-on-surface-variant'
                      }`}
                    >
                      {tpl.isActive ? t('templates.active') : t('templates.inactive')}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowPreview(tpl.id)}
                      className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-secondary transition-colors"
                      title={t('templates.preview')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditor(tpl)}
                      className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-secondary transition-colors"
                      title={t('common.edit')}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => duplicateTemplate(tpl)}
                      className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-secondary transition-colors"
                      title={t('templates.duplicate')}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTemplate(tpl.id)}
                      className="p-2 rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-12 text-center">
          <Mail className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
          <p className="text-lg font-semibold text-on-surface">{t('templates.emptyTitle')}</p>
          <p className="text-sm text-on-surface-variant mt-1">{t('templates.emptyDesc')}</p>
        </div>
      )}

      {/* ══════════════ EDITOR MODAL ══════════════ */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl ambient-shadow w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-headline text-lg font-bold text-on-surface">
                {isCreating ? t('templates.createTemplate') : t('templates.editTemplate')}
              </h2>
              <button
                onClick={closeEditor}
                className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Top fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClasses}>{t('templates.templateName')}</label>
                  <input
                    type="text"
                    value={editorName}
                    onChange={(e) => setEditorName(e.target.value)}
                    placeholder="e.g. Booking Confirmation"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>{t('templates.channel')}</label>
                  <select
                    value={editorChannel}
                    onChange={(e) => setEditorChannel(e.target.value as Channel)}
                    className={inputClasses}
                  >
                    <option value="EMAIL">Email</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>{t('templates.category')}</label>
                  <select
                    value={editorCategory}
                    onChange={(e) => setEditorCategory(e.target.value as Category)}
                    className={inputClasses}
                  >
                    <option value="BOOKING">Booking</option>
                    <option value="PAYMENT">Payment</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="SYSTEM">System</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>{t('templates.language')}</label>
                  <select
                    value={editorLanguage}
                    onChange={(e) => setEditorLanguage(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="en">English</option>
                    <option value="he">Hebrew</option>
                    <option value="el">Greek</option>
                    <option value="de">German</option>
                    <option value="fr">French</option>
                    <option value="ru">Russian</option>
                  </select>
                </div>
                {editorChannel === 'EMAIL' && (
                  <div>
                    <label className={labelClasses}>{t('templates.subject')}</label>
                    <input
                      type="text"
                      value={editorSubject}
                      onChange={(e) => setEditorSubject(e.target.value)}
                      placeholder="Email subject line..."
                      className={inputClasses}
                    />
                  </div>
                )}
              </div>

              {/* Body editor + variables */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-2">
                  <label className={labelClasses}>{t('templates.body')}</label>
                  <textarea
                    value={editorBody}
                    onChange={(e) => setEditorBody(e.target.value)}
                    rows={10}
                    placeholder="Type your template message here..."
                    className={inputClasses + ' resize-none font-mono text-xs'}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClasses}>{t('templates.availableVariables')}</label>
                  <div className="bg-surface-container-low rounded-lg p-3 space-y-1.5 max-h-[250px] overflow-y-auto">
                    {allVariables.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v)}
                        className="w-full text-start px-3 py-2 rounded-lg text-xs font-mono text-on-surface-variant hover:bg-surface-container-high hover:text-secondary transition-colors flex items-center gap-2"
                      >
                        <Tag className="w-3 h-3 flex-shrink-0" />
                        <span>{`{{${v}}}`}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    {t('templates.variableHint')}
                  </p>
                </div>
              </div>

              {/* Live preview */}
              <div>
                <label className={labelClasses}>{t('templates.livePreview')}</label>
                <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/10">
                  {editorChannel === 'EMAIL' && editorSubject && (
                    <p className="text-sm font-semibold text-on-surface mb-2 pb-2 border-b border-outline-variant/10">
                      {replaceVariables(editorSubject, sampleData)}
                    </p>
                  )}
                  <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
                    {replaceVariables(editorBody || '...', sampleData)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/10">
                <button
                  onClick={saveTemplate}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
                >
                  {t('common.save')}
                </button>
                <button
                  onClick={closeEditor}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ PREVIEW MODAL ══════════════ */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl ambient-shadow w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-headline text-lg font-bold text-on-surface">
                  {t('templates.preview')}: {previewTemplate.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${channelBadge[previewTemplate.channel]}`}
                  >
                    {previewTemplate.channel}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${categoryBadge[previewTemplate.category]}`}
                  >
                    {previewTemplate.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(null)}
                className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {previewTemplate.channel === 'EMAIL' ? (
                <div className="border border-outline-variant/20 rounded-lg overflow-hidden">
                  <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant/10">
                    <p className="text-xs text-on-surface-variant">
                      <strong>From:</strong> noreply@sivanmanagment.com
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      <strong>To:</strong> {sampleData.guest_name || sampleData.owner_name}
                    </p>
                    <p className="text-sm font-semibold text-on-surface mt-1">
                      {replaceVariables(previewTemplate.subject || '', sampleData)}
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
                      {replaceVariables(previewTemplate.body, sampleData)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-w-sm mx-auto">
                  <div className="bg-green-50 rounded-2xl p-4 relative">
                    <div className="absolute top-2 end-3 text-[10px] text-green-600/50">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <p className="text-sm text-green-900 whitespace-pre-wrap leading-relaxed">
                      {replaceVariables(previewTemplate.body, sampleData)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
