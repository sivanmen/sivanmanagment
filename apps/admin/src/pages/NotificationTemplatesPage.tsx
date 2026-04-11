import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Mail,
  MessageCircle,
  Smartphone,
  Copy,
  Trash2,
  Pencil,
  Tag,
  LayoutGrid,
  List,
  Shield,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

interface TemplateContent {
  subject?: string;
  body: string;
}

interface NotificationTemplate {
  id: string;
  name: Record<string, string>;
  slug: string;
  category: string;
  variables: string[];
  isSystem: boolean;
  isActive: boolean;
  channels: {
    email?: Record<string, TemplateContent>;
    whatsapp?: Record<string, TemplateContent>;
    sms?: Record<string, TemplateContent>;
  };
  createdAt: string;
  updatedAt: string;
}

interface TemplatesResponse {
  data: NotificationTemplate[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

const LANGUAGES = ['en', 'he', 'de', 'es', 'fr', 'ru'] as const;

const CATEGORIES = [
  { key: 'all', color: '' },
  { key: 'booking', color: 'bg-secondary/10 text-secondary' },
  { key: 'payment', color: 'bg-success/10 text-success' },
  { key: 'maintenance', color: 'bg-warning/10 text-warning' },
  { key: 'system', color: 'bg-outline-variant/20 text-on-surface-variant' },
  { key: 'marketing', color: 'bg-blue-500/10 text-blue-600' },
  { key: 'guest', color: 'bg-pink-500/10 text-pink-600' },
] as const;

const categoryColorMap: Record<string, string> = {
  booking: 'bg-secondary/10 text-secondary',
  payment: 'bg-success/10 text-success',
  maintenance: 'bg-warning/10 text-warning',
  system: 'bg-outline-variant/20 text-on-surface-variant',
  marketing: 'bg-blue-500/10 text-blue-600',
  guest: 'bg-pink-500/10 text-pink-600',
};

function countLanguages(template: NotificationTemplate): number {
  const langs = new Set<string>();
  const channels = ['email', 'whatsapp', 'sms'] as const;
  for (const ch of channels) {
    const channelData = template.channels[ch];
    if (channelData) {
      for (const lang of Object.keys(channelData)) {
        if (channelData[lang]?.body) {
          langs.add(lang);
        }
      }
    }
  }
  return langs.size;
}

function hasChannelContent(template: NotificationTemplate, channel: 'email' | 'whatsapp' | 'sms'): boolean {
  const channelData = template.channels[channel];
  if (!channelData) return false;
  return Object.values(channelData).some((c) => c?.body?.length > 0);
}

export default function NotificationTemplatesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data, isLoading } = useQuery<TemplatesResponse>({
    queryKey: ['notification-templates', { search, category: categoryFilter }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      const res = await apiClient.get('/templates', { params });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/templates/${id}`),
    onSuccess: () => {
      toast.success(t('templates.deleteSuccess', 'Template deleted'));
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: () => {
      toast.error(t('templates.deleteError', 'Failed to delete template'));
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/templates/${id}/duplicate`),
    onSuccess: () => {
      toast.success(t('templates.duplicateSuccess', 'Template duplicated'));
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: () => {
      toast.error(t('templates.duplicateError', 'Failed to duplicate template'));
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(t('templates.confirmDelete', 'Are you sure you want to delete "{{name}}"?').replace('{{name}}', name))) {
      deleteMutation.mutate(id);
    }
  };

  const templates = data?.data ?? [];

  const currentLocale = i18n.language || 'en';

  const getTemplateName = (tpl: NotificationTemplate) => {
    return tpl.name[currentLocale] || tpl.name.en || Object.values(tpl.name)[0] || 'Untitled';
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('templates.label', 'Communications')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('templates.title', 'Notification Templates')}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t('templates.subtitle', 'Manage message templates for all notification channels')}
          </p>
        </div>
        <button
          onClick={() => navigate('/notification-templates/new')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('templates.createTemplate', 'Create Template')}</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategoryFilter(cat.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              categoryFilter === cat.key
                ? 'bg-secondary/10 text-secondary ring-1 ring-secondary/30'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            {t(`templates.categories.${cat.key}`, cat.key)}
          </button>
        ))}
      </div>

      {/* Search + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder={t('templates.searchPlaceholder', 'Search templates...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
        <div className="flex gap-1 bg-surface-container-lowest ambient-shadow rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-secondary/10 text-secondary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-secondary/10 text-secondary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Templates */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl ambient-shadow animate-pulse p-5 space-y-3">
              <div className="h-4 bg-surface-container-high rounded w-3/4" />
              <div className="h-3 bg-surface-container-high rounded w-1/2" />
              <div className="h-2 bg-surface-container-high rounded w-full" />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
          <Mail className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-4" />
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-1">
            {t('templates.emptyTitle', 'No templates yet')}
          </h3>
          <p className="text-sm text-on-surface-variant mb-6">
            {t('templates.emptyDescription', 'Create your first notification template to get started')}
          </p>
          <button
            onClick={() => navigate('/notification-templates/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('templates.createTemplate', 'Create Template')}</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((tpl) => {
            const langCount = countLanguages(tpl);
            const langPercent = (langCount / LANGUAGES.length) * 100;
            return (
              <div
                key={tpl.id}
                className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden hover:shadow-ambient-lg transition-all group"
              >
                <div className="p-5 space-y-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-headline text-base font-semibold text-on-surface truncate">
                        {getTemplateName(tpl)}
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-0.5 font-mono">{tpl.slug}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {tpl.isSystem && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-outline-variant/20 text-on-surface-variant">
                          <Shield className="w-2.5 h-2.5" />
                          {t('templates.system', 'System')}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${categoryColorMap[tpl.category] || 'bg-outline-variant/20 text-on-surface-variant'}`}>
                        {t(`templates.categories.${tpl.category}`, tpl.category)}
                      </span>
                    </div>
                  </div>

                  {/* Channel icons */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Mail className={`w-4 h-4 ${hasChannelContent(tpl, 'email') ? 'text-blue-500' : 'text-on-surface-variant/30'}`} />
                      <MessageCircle className={`w-4 h-4 ${hasChannelContent(tpl, 'whatsapp') ? 'text-green-500' : 'text-on-surface-variant/30'}`} />
                      <Smartphone className={`w-4 h-4 ${hasChannelContent(tpl, 'sms') ? 'text-amber-500' : 'text-on-surface-variant/30'}`} />
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span className="text-xs text-on-surface-variant">
                        {t('templates.languageComplete', '{{count}}/6 languages').replace('{{count}}', String(langCount))}
                      </span>
                    </div>
                  </div>

                  {/* Language progress bar */}
                  <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${langPercent === 100 ? 'bg-success' : 'gradient-accent'}`}
                      style={{ width: `${langPercent}%` }}
                    />
                  </div>

                  {/* Variables */}
                  {tpl.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tpl.variables.slice(0, 4).map((v) => (
                        <span
                          key={v}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-low text-[10px] font-mono text-on-surface-variant"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {v}
                        </span>
                      ))}
                      {tpl.variables.length > 4 && (
                        <span className="px-2 py-0.5 rounded bg-surface-container-low text-[10px] text-on-surface-variant">
                          +{tpl.variables.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-outline-variant/10">
                    <button
                      onClick={() => navigate(`/notification-templates/${tpl.id}/edit`)}
                      className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-secondary transition-colors"
                      title={t('common.edit', 'Edit')}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => duplicateMutation.mutate(tpl.id)}
                      className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-secondary transition-colors"
                      title={t('templates.duplicate', 'Duplicate')}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id, getTemplateName(tpl))}
                      disabled={tpl.isSystem}
                      className="p-2 rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={t('common.delete', 'Delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
          <div className="divide-y divide-outline-variant/10">
            {templates.map((tpl) => {
              const langCount = countLanguages(tpl);
              return (
                <div
                  key={tpl.id}
                  className="flex items-center gap-4 p-4 hover:bg-surface-container-low/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline text-sm font-semibold text-on-surface truncate">
                        {getTemplateName(tpl)}
                      </h3>
                      {tpl.isSystem && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-outline-variant/20 text-on-surface-variant">
                          <Shield className="w-2.5 h-2.5" />
                          {t('templates.system', 'System')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant font-mono mt-0.5">{tpl.slug}</p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider flex-shrink-0 ${categoryColorMap[tpl.category] || 'bg-outline-variant/20 text-on-surface-variant'}`}>
                    {t(`templates.categories.${tpl.category}`, tpl.category)}
                  </span>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Mail className={`w-3.5 h-3.5 ${hasChannelContent(tpl, 'email') ? 'text-blue-500' : 'text-on-surface-variant/30'}`} />
                    <MessageCircle className={`w-3.5 h-3.5 ${hasChannelContent(tpl, 'whatsapp') ? 'text-green-500' : 'text-on-surface-variant/30'}`} />
                    <Smartphone className={`w-3.5 h-3.5 ${hasChannelContent(tpl, 'sms') ? 'text-amber-500' : 'text-on-surface-variant/30'}`} />
                  </div>

                  <span className="text-xs text-on-surface-variant flex-shrink-0">
                    {langCount}/6
                  </span>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/notification-templates/${tpl.id}/edit`)}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-secondary transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => duplicateMutation.mutate(tpl.id)}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-secondary transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id, getTemplateName(tpl))}
                      disabled={tpl.isSystem}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
