import { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

// ── Types matching API / Prisma ────────────────────────────────────────

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

type AccessLevel = 'PUBLIC' | 'OWNER_VISIBLE' | 'ADMIN_ONLY';

type UploadDocumentType = 'CONTRACT' | 'INVOICE' | 'LICENSE' | 'INSURANCE' | 'TAX' | 'ID_DOCUMENT' | 'OTHER';

interface DocumentRecord {
  id: string;
  title: string;
  propertyId: string | null;
  ownerId: string | null;
  bookingId: string | null;
  uploadedById: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category: DocumentCategory;
  tags: string[] | null;
  version: number;
  accessLevel: AccessLevel;
  expiresAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  property: { id: string; name: string; internalCode: string } | null;
  owner: {
    id: string;
    companyName: string | null;
    user: { firstName: string; lastName: string };
  } | null;
  uploadedBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface DocumentsResponse {
  success: boolean;
  data: DocumentRecord[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

interface PropertyOption {
  id: string;
  name: string;
}

interface OwnerOption {
  id: string;
  companyName: string | null;
  user: { firstName: string; lastName: string };
}

interface UploadedFile {
  key: string;
  url: string;
  size: number;
  originalName: string;
  mimeType: string;
}

type SortField = 'title' | 'category' | 'fileSize' | 'createdAt';
type SortDirection = 'asc' | 'desc';

// Maps SortField UI values to API sortBy parameter values
const sortFieldToApi: Record<SortField, string> = {
  title: 'title',
  category: 'category',
  fileSize: 'fileSize',
  createdAt: 'createdAt',
};

// ── Visual constants (unchanged) ───────────────────────────────────────

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
  OWNER_VISIBLE: 'bg-blue-500/10 text-blue-600',
  ADMIN_ONLY: 'bg-error/10 text-error',
};

const accessLabels: Record<AccessLevel, string> = {
  PUBLIC: 'Public',
  OWNER_VISIBLE: 'Owner Visible',
  ADMIN_ONLY: 'Admin Only',
};

const uploadDocTypes: { value: UploadDocumentType; label: string }[] = [
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'LICENSE', label: 'License' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'TAX', label: 'Tax Document' },
  { value: 'ID_DOCUMENT', label: 'ID Document' },
  { value: 'OTHER', label: 'Other' },
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

const accessLevels: AccessLevel[] = ['PUBLIC', 'OWNER_VISIBLE', 'ADMIN_ONLY'];

// ── Component ──────────────────────────────────────────────────────────

export default function DocumentsListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const pageSize = 10;

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<UploadDocumentType>('OTHER');
  const [uploadProperty, setUploadProperty] = useState('');
  const [uploadOwner, setUploadOwner] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAccessLevel, setUploadAccessLevel] = useState<AccessLevel>('OWNER_VISIBLE');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── API Queries ────────────────────────────────────────────────────

  const { data: docsResponse, isLoading } = useQuery<DocumentsResponse>({
    queryKey: [
      'documents',
      {
        search,
        propertyId: propertyFilter !== 'all' ? propertyFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        accessLevel: accessFilter !== 'all' ? accessFilter : undefined,
        page,
        limit: pageSize,
        sortBy: sortFieldToApi[sortField],
        sortOrder: sortDir,
      },
    ],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: pageSize };
      if (search) params.search = search;
      if (propertyFilter !== 'all') params.propertyId = propertyFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (accessFilter !== 'all') params.accessLevel = accessFilter;
      params.sortBy = sortFieldToApi[sortField];
      params.sortOrder = sortDir;
      const res = await apiClient.get('/documents', { params });
      return res.data;
    },
  });

  const documents = docsResponse?.data ?? [];
  const meta = docsResponse?.meta ?? { total: 0, page: 1, perPage: pageSize, totalPages: 1 };
  const totalPages = Math.max(1, meta.totalPages);

  // Properties list for filter + upload modal
  const { data: propertiesData } = useQuery<{ data: PropertyOption[] }>({
    queryKey: ['properties-list-mini'],
    queryFn: async () => {
      const res = await apiClient.get('/properties', { params: { pageSize: 200 } });
      return res.data;
    },
    staleTime: 60_000,
  });
  const properties: PropertyOption[] = (propertiesData?.data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
  }));

  // Owners list for upload modal
  const { data: ownersData } = useQuery<{ data: OwnerOption[] }>({
    queryKey: ['owners-list-mini'],
    queryFn: async () => {
      const res = await apiClient.get('/owners', { params: { pageSize: 200 } });
      return res.data;
    },
    staleTime: 60_000,
  });
  const owners: OwnerOption[] = ownersData?.data ?? [];

  // ── Delete mutation ────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/documents/${id}`),
    onSuccess: () => {
      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: () => {
      toast.error('Failed to delete document');
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  // ── Computed stats ────────────────────────────────────────────────

  // Stats are based on total counts from meta + what we can see on the current page.
  // For accurate global counts, we compute from the documents array where possible.
  const totalDocuments = meta.total;

  // ── Sort handler ──────────────────────────────────────────────────

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
      setPage(1);
    },
    [sortField],
  );

  // ── Upload helpers ────────────────────────────────────────────────

  const resetUploadForm = () => {
    setUploadDocType('OTHER');
    setUploadProperty('');
    setUploadOwner('');
    setUploadTitle('');
    setUploadAccessLevel('OWNER_VISIBLE');
    setSelectedFile(null);
    setDragOver(false);
    setIsUploading(false);
  };

  const handleOpenUpload = () => {
    resetUploadForm();
    setShowUploadModal(true);
  };

  const handleCloseUpload = () => {
    setShowUploadModal(false);
    resetUploadForm();
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!uploadTitle.trim()) {
      toast.error('Please enter a document title');
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Upload file to R2 via /uploads/documents
      const formData = new FormData();
      formData.append('files', selectedFile);

      const uploadRes = await apiClient.post<{ data: UploadedFile[] }>('/uploads/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploaded = uploadRes.data.data[0];

      // Step 2: Create document record in the database
      const docPayload: Record<string, unknown> = {
        title: uploadTitle.trim(),
        fileUrl: uploaded.url,
        fileSize: uploaded.size,
        mimeType: uploaded.mimeType,
        category: uploadDocType,
        accessLevel: uploadAccessLevel,
      };
      if (uploadProperty) docPayload.propertyId = uploadProperty;
      if (uploadOwner) docPayload.ownerId = uploadOwner;

      await apiClient.post('/documents', docPayload);

      // Success
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowUploadModal(false);
      toast.success(`"${uploadTitle}" uploaded successfully`, {
        description: `${selectedFile.name} (${formatBytes(selectedFile.size)})`,
        icon: <CheckCircle className="w-4 h-4" />,
      });
      resetUploadForm();
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || 'Upload failed';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (doc: DocumentRecord) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
    } else {
      toast.error('File URL not available');
    }
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

  const getUploaderName = (doc: DocumentRecord): string => {
    if (doc.uploadedBy) {
      return `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`.trim() || doc.uploadedBy.email;
    }
    return '-';
  };

  const getPropertyName = (doc: DocumentRecord): string => {
    return doc.property?.name ?? '-';
  };

  const getFileName = (doc: DocumentRecord): string => {
    // Extract filename from the fileUrl or use title
    if (doc.fileUrl) {
      const parts = doc.fileUrl.split('/');
      return parts[parts.length - 1] || doc.title;
    }
    return doc.title;
  };

  // ── Style constants ───────────────────────────────────────────────

  const inputClass =
    'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  const modalInputClass =
    'w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

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
          <p className="font-headline text-xl font-bold text-on-surface">
            {isLoading ? '-' : totalDocuments}
          </p>
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
            {isLoading ? '-' : documents.filter((d) => d.category === 'CONTRACT').length}
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
            {isLoading
              ? '-'
              : documents.filter((d) => {
                  if (!d.expiresAt) return false;
                  const exp = new Date(d.expiresAt);
                  const sixMonths = new Date();
                  sixMonths.setMonth(sixMonths.getMonth() + 6);
                  return exp <= sixMonths;
                }).length}
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Admin Only
            </p>
            <div className="w-7 h-7 rounded-lg bg-error/10 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-error" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">
            {isLoading ? '-' : documents.filter((d) => d.accessLevel === 'ADMIN_ONLY').length}
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
              {accessLabels[a]}
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
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Property
                </th>
                <SortableHeader field="category">{t('documents.category')}</SortableHeader>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t('documents.accessLevel')}
                </th>
                <SortableHeader field="fileSize">{t('documents.fileSize')}</SortableHeader>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Uploaded By
                </th>
                <SortableHeader field="createdAt">Upload Date</SortableHeader>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Expiry
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading documents...</span>
                    </div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-on-surface-variant">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-on-surface">{doc.title}</p>
                        <p className="text-xs text-on-surface-variant">{getFileName(doc)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-on-surface">{getPropertyName(doc)}</td>
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
                        {accessLabels[doc.accessLevel]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{formatBytes(doc.fileSize)}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{getUploaderName(doc)}</td>
                    <td className="px-4 py-3 text-on-surface whitespace-nowrap">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                      {doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleDownload(doc)}
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
                          onClick={() => handleDelete(doc.id, doc.title)}
                          disabled={deleteMutation.isPending}
                          className="flex items-center justify-center p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
                        PDF, DOC, XLS, JPG, PNG, ZIP up to 25 MB
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

              {/* Access Level */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Access Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {accessLevels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setUploadAccessLevel(level)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        uploadAccessLevel === level
                          ? 'bg-secondary text-white'
                          : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {accessLabels[level]}
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
                    {properties.map((p) => (
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
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.user
                          ? `${o.user.firstName} ${o.user.lastName}`.trim()
                          : o.companyName || o.id}
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
                  disabled={!selectedFile || !uploadTitle.trim() || isUploading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
