import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Search,
  Download,
  AlertTriangle,
  FolderOpen,
  FileCheck,
  Receipt,
  BarChart3,
  File,
  Clock,
  Building2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useApiQuery } from '../hooks/useApi';
import apiClient from '../lib/api-client';

interface Document {
  id: string;
  title: string;
  category: 'contract' | 'invoice' | 'receipt' | 'report' | 'other';
  propertyName: string;
  fileSize: string;
  date: string;
  expiresAt?: string;
  fileType: string;
}

type CategoryFilter = 'all' | 'contract' | 'invoice' | 'receipt' | 'report' | 'other';

const categoryConfig: Record<Document['category'], { label: string; color: string; icon: typeof FileText }> = {
  contract: { label: 'Contract', color: 'bg-secondary/10 text-secondary', icon: FileCheck },
  invoice: { label: 'Invoice', color: 'bg-warning/10 text-warning', icon: Receipt },
  receipt: { label: 'Receipt', color: 'bg-success/10 text-success', icon: File },
  report: { label: 'Report', color: 'bg-blue-100 text-blue-600', icon: BarChart3 },
  other: { label: 'Other', color: 'bg-on-surface-variant/10 text-on-surface-variant', icon: FolderOpen },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

async function handleDownload(docId: string, title: string) {
  try {
    const response = await apiClient.get(`/documents/${docId}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', title || 'document');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    // If direct download fails, try opening the download URL in a new tab
    const baseURL = apiClient.defaults.baseURL || '';
    window.open(`${baseURL}/documents/${docId}/download`, '_blank');
  }
}

export default function MyDocumentsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Fetch documents from API ──
  const {
    data: documentsResponse,
    isLoading,
    isError,
    refetch,
  } = useApiQuery<Document[]>(
    ['my-documents'],
    '/documents',
  );

  const documents: Document[] = documentsResponse?.data ?? [];

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    if (activeTab !== 'all') {
      filtered = filtered.filter((d) => d.category === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.propertyName?.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [documents, activeTab, searchQuery]);

  const expiringDocs = useMemo(() => {
    return documents.filter((d) => {
      if (!d.expiresAt) return false;
      const days = daysUntil(d.expiresAt);
      return days >= 0 && days <= 45;
    });
  }, [documents]);

  // Stats
  const totalDocs = documents.length;
  const contracts = documents.filter((d) => d.category === 'contract').length;
  const invoices = documents.filter((d) => d.category === 'invoice').length;
  const expiringSoon = expiringDocs.length;

  const tabs: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: t('documents.all') },
    { key: 'contract', label: t('documents.contracts') },
    { key: 'invoice', label: t('documents.invoices') },
    { key: 'receipt', label: t('documents.receipts') },
    { key: 'report', label: t('documents.reports') },
    { key: 'other', label: t('documents.other') },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('documents.subtitle')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('documents.title')}
          </h1>
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t('common.search')} ${t('documents.searchPlaceholder')}...`}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow text-center">
          <Loader2 className="w-8 h-8 text-secondary animate-spin mx-auto mb-3" />
          <p className="text-sm text-on-surface-variant">Loading documents...</p>
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow text-center">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-error" />
          </div>
          <p className="text-sm font-medium text-on-surface">Failed to load documents</p>
          <p className="text-xs text-on-surface-variant mt-1">Please check your connection and try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-secondary bg-secondary/10 hover:bg-secondary/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-secondary" />
                </div>
              </div>
              <p className="font-headline text-xl font-bold text-on-surface">{totalDocs}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('documents.totalDocuments')}</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <FileCheck className="w-4 h-4 text-success" />
                </div>
              </div>
              <p className="font-headline text-xl font-bold text-on-surface">{contracts}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('documents.activeContracts')}</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-warning" />
                </div>
              </div>
              <p className="font-headline text-xl font-bold text-on-surface">{invoices}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('documents.invoicesCount')}</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-error" />
                </div>
              </div>
              <p className="font-headline text-xl font-bold text-on-surface">{expiringSoon}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('documents.expiringSoon')}</p>
            </div>
          </div>

          {/* Expiring Soon Section */}
          {expiringDocs.length > 0 && (
            <div className="bg-error/5 border border-error/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-error" />
                <h3 className="font-headline text-lg font-semibold text-on-surface">
                  {t('documents.expiringTitle')}
                </h3>
              </div>
              <div className="space-y-2">
                {expiringDocs.map((doc) => {
                  const days = daysUntil(doc.expiresAt!);
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Clock className="w-4 h-4 text-error flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-on-surface truncate">{doc.title}</p>
                          <p className="text-xs text-on-surface-variant">{doc.propertyName}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-error whitespace-nowrap ms-3">
                        {days <= 0
                          ? t('documents.expired')
                          : `${days} ${t('documents.daysLeft')}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'gradient-accent text-on-secondary'
                    : 'bg-surface-container-lowest ambient-shadow text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Document Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => {
              const catCfg = categoryConfig[doc.category] || categoryConfig.other;
              const CatIcon = catCfg.icon;

              return (
                <div
                  key={doc.id}
                  className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-all group"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                      <CatIcon className="w-5 h-5 text-on-surface-variant" />
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${catCfg.color}`}
                    >
                      {catCfg.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-headline font-semibold text-on-surface text-sm leading-tight mb-2 line-clamp-2">
                    {doc.title}
                  </h3>

                  {/* Property */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <Building2 className="w-3 h-3 text-on-surface-variant flex-shrink-0" />
                    <span className="text-xs text-on-surface-variant">{doc.propertyName}</span>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center justify-between text-xs text-on-surface-variant mb-4">
                    <span>{formatDate(doc.date)}</span>
                    <span>{doc.fileSize}</span>
                  </div>

                  {/* Download button */}
                  <button
                    onClick={() => handleDownload(doc.id, doc.title)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-low text-sm font-medium text-on-surface transition-all group-hover:gradient-accent group-hover:text-on-secondary"
                  >
                    <Download className="w-4 h-4" />
                    {t('documents.download')}
                  </button>
                </div>
              );
            })}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
              <FolderOpen className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-on-surface-variant font-medium">{t('documents.noDocuments')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
