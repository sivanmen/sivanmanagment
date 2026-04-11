import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Mail,
  MessageCircle,
  Smartphone,
  Tag,
  X,
  Plus,
  Eye,
  Globe,
  Sparkles,
  Brain,
  Zap,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  RotateCcw,
  Wand2,
  Languages,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

// ── Types ───────────────────────────────────────────────────────────
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

interface AiProvider {
  id: string;
  provider: string;
  model: string;
  isDefault: boolean;
  isConfigured: boolean;
}

type Channel = 'email' | 'whatsapp' | 'sms';
type LangCode = 'en' | 'he' | 'de' | 'es' | 'fr' | 'ru';

// ── Constants ───────────────────────────────────────────────────────

const LANGUAGES: { code: LangCode; flag: string; label: string }[] = [
  { code: 'en', flag: '\uD83C\uDDEC\uD83C\uDDE7', label: 'English' },
  { code: 'he', flag: '\uD83C\uDDEE\uD83C\uDDF1', label: 'Hebrew' },
  { code: 'de', flag: '\uD83C\uDDE9\uD83C\uDDEA', label: 'German' },
  { code: 'es', flag: '\uD83C\uDDEA\uD83C\uDDF8', label: 'Spanish' },
  { code: 'fr', flag: '\uD83C\uDDEB\uD83C\uDDF7', label: 'French' },
  { code: 'ru', flag: '\uD83C\uDDF7\uD83C\uDDFA', label: 'Russian' },
];

const CHANNELS: { key: Channel; label: string; icon: typeof Mail }[] = [
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { key: 'sms', label: 'SMS', icon: Smartphone },
];

const CATEGORY_OPTIONS = [
  'booking',
  'payment',
  'maintenance',
  'system',
  'marketing',
  'guest',
];

const DEFAULT_VARIABLES = [
  'guestName',
  'propertyName',
  'checkInDate',
  'checkOutDate',
  'checkInTime',
  'checkOutTime',
  'totalAmount',
  'bookingId',
  'ownerName',
  'companyName',
];

const SAMPLE_DATA: Record<string, string> = {
  guestName: 'Sarah Mueller',
  propertyName: 'Aegean Sunset Villa',
  checkInDate: '2026-05-15',
  checkOutDate: '2026-05-22',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  totalAmount: '1,960',
  bookingId: 'BK-20260415',
  ownerName: 'David Cohen',
  companyName: 'Sivan Management',
};

const inputClasses =
  'w-full px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

const labelClasses =
  'block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5';

function replaceVariables(text: string, data: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || `{{${key}}}`);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// ── Main Component ──────────────────────────────────────────────────

export default function TemplateEditorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';

  // Template state
  const [name, setName] = useState<Record<string, string>>({ en: '' });
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('booking');
  const [variables, setVariables] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [channels, setChannels] = useState<NotificationTemplate['channels']>({});
  const [newVariable, setNewVariable] = useState('');

  // UI state
  const [activeLang, setActiveLang] = useState<LangCode>('en');
  const [activeChannel, setActiveChannel] = useState<Channel>('email');
  const [showPreview, setShowPreview] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showNameEditor, setShowNameEditor] = useState(false);

  // AI state
  const [aiAction, setAiAction] = useState<'translate' | 'improve' | 'generate' | null>(null);
  const [aiTargetLangs, setAiTargetLangs] = useState<LangCode[]>([]);
  const [aiInstructions, setAiInstructions] = useState('');
  const [aiGenerateDesc, setAiGenerateDesc] = useState('');
  const [aiImprovedContent, setAiImprovedContent] = useState<{ original: string; improved: string } | null>(null);
  const [aiTranslating, setAiTranslating] = useState<Record<string, boolean>>({});

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  // ── Load existing template ──────────────────────────────────────
  const { data: templateData, isLoading: isLoadingTemplate } = useQuery<{ data: NotificationTemplate }>({
    queryKey: ['notification-template', id],
    queryFn: async () => {
      const res = await apiClient.get(`/templates/${id}`);
      return res.data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (templateData?.data) {
      const tpl = templateData.data;
      setName(tpl.name || { en: '' });
      setSlug(tpl.slug || '');
      setCategory(tpl.category || 'booking');
      setVariables(tpl.variables || []);
      setIsActive(tpl.isActive);
      setChannels(tpl.channels || {});
    }
  }, [templateData]);

  // ── Load AI providers ───────────────────────────────────────────
  const { data: providersData } = useQuery<{ data: AiProvider[] }>({
    queryKey: ['ai-providers'],
    queryFn: async () => {
      const res = await apiClient.get('/ai/providers');
      return res.data;
    },
  });

  const aiProviders = providersData?.data ?? [];
  const defaultProvider = aiProviders.find((p) => p.isDefault) || aiProviders[0];

  // ── Auto-slug from English name ─────────────────────────────────
  useEffect(() => {
    if (isNew && name.en) {
      setSlug(slugify(name.en));
    }
  }, [name.en, isNew]);

  // ── Channel content helpers ─────────────────────────────────────
  const getContent = useCallback(
    (channel: Channel, lang: LangCode): TemplateContent => {
      const ch = channels[channel];
      if (!ch || !ch[lang]) return { subject: '', body: '' };
      return ch[lang];
    },
    [channels],
  );

  const setContent = useCallback(
    (channel: Channel, lang: LangCode, content: Partial<TemplateContent>) => {
      setChannels((prev) => {
        const chData = { ...(prev[channel] || {}) };
        chData[lang] = {
          subject: content.subject ?? chData[lang]?.subject ?? '',
          body: content.body ?? chData[lang]?.body ?? '',
        };
        return { ...prev, [channel]: chData };
      });
    },
    [],
  );

  const currentContent = getContent(activeChannel, activeLang);

  const hasContentForLang = (lang: LangCode): boolean => {
    for (const ch of CHANNELS) {
      const content = getContent(ch.key, lang);
      if (content.body) return true;
    }
    return false;
  };

  const hasContentForChannel = (channel: Channel): boolean => {
    const content = getContent(channel, activeLang);
    return !!content.body;
  };

  // ── Variable insertion ──────────────────────────────────────────
  const insertVariable = (varName: string, target: 'body' | 'subject') => {
    const insertion = `{{${varName}}}`;
    if (target === 'body' && bodyRef.current) {
      const el = bodyRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newBody = currentContent.body.substring(0, start) + insertion + currentContent.body.substring(end);
      setContent(activeChannel, activeLang, { body: newBody });
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + insertion.length;
        el.focus();
      });
    } else if (target === 'subject' && subjectRef.current) {
      const el = subjectRef.current;
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const currentSubject = currentContent.subject || '';
      const newSubject = currentSubject.substring(0, start) + insertion + currentSubject.substring(end);
      setContent(activeChannel, activeLang, { subject: newSubject });
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + insertion.length;
        el.focus();
      });
    }
  };

  const addVariable = () => {
    const trimmed = newVariable.trim();
    if (trimmed && !variables.includes(trimmed)) {
      setVariables([...variables, trimmed]);
      setNewVariable('');
    }
  };

  const removeVariable = (v: string) => {
    setVariables(variables.filter((x) => x !== v));
  };

  // ── SMS character count ─────────────────────────────────────────
  const smsCharCount = activeChannel === 'sms' ? (currentContent.body?.length || 0) : 0;
  const smsSegments = Math.ceil(smsCharCount / 160) || 1;

  // ── Save mutation ───────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (activate: boolean) => {
      const payload = {
        name,
        slug,
        category,
        variables,
        isActive: activate ? true : isActive,
        channels,
      };
      if (isNew) {
        return apiClient.post('/templates', payload);
      }
      return apiClient.put(`/templates/${id}`, payload);
    },
    onSuccess: () => {
      toast.success(isNew ? t('templates.createSuccess', 'Template created') : t('templates.updateSuccess', 'Template saved'));
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      queryClient.invalidateQueries({ queryKey: ['notification-template', id] });
      navigate('/notification-templates');
    },
    onError: () => {
      toast.error(t('templates.saveError', 'Failed to save template'));
    },
  });

  // ── AI Translate ────────────────────────────────────────────────
  const translateMutation = useMutation({
    mutationFn: async ({ targetLangs }: { targetLangs: LangCode[] }) => {
      const translating: Record<string, boolean> = {};
      targetLangs.forEach((l) => (translating[l] = true));
      setAiTranslating(translating);

      const res = await apiClient.post(`/templates/${id || 'new'}/translate`, {
        sourceLanguage: activeLang,
        targetLanguages: targetLangs,
        channel: activeChannel,
        content: currentContent,
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.data?.translations) {
        const translations = data.data.translations as Record<string, TemplateContent>;
        for (const [lang, content] of Object.entries(translations)) {
          setContent(activeChannel, lang as LangCode, content);
        }
        toast.success(t('templates.ai.translateSuccess', 'Translation completed'));
      }
      setAiTranslating({});
      setAiAction(null);
    },
    onError: () => {
      toast.error(t('templates.ai.translateError', 'Translation failed'));
      setAiTranslating({});
    },
  });

  // ── AI Improve ──────────────────────────────────────────────────
  const improveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/templates/${id || 'new'}/improve`, {
        language: activeLang,
        channel: activeChannel,
        content: currentContent,
        instructions: aiInstructions,
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.data?.improved) {
        setAiImprovedContent({
          original: currentContent.body,
          improved: data.data.improved.body,
        });
        toast.success(t('templates.ai.improveSuccess', 'Improvement generated'));
      }
    },
    onError: () => {
      toast.error(t('templates.ai.improveError', 'Improvement failed'));
    },
  });

  // ── AI Generate ─────────────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/templates/generate', {
        description: aiGenerateDesc,
        channel: activeChannel,
        language: activeLang,
        variables,
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.data?.content) {
        setContent(activeChannel, activeLang, data.data.content);
        toast.success(t('templates.ai.generateSuccess', 'Content generated'));
        setAiAction(null);
      }
    },
    onError: () => {
      toast.error(t('templates.ai.generateError', 'Generation failed'));
    },
  });

  const handleAcceptImprovement = () => {
    if (aiImprovedContent) {
      setContent(activeChannel, activeLang, { body: aiImprovedContent.improved });
      setAiImprovedContent(null);
      setAiAction(null);
    }
  };

  const handleRejectImprovement = () => {
    setAiImprovedContent(null);
  };

  const toggleTranslateLang = (lang: LangCode) => {
    setAiTargetLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const selectAllTranslateLangs = () => {
    const others = LANGUAGES.filter((l) => l.code !== activeLang).map((l) => l.code);
    setAiTargetLangs(others);
  };

  if (!isNew && isLoadingTemplate) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-secondary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-secondary animate-spin" />
          </div>
          <p className="text-xs font-medium text-on-surface-variant tracking-wider uppercase">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/notification-templates')}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-0.5">
              {isNew ? t('templates.createTemplate', 'Create Template') : t('templates.editTemplate', 'Edit Template')}
            </p>
            <h1 className="font-headline text-xl lg:text-2xl font-bold text-on-surface">
              {name.en || t('templates.newTemplate', 'New Template')}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              showAiPanel
                ? 'bg-secondary/20 text-secondary ring-1 ring-secondary/30'
                : 'bg-surface-container-lowest ambient-shadow text-on-surface-variant hover:text-secondary'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {t('templates.ai.title', 'AI Assistant')}
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-surface-container-lowest ambient-shadow text-on-surface-variant hover:text-secondary transition-all"
          >
            <Eye className="w-4 h-4" />
            {t('templates.preview', 'Preview')}
          </button>
          <button
            onClick={() => saveMutation.mutate(false)}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-surface-container-lowest ambient-shadow text-on-surface hover:bg-surface-container-low transition-all disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('templates.saveDraft', 'Save Draft')}
          </button>
          <button
            onClick={() => saveMutation.mutate(true)}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {t('templates.saveActivate', 'Save & Activate')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* ── Left Panel - Template Info ────────────────────────── */}
        <div className="xl:col-span-1 space-y-4">
          {/* Template Name */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className={labelClasses}>{t('templates.templateName', 'Template Name')}</label>
              <button
                onClick={() => setShowNameEditor(!showNameEditor)}
                className="text-[10px] font-medium text-secondary hover:text-secondary/80 transition-colors"
              >
                {showNameEditor ? t('common.collapse', 'Collapse') : t('templates.allLanguages', 'All Languages')}
              </button>
            </div>
            <input
              type="text"
              value={name.en || ''}
              onChange={(e) => setName((prev) => ({ ...prev, en: e.target.value }))}
              placeholder="Template name in English..."
              className={inputClasses}
            />
            {showNameEditor && (
              <div className="space-y-2 pt-2 border-t border-outline-variant/10">
                {LANGUAGES.filter((l) => l.code !== 'en').map((lang) => (
                  <div key={lang.code}>
                    <label className="text-[10px] text-on-surface-variant mb-1 block">
                      {lang.flag} {lang.label}
                    </label>
                    <input
                      type="text"
                      value={name[lang.code] || ''}
                      onChange={(e) =>
                        setName((prev) => ({ ...prev, [lang.code]: e.target.value }))
                      }
                      placeholder={`Name in ${lang.label}...`}
                      className={inputClasses}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Slug */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-4">
            <label className={labelClasses}>{t('templates.slug', 'Slug')}</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="template-slug"
              className={inputClasses + ' font-mono'}
            />
          </div>

          {/* Category */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-4">
            <label className={labelClasses}>{t('templates.category', 'Category')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClasses}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`templates.categories.${cat}`, cat)}
                </option>
              ))}
            </select>
          </div>

          {/* Variables */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-4 space-y-3">
            <label className={labelClasses}>{t('templates.variables', 'Variables')}</label>
            <div className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container-low text-xs font-mono text-on-surface-variant group"
                >
                  <Tag className="w-3 h-3" />
                  {v}
                  <button
                    onClick={() => removeVariable(v)}
                    className="ml-0.5 text-on-surface-variant/50 hover:text-error transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addVariable()}
                placeholder={t('templates.addVariable', 'Add variable...')}
                className={inputClasses + ' flex-1'}
              />
              <button
                onClick={addVariable}
                className="px-3 py-2 rounded-lg bg-secondary/10 text-secondary text-sm font-medium hover:bg-secondary/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {/* Quick-add default variables */}
            <div className="pt-2 border-t border-outline-variant/10">
              <p className="text-[10px] text-on-surface-variant mb-1.5">{t('templates.commonVariables', 'Common')}</p>
              <div className="flex flex-wrap gap-1">
                {DEFAULT_VARIABLES.filter((v) => !variables.includes(v)).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVariables((prev) => [...prev, v])}
                    className="px-2 py-0.5 rounded text-[10px] font-mono text-on-surface-variant/60 bg-surface-container-low hover:bg-secondary/10 hover:text-secondary transition-colors"
                  >
                    +{v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-4">
            <div className="flex items-center justify-between">
              <label className={labelClasses + ' mb-0'}>{t('templates.activeStatus', 'Active')}</label>
              <button
                onClick={() => setIsActive(!isActive)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? 'bg-success' : 'bg-outline-variant/30'}`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${isActive ? 'start-[22px]' : 'start-0.5'}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Panel - Content Editor ──────────────────────── */}
        <div className={`${showAiPanel ? 'xl:col-span-2' : 'xl:col-span-3'} space-y-4`}>
          {/* Language Selector */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-1.5">
            <div className="flex gap-1 overflow-x-auto">
              {LANGUAGES.map((lang) => {
                const hasContent = hasContentForLang(lang.code);
                return (
                  <button
                    key={lang.code}
                    onClick={() => setActiveLang(lang.code)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeLang === lang.code
                        ? 'bg-secondary/10 text-secondary ring-1 ring-secondary/30'
                        : 'text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.code.toUpperCase()}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${hasContent ? 'bg-success' : 'bg-outline-variant/30'}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Channel Tabs */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-1.5">
            <div className="flex gap-1">
              {CHANNELS.map((ch) => {
                const ChIcon = ch.icon;
                const hasContent = hasContentForChannel(ch.key);
                return (
                  <button
                    key={ch.key}
                    onClick={() => setActiveChannel(ch.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeChannel === ch.key
                        ? 'bg-secondary/10 text-secondary ring-1 ring-secondary/30'
                        : 'text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <ChIcon className="w-4 h-4" />
                    <span>{ch.label}</span>
                    {hasContent && <Check className="w-3 h-3 text-success" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Editor */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="p-5 space-y-4">
              {/* Subject (email only) */}
              {activeChannel === 'email' && (
                <div>
                  <label className={labelClasses}>{t('templates.subject', 'Subject')}</label>
                  <input
                    ref={subjectRef}
                    type="text"
                    value={currentContent.subject || ''}
                    onChange={(e) => setContent(activeChannel, activeLang, { subject: e.target.value })}
                    placeholder="Email subject line..."
                    className={inputClasses}
                  />
                </div>
              )}

              {/* Variable insertion toolbar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClasses + ' mb-0'}>
                    {t('templates.insertVariable', 'Insert Variable')}
                  </label>
                  {activeChannel === 'sms' && (
                    <span className={`text-xs font-mono ${smsCharCount > 160 ? 'text-warning' : 'text-on-surface-variant'}`}>
                      {t('templates.charCount', '{{count}} characters').replace('{{count}}', String(smsCharCount))}
                      {' | '}
                      {t('templates.smsSegments', '{{count}} SMS segment(s)').replace('{{count}}', String(smsSegments))}
                    </span>
                  )}
                  {activeChannel === 'whatsapp' && (
                    <span className="text-xs text-on-surface-variant">
                      {currentContent.body?.length || 0} chars
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {variables.map((v) => (
                    <button
                      key={v}
                      onClick={() => insertVariable(v, activeChannel === 'email' ? 'body' : 'body')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low text-xs font-mono text-on-surface-variant hover:bg-secondary/10 hover:text-secondary transition-colors"
                    >
                      <Tag className="w-3 h-3" />
                      {`{{${v}}}`}
                    </button>
                  ))}
                  {activeChannel === 'email' && variables.length > 0 && (
                    <span className="text-[10px] text-on-surface-variant/50 flex items-center px-2">
                      (inserts at cursor in body)
                    </span>
                  )}
                </div>
              </div>

              {/* Body editor */}
              <div>
                <label className={labelClasses}>{t('templates.body', 'Body')}</label>
                <textarea
                  ref={bodyRef}
                  value={currentContent.body || ''}
                  onChange={(e) => setContent(activeChannel, activeLang, { body: e.target.value })}
                  rows={activeChannel === 'email' ? 16 : activeChannel === 'sms' ? 6 : 10}
                  placeholder={
                    activeChannel === 'email'
                      ? 'Write your email template with HTML support...'
                      : activeChannel === 'whatsapp'
                        ? 'Write your WhatsApp message...'
                        : 'Write your SMS message (160 chars per segment)...'
                  }
                  className={`${inputClasses} resize-none font-mono text-xs leading-relaxed`}
                />
              </div>

              {/* WhatsApp formatting tips */}
              {activeChannel === 'whatsapp' && (
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    WhatsApp Formatting
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant">
                    <span><strong>*bold*</strong> = *text*</span>
                    <span><em>_italic_</em> = _text_</span>
                    <span><s>~strikethrough~</s> = ~text~</span>
                    <span><code>`code`</code> = `text`</span>
                  </div>
                </div>
              )}

              {/* SMS segment info */}
              {activeChannel === 'sms' && (
                <div className="bg-surface-container-low rounded-lg p-3">
                  <div className="flex items-center gap-4">
                    <div className="h-2 flex-1 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${smsCharCount > 480 ? 'bg-error' : smsCharCount > 320 ? 'bg-warning' : smsCharCount > 160 ? 'bg-secondary' : 'bg-success'}`}
                        style={{ width: `${Math.min((smsCharCount / 480) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-on-surface-variant font-mono whitespace-nowrap">
                      {smsCharCount} / {smsSegments * 160}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Preview Panel ──────────────────────────────────── */}
          {showPreview && (
            <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
              <div className="px-5 py-3 border-b border-outline-variant/10 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-on-surface">
                  {t('templates.preview', 'Preview')} — {LANGUAGES.find((l) => l.code === activeLang)?.flag} {activeLang.toUpperCase()}
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1 rounded text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5">
                {activeChannel === 'email' ? (
                  <div className="border border-outline-variant/20 rounded-lg overflow-hidden">
                    <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant/10">
                      <p className="text-xs text-on-surface-variant">
                        <strong>From:</strong> noreply@sivanmanagement.com
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        <strong>To:</strong> {SAMPLE_DATA.guestName}
                      </p>
                      {currentContent.subject && (
                        <p className="text-sm font-semibold text-on-surface mt-1">
                          {replaceVariables(currentContent.subject, SAMPLE_DATA)}
                        </p>
                      )}
                    </div>
                    <div className="p-4">
                      <div
                        className="text-sm text-on-surface leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: replaceVariables(currentContent.body || '', SAMPLE_DATA).replace(/\n/g, '<br/>'),
                        }}
                      />
                    </div>
                  </div>
                ) : activeChannel === 'whatsapp' ? (
                  <div className="max-w-sm mx-auto">
                    <div className="bg-green-50 rounded-2xl p-4 relative">
                      <div className="absolute top-2 end-3 text-[10px] text-green-600/50">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <p className="text-sm text-green-900 whitespace-pre-wrap leading-relaxed">
                        {replaceVariables(currentContent.body || '', SAMPLE_DATA)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-xs mx-auto">
                    <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-4">
                      <div className="bg-surface-container-low rounded-xl p-3">
                        <p className="text-xs text-on-surface whitespace-pre-wrap leading-relaxed">
                          {replaceVariables(currentContent.body || '', SAMPLE_DATA)}
                        </p>
                      </div>
                      <p className="text-[10px] text-on-surface-variant text-center mt-2">
                        {smsCharCount} chars | {smsSegments} segment{smsSegments !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── AI Assistant Panel ────────────────────────────────── */}
        {showAiPanel && (
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-secondary" />
                  <h3 className="text-sm font-semibold text-on-surface">
                    {t('templates.ai.title', 'AI Assistant')}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAiPanel(false)}
                  className="p-1 rounded text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Provider indicator */}
              {defaultProvider && (
                <div className="px-4 py-2 bg-surface-container-low/50 border-b border-outline-variant/10">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    {defaultProvider.provider === 'anthropic' && <Brain className="w-3 h-3" />}
                    {defaultProvider.provider === 'openai' && <Sparkles className="w-3 h-3" />}
                    {defaultProvider.provider === 'google' && <Zap className="w-3 h-3" />}
                    <span>{defaultProvider.provider} / {defaultProvider.model}</span>
                  </div>
                </div>
              )}

              <div className="p-4 space-y-3">
                {/* AI Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setAiAction(aiAction === 'translate' ? null : 'translate')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg text-xs font-medium transition-all ${
                      aiAction === 'translate'
                        ? 'bg-secondary/10 text-secondary ring-1 ring-secondary/30'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <Languages className="w-4 h-4" />
                    {t('templates.ai.translate', 'Translate')}
                  </button>
                  <button
                    onClick={() => setAiAction(aiAction === 'improve' ? null : 'improve')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg text-xs font-medium transition-all ${
                      aiAction === 'improve'
                        ? 'bg-secondary/10 text-secondary ring-1 ring-secondary/30'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <Wand2 className="w-4 h-4" />
                    {t('templates.ai.improve', 'Improve')}
                  </button>
                  <button
                    onClick={() => setAiAction(aiAction === 'generate' ? null : 'generate')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg text-xs font-medium transition-all ${
                      aiAction === 'generate'
                        ? 'bg-secondary/10 text-secondary ring-1 ring-secondary/30'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    {t('templates.ai.generate', 'Generate')}
                  </button>
                </div>

                {/* ── Translate Action ──────────────────────────── */}
                {aiAction === 'translate' && (
                  <div className="space-y-3 pt-3 border-t border-outline-variant/10">
                    <p className="text-xs text-on-surface-variant">
                      {t('templates.ai.translateFrom', 'Translate from {{language}}').replace(
                        '{{language}}',
                        LANGUAGES.find((l) => l.code === activeLang)?.label || activeLang,
                      )}
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                        {t('templates.ai.translateTo', 'Translate to')}
                      </label>
                      <button
                        onClick={selectAllTranslateLangs}
                        className="text-[10px] font-medium text-secondary hover:text-secondary/80 transition-colors"
                      >
                        {t('templates.ai.translateAll', 'Select All')}
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {LANGUAGES.filter((l) => l.code !== activeLang).map((lang) => (
                        <label
                          key={lang.code}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={aiTargetLangs.includes(lang.code)}
                            onChange={() => toggleTranslateLang(lang.code)}
                            className="w-4 h-4 rounded border-outline-variant text-secondary focus:ring-secondary"
                          />
                          <span className="text-sm">{lang.flag}</span>
                          <span className="text-sm text-on-surface">{lang.label}</span>
                          {aiTranslating[lang.code] && (
                            <Loader2 className="w-3 h-3 text-secondary animate-spin ms-auto" />
                          )}
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => translateMutation.mutate({ targetLangs: aiTargetLangs })}
                      disabled={aiTargetLangs.length === 0 || translateMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
                    >
                      {translateMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('templates.ai.translating', 'Translating...')}
                        </>
                      ) : (
                        <>
                          <Languages className="w-4 h-4" />
                          {t('templates.ai.translate', 'Translate')}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* ── Improve Action ────────────────────────────── */}
                {aiAction === 'improve' && (
                  <div className="space-y-3 pt-3 border-t border-outline-variant/10">
                    <div>
                      <label className={labelClasses}>
                        {t('templates.ai.improveInstructions', 'Instructions for AI')}
                      </label>
                      <textarea
                        value={aiInstructions}
                        onChange={(e) => setAiInstructions(e.target.value)}
                        rows={3}
                        placeholder="e.g., Make it more professional, Add a personal touch, Make it shorter..."
                        className={`${inputClasses} resize-none text-xs`}
                      />
                    </div>
                    <button
                      onClick={() => improveMutation.mutate()}
                      disabled={!aiInstructions.trim() || improveMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
                    >
                      {improveMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('templates.ai.improving', 'Improving...')}
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          {t('templates.ai.improve', 'Improve')}
                        </>
                      )}
                    </button>

                    {/* Improved content comparison */}
                    {aiImprovedContent && (
                      <div className="space-y-3 pt-3 border-t border-outline-variant/10">
                        <div>
                          <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                            {t('templates.ai.original', 'Original')}
                          </p>
                          <div className="bg-surface-container-low rounded-lg p-3 text-xs text-on-surface-variant whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {aiImprovedContent.original}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-success uppercase tracking-wider mb-1">
                            {t('templates.ai.improved', 'Improved')}
                          </p>
                          <div className="bg-success/5 border border-success/20 rounded-lg p-3 text-xs text-on-surface whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {aiImprovedContent.improved}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleAcceptImprovement}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white bg-success hover:bg-success/90 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {t('templates.ai.accept', 'Accept')}
                          </button>
                          <button
                            onClick={handleRejectImprovement}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {t('templates.ai.reject', 'Reject')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Generate Action ──────────────────────────── */}
                {aiAction === 'generate' && (
                  <div className="space-y-3 pt-3 border-t border-outline-variant/10">
                    <div>
                      <label className={labelClasses}>
                        {t('templates.ai.generateDescription', 'Describe what this template should communicate')}
                      </label>
                      <textarea
                        value={aiGenerateDesc}
                        onChange={(e) => setAiGenerateDesc(e.target.value)}
                        rows={4}
                        placeholder="e.g., A friendly booking confirmation email that includes check-in details and a welcome message..."
                        className={`${inputClasses} resize-none text-xs`}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span>Channel:</span>
                      <span className="font-medium text-on-surface">{activeChannel}</span>
                      <span>|</span>
                      <span>Language:</span>
                      <span className="font-medium text-on-surface">
                        {LANGUAGES.find((l) => l.code === activeLang)?.label}
                      </span>
                    </div>
                    <button
                      onClick={() => generateMutation.mutate()}
                      disabled={!aiGenerateDesc.trim() || generateMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
                    >
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('templates.ai.generating', 'Generating...')}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          {t('templates.ai.generate', 'Generate')}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
