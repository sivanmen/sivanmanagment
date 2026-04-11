import { useState, useMemo, useCallback, useRef } from 'react';
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
  X,
  Upload,
  CloudUpload,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
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

type UploadDocumentType = 'LEASE' | 'CONTRACT' | 'INVOICE' | 'ID' | 'INSURANCE' | 'TAX' | 'OTHER';

interface DocumentRecord {
  id: string;
  title: string;
  propertyName: string;
  propertyId: string;
  category: DocumentCategory;
  accessLevel: AccessLevel;
  fileSize: string;
  fileSizeBytes: number;
  uploadedBy: string;
  uploadDate: string;
  expiryDate?: string;
  fileName: string;
}

type SortField = 'title' | 'propertyName' | 'category' | 'fileSize' | 'uploadDate' | 'expiryDate';
type SortDirection = 'asc' | 'desc';

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

const uploadDocTypes: { value: UploadDocumentType; label: string }[] = [
  { value: 'LEASE', label: 'Lease' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'ID', label: 'ID Document' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'TAX', label: 'Tax Document' },
  { value: 'OTHER', label: 'Other' },
];

const demoProperties = [
  { id: 'prop-001', name: 'Elounda Breeze Villa' },
  { id: 'prop-002', name: 'Heraklion Harbor Suite' },
  { id: 'prop-003', name: 'Chania Old Town Residence' },
  { id: 'prop-004', name: 'Rethymno Sunset Apartment' },
];

const demoOwners = [
  { id: 'owner-001', name: 'Sivan M.' },
  { id: 'owner-002', name: 'Elena K.' },
  { id: 'owner-003', name: 'Nikos D.' },
];

const demoDocuments: DocumentRecord[] = [
  {
    id: 'doc-001',
    title: 'Lease Agreement - Elounda Villa',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    category: 'CONTRACT',
    accessLevel: 'CONFIDENTIAL',
    fileSize: '2.4 MB',
    fileSizeBytes: 2516582,
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
    fileSizeBytes: 1887436,
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
    fileSizeBytes: 348160,
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
    fileSizeBytes: 573440,
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
    fileSizeBytes: 1258291,
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
    fileSizeBytes: 430080,
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
    fileSizeBytes: 8912896,
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
    fileSizeBytes: 184320,
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
    fileSizeBytes: 972800,
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
    fileSizeBytes: 225280,
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
  const [sortField, setSortField] = useState<SortField>('uploadDate');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const pageSize = 10;

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<UploadDocumentType>('OTHER');
  const [uploadProperty, setUploadProperty] = useState('');
  const [uploadOwner, setUploadOwner] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const properties = useMemo(() => {
    return Array.from(
      new Set(demoDocuments.map((d) => JSON.stringify({ id: d.propertyId, name: d.propertyName }))),
    ).map((s) => JSON.parse(s) as { id: string; name: string });
  }, []);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField],
  );

  const filtered = useMemo(() => {
    const result = demoDocuments.filter((d) => {
      if (search) {
        const q = search.toLowerCase();
        if (!d.title.toLowerCase().includes(q) && !d.fileName.toLowerCase().includes(q)) return false;
      }
      if (propertyFilter !== 'all' && d.propertyId !== propertyFilter) return false;
      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
      if (accessFilter !== 'all' && d.accessLevel !== accessFilter) return false;
      return true;
    });

    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'title':
          return dir * a.title.localeCompare(b.title);
        case 'propertyName':
          return dir * a.propertyName.localeCompare(b.propertyName);
        case 'category':
          return dir * a.category.localeCompare(b.category);
        case 'fileSize':
          return dir * (a.fileSizeBytes - b.fileSizeBytes);
        case 'uploadDate':
          return dir * a.uploadDate.localeCompare(b.uploadDate);
        case 'expiryDate': {
          const aDate = a.expiryDate || '';
          const bDate = b.expiryDate || '';
          return dir * aDate.localeCompare(bDate);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [search, propertyFilter, categoryFilter, accessFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const inputClass =
    'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  const modalInputClass =
    'w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  const resetUploadForm = () => {
    setUploadDocType('OTHER');
    setUploadProperty('');
    setUploadOwner('');
    setUploadTitle('');
    setSelectedFile(null);
    setDragOver(false);
  };

  const handleOpenUpload = () => {
    resetUploadForm();
    setShowUploadModal(true);
  };

  const handleCloseUpload = () => {
    setShowUploadModal(false);
    resetUploadForm();
  };

  const handleUploadSubmit = () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!uploadTitle.trim()) {
      toast.error('Please enter a document title');
      return;
    }
    setShowUploadModal(false);
    toast.success(`"${uploadTitle}" uploaded successfully`, {
      description: `${selectedFile.name} (${formatBytes(selectedFile.size)})`,
      icon: <CheckCircle className="w-4 h-4" />,
    });
    resetUploadForm();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      if (!uploadTitle.trim()) {
        setUploadTitle(files[0].name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      if (!uploadTitle.trim()) {
        setUploadTitle(files[0].name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-secondary" />
    ) : (
      <ArrowDown className="w-3 h-3 text-secondary" />
    );
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant cursor-pointer select-none hover:text-on-surface transition-colors"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        <SortIcon field={field} />
      </span>
    </th>
  );

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
          onClick={handleOpenUpload}
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
                <SortableHeader field="title">Title</SortableHeader>
                <SortableHeader field="propertyName">Property</SortableHeader>
                <SortableHeader field="category">{t('documents.category')}</SortableHeader>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t('documents.accessLevel')}
                </th>
                <SortableHeader field="fileSize">{t('documents.fileSize')}</SortableHeader>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Uploaded By
                </th>
                <SortableHeader field="uploadDate">Upload Date</SortableHeader>
                <SortableHeader field="expiryDate">Expiry</SortableHeader>
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

      {/* ── Upload Document Modal ─────────────────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto ambient-shadow">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Upload className="w-4.5 h-4.5 text-secondary" />
                </div>
                <h2 className="text-lg font-headline font-semibold text-on-surface">Upload Document</h2>
              </div>
              <button
                onClick={handleCloseUpload}
                className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-secondary bg-secondary/5'
                    : selectedFile
                      ? 'border-secondary/40 bg-secondary/5'
                      : 'border-outline-variant/30 hover:border-secondary/40 hover:bg-surface-container-low'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.csv"
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6 text-secondary" />
                    </div>
                    <p className="text-sm font-medium text-on-surface">{selectedFile.name}</p>
                    <p className="text-xs text-on-surface-variant">{formatBytes(selectedFile.size)}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-xs text-error hover:text-error/80 transition-colors"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center mx-auto">
                      <CloudUpload className="w-6 h-6 text-on-surface-variant" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">
                        Drop your file here, or{' '}
                        <span className="text-secondary">browse</span>
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        PDF, DOC, XLS, JPG, PNG, ZIP up to 50 MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Document Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Lease Agreement - Villa Elounda"
                  className={modalInputClass}
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Document Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {uploadDocTypes.map((dt) => (
                    <button
                      key={dt.value}
                      onClick={() => setUploadDocType(dt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        uploadDocType === dt.value
                          ? 'bg-secondary text-white'
                          : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {dt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property & Owner */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Linked Property
                  </label>
                  <select
                    value={uploadProperty}
                    onChange={(e) => setUploadProperty(e.target.value)}
                    className={modalInputClass}
                  >
                    <option value="">Select property...</option>
                    {demoProperties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Owner
                  </label>
                  <select
                    value={uploadOwner}
                    onChange={(e) => setUploadOwner(e.target.value)}
                    className={modalInputClass}
                  >
                    <option value="">Select owner...</option>
                    {demoOwners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleCloseUpload}
                  className="px-4 py-2.5 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={!selectedFile || !uploadTitle.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
