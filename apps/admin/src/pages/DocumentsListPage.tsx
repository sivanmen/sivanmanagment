import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Trash2,
  FileText,
  File,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

type DocumentCategory =
  | 'CONTRACT'
  | 'INVOICE'
  | 'RECEIPT'
  | 'LICENSE'
  | 'INSURANCE'
  | 'TAX'
  | 'ID_DOCUMENT'
  | 'PHOTO'
  | 'REPORT'
  | 'OTHER';

type AccessLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'OWNER_ONLY';

interface DocumentRecord {
  id: string;
  title: string;
  propertyName: string;
  propertyId: string;
  category: DocumentCategory;
  accessLevel: AccessLevel;
  fileSize: string;
  uploadedBy: string;
  uploadDate: string;
  expiryDate?: string;
  fileName: string;
}

const categoryStyles: Record<DocumentCategory, string> = {
  CONTRACT: 'bg-blue-500/10 text-blue-600',
  INVOICE: 'bg-success/10 text-success',
  RECEIPT: 'bg-warning/10 text-warning',
  LICENSE: 'bg-secondary/10 text-secondary',
  INSURANCE: 'bg-error/10 text-error',
  TAX: 'bg-outline-variant/20 text-on-surface-variant',
  ID_DOCUMENT: 'bg-blue-500/10 text-blue-600',
  PHOTO: 'bg-success/10 text-success',
  REPORT: 'bg-warning/10 text-warning',
  OTHER: 'bg-outline-variant/20 text-on-surface-variant',
};

const accessStyles: Record<AccessLevel, string> = {
  PUBLIC: 'bg-success/10 text-success',
  INTERNAL: 'bg-blue-500/10 text-blue-600',
  CONFIDENTIAL: 'bg-warning/10 text-warning',
  OWNER_ONLY: 'bg-error/10 text-error',
};

const demoDocuments: DocumentRecord[] = [
  {
    id: 'doc-001',
    title: 'Lease Agreement - Elounda Villa',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    category: 'CONTRACT',
    accessLevel: 'CONFIDENTIAL',
    fileSize: '2.4 MB',
    uploadedBy: 'Sivan M.',
    uploadDate: '2026-01-15',
    expiryDate: '2027-01-15',
    fileName: 'lease_elounda_2026.pdf',
  },
  {
    id: 'doc-002',
    title: 'Property Insurance Policy',
    propertyName: 'Heraklion Harbor Suite',
    propertyId: 'prop-002',
    category: 'INSURANCE',
    accessLevel: 'INTERNAL',
    fileSize: '1.8 MB',
    uploadedBy: 'Sivan M.',
    uploadDate: '2026-02-10',
    expiryDate: '2027-02-10',
    fileName: 'insurance_heraklion_2026.pdf',
  },
  {
    id: 'doc-003',
    title: 'March 2026 Invoice - Cleaning',
    propertyName: 'Chania Old Town Residence',
    propertyId: 'prop-003',
    category: 'INVOICE',
    accessLevel: 'INTERNAL',
    fileSize: '340 KB',
    uploadedBy: 'Elena K.',
    uploadDate: '2026-03-31',
    fileName: 'inv_cleaning_mar2026.pdf',
  },
  {
    id: 'doc-004',
    title: 'Tourist Accommodation License',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    category: 'LICENSE',
    accessLevel: 'CONFIDENTIAL',
    fileSize: '560 KB',
    uploadedBy: 'Sivan M.',
    uploadDate: '2025-11-20',
    expiryDate: '2026-11-20',
    fileName: 'license_elounda.pdf',
  },
  {
    id: 'doc-005',
    title: 'Tax Declaration 2025',
    propertyName: 'Rethymno Sunset Apartment',
    propertyId: 'prop-004',
    category: 'TAX',
    accessLevel: 'OWNER_ONLY',
    fileSize: '1.2 MB',
    uploadedBy: 'Sivan M.',
    uploadDate: '2026-03-15',
    fileName: 'tax_rethymno_2025.pdf',
  },
  {
    id: 'doc-006',
    title: 'Guest ID Copy - Maria P.',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    category: 'ID_DOCUMENT',
    accessLevel: 'CONFIDENTIAL',
    fileSize: '420 KB',
    uploadedBy: 'System',
    uploadDate: '2026-04-10',
    fileName: 'id_maria_p.jpg',
  },
  {
    id: 'doc-007',
    title: 'Pool Area Photos',
    propertyName: 'Heraklion Harbor Suite',
    propertyId: 'prop-002',
    category: 'PHOTO',
    accessLevel: 'PUBLIC',
    fileSize: '8.5 MB',
    uploadedBy: 'Elena K.',
    uploadDate: '2026-03-20',
    fileName: 'pool_photos.zip',
  },
  {
    id: 'doc-008',
    title: 'Maintenance Receipt - Plumbing',
    propertyName: 'Chania Old Town Residence',
    propertyId: 'prop-003',
    category: 'RECEIPT',
    accessLevel: 'INTERNAL',
    fileSize: '180 KB',
    uploadedBy: 'Nikos D.',
    uploadDate: '2026-04-05',
    fileName: 'receipt_plumbing_apr.pdf',
  },
  {
    id: 'doc-009',
    title: 'Monthly Revenue Report - Q1',
    propertyName: 'Rethymno Sunset Apartment',
    propertyId: 'prop-004',
    category: 'REPORT',
    accessLevel: 'OWNER_ONLY',
    fileSize: '950 KB',
    uploadedBy: 'Sivan M.',
    uploadDate: '2026-04-01',
    fileName: 'report_q1_rethymno.pdf',
  },
  {
    id: 'doc-010',
    title: 'Wifi & Utilities Setup Guide',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    category: 'OTHER',
    accessLevel: 'PUBLIC',
    fileSize: '220 KB',
    uploadedBy: 'Sivan M.',
    uploadDate: '2025-12-01',
    fileName: 'setup_guide_elounda.pdf',
  },
];

const categories: DocumentCategory[] = [
  'CONTRACT',
  'INVOICE',
  'RECEIPT',
  'LICENSE',
  'INSURANCE',
  'TAX',
  'ID_DOCUMENT',
  'PHOTO',
  'REPORT',
  'OTHER',
];

const accessLevels: AccessLevel[] = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'OWNER_ONLY'];

export default function DocumentsListPage() {
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const properties = useMemo(() => {
    return Array.from(
      new Set(demoDocuments.map((d) => JSON.stringify({ id: d.propertyId, name: d.propertyName }))),
    ).map((s) => JSON.parse(s) as { id: string; name: string });
  }, []);

  const filtered = useMemo(() => {
    return demoDocuments.filter((d) => {
      if (search) {
        const q = search.toLowerCase();
        if (!d.title.toLowerCase().includes(q) && !d.fileName.toLowerCase().includes(q)) return false;
      }
      if (propertyFilter !== 'all' && d.propertyId !== propertyFilter) return false;
      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
      if (accessFilter !== 'all' && d.accessLevel !== accessFilter) return false;
      return true;
    });
  }, [search, propertyFilter, categoryFilter, accessFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const inputClass =
    'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('documents.title')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('documents.title')}
          </h1>
        </div>
        <button
          onClick={() => toast.success('Upload dialog coming soon')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('documents.upload')}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Total Documents
            </p>
            <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-secondary" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{demoDocuments.length}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Contracts
            </p>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <File className="w-3.5 h-3.5 text-blue-600" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">
            {demoDocuments.filter((d) => d.category === 'CONTRACT').length}
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Expiring Soon
            </p>
            <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-warning" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">
            {demoDocuments.filter((d) => d.expiryDate && d.expiryDate < '2026-12-31').length}
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Confidential
            </p>
            <div className="w-7 h-7 rounded-lg bg-error/10 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-error" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">
            {demoDocuments.filter((d) => d.accessLevel === 'CONFIDENTIAL' || d.accessLevel === 'OWNER_ONLY').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
        <select
          value={propertyFilter}
          onChange={(e) => {
            setPropertyFilter(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="all">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select
          value={accessFilter}
          onChange={(e) => {
            setAccessFilter(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="all">All Access Levels</option>
          {accessLevels.map((a) => (
            <option key={a} value={a}>
              {a.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20">
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Title
                </th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Property
                </th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t('documents.category')}
                </th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t('documents.accessLevel')}
                </th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t('documents.fileSize')}
                </th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Uploaded By
                </th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Upload Date
                </th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Expiry
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-on-surface">{doc.title}</p>
                      <p className="text-xs text-on-surface-variant">{doc.fileName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-on-surface">{doc.propertyName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${categoryStyles[doc.category]}`}
                    >
                      {doc.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${accessStyles[doc.accessLevel]}`}
                    >
                      {doc.accessLevel.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{doc.fileSize}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{doc.uploadedBy}</td>
                  <td className="px-4 py-3 text-on-surface whitespace-nowrap">
                    {new Date(doc.uploadDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                    {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => toast.success('Download started')}
                        className="flex items-center justify-center p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toast.success('Edit dialog coming soon')}
                        className="flex items-center justify-center p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toast.success('Document deleted')}
                        className="flex items-center justify-center p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-on-surface-variant">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'gradient-accent text-white'
                  : 'text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
