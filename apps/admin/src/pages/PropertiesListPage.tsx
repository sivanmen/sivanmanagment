import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  MapPin,
  Star,
  Building2,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  Home,
  Hotel,
  Warehouse,
  LayoutGrid,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance';
  unitsCount: number;
  occupancyRate: number;
  monthlyRevenue: number;
  rating: number;
  ownerName: string;
  image?: string;
}

interface PropertiesResponse {
  data: Property[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

const placeholderImages = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
];

const statusStyles = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-outline-variant/20 text-on-surface-variant',
  maintenance: 'bg-warning/10 text-warning',
};

const propertyTypeIcons: Record<string, typeof Home> = {
  apartment: Building2,
  house: Home,
  hotel: Hotel,
  commercial: Warehouse,
};

export default function PropertiesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const { data, isLoading } = useQuery<PropertiesResponse>({
    queryKey: ['properties', { search, status: statusFilter, type: typeFilter, page, pageSize }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, pageSize };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      const res = await apiClient.get('/properties', { params });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/properties/${id}`),
    onSuccess: () => {
      toast.success(t('properties.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
    onError: () => {
      toast.error(t('properties.deleteError'));
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(t('properties.confirmDelete', { name }))) {
      deleteMutation.mutate(id);
    }
  };

  const properties = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, pageSize, totalPages: 1 };

  // Compute stats from current data set
  const totalProperties = meta.total;
  const activeCount = properties.filter((p) => p.status === 'active').length;
  const avgOccupancy =
    properties.length > 0
      ? (properties.reduce((sum, p) => sum + p.occupancyRate, 0) / properties.length).toFixed(1)
      : '0';
  const avgRating =
    properties.length > 0
      ? (properties.reduce((sum, p) => sum + p.rating, 0) / properties.length).toFixed(1)
      : '0';

  const stats = [
    {
      label: t('properties.totalProperties'),
      value: totalProperties,
      icon: Building2,
      color: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
    {
      label: t('properties.activeProperties'),
      value: activeCount,
      icon: TrendingUp,
      color: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      label: t('properties.occupancyRate'),
      value: `${avgOccupancy}%`,
      icon: Users,
      color: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    {
      label: t('properties.avgRating'),
      value: avgRating,
      icon: Star,
      color: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('properties.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('properties.title')}
          </h1>
        </div>
        <Link
          to="/properties/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('properties.addProperty')}</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder={t('properties.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        >
          <option value="all">{t('properties.allStatuses')}</option>
          <option value="active">{t('properties.statusActive')}</option>
          <option value="inactive">{t('properties.statusInactive')}</option>
          <option value="maintenance">{t('properties.statusMaintenance')}</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        >
          <option value="all">{t('properties.allTypes')}</option>
          <option value="apartment">{t('properties.typeApartment')}</option>
          <option value="house">{t('properties.typeHouse')}</option>
          <option value="hotel">{t('properties.typeHotel')}</option>
          <option value="commercial">{t('properties.typeCommercial')}</option>
        </select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                {stat.label}
              </p>
              <div
                className={`w-7 h-7 rounded-lg ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="font-headline text-xl font-bold text-on-surface">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow animate-pulse"
            >
              <div className="h-40 bg-surface-container-high" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-surface-container-high rounded w-3/4" />
                <div className="h-3 bg-surface-container-high rounded w-1/2" />
                <div className="h-3 bg-surface-container-high rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
          <LayoutGrid className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-4" />
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-1">
            {t('properties.emptyTitle')}
          </h3>
          <p className="text-sm text-on-surface-variant mb-6">
            {t('properties.emptyDescription')}
          </p>
          <Link
            to="/properties/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('properties.addProperty')}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property, index) => {
            const TypeIcon = propertyTypeIcons[property.type] ?? Building2;
            return (
              <div
                key={property.id}
                className="bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow hover:shadow-ambient-lg transition-all group"
              >
                {/* Image */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={property.image || placeholderImages[index % placeholderImages.length]}
                    alt={property.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 end-3 flex items-center gap-1 px-2 py-1 rounded-lg glass-card text-xs font-semibold">
                    <Star className="w-3 h-3 text-warning fill-warning" />
                    <span>{property.rating.toFixed(1)}</span>
                  </div>
                  <span
                    className={`absolute top-3 start-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyles[property.status]}`}
                  >
                    {t(`properties.status${property.status.charAt(0).toUpperCase() + property.status.slice(1)}`)}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-headline font-semibold text-on-surface leading-tight">
                      {property.name}
                    </h4>
                    <TypeIcon className="w-4 h-4 text-on-surface-variant flex-shrink-0 ms-2" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-3">
                    <MapPin className="w-3 h-3" />
                    <span>
                      {property.city}, {property.country}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                        {t('properties.units')}
                      </p>
                      <p className="text-sm font-semibold text-on-surface">
                        {property.unitsCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                        {t('properties.occupancy')}
                      </p>
                      <p className="text-sm font-semibold text-success">
                        {property.occupancyRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                        {t('properties.revenue')}
                      </p>
                      <p className="text-sm font-semibold text-on-surface">
                        ${(property.monthlyRevenue / 1000).toFixed(1)}k
                      </p>
                    </div>
                  </div>

                  {/* Owner */}
                  <p className="text-xs text-on-surface-variant mb-3">
                    <span className="font-medium">{t('properties.owner')}:</span>{' '}
                    {property.ownerName}
                  </p>

                  {/* Occupancy bar */}
                  <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden mb-4">
                    <div
                      className="h-full rounded-full gradient-accent transition-all duration-500"
                      style={{ width: `${property.occupancyRate}%` }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/properties/${property.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t('common.view')}
                    </button>
                    <button
                      onClick={() => navigate(`/properties/${property.id}/edit`)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(property.id, property.name)}
                      className="flex items-center justify-center p-2 rounded-lg text-error/70 bg-surface-container-low hover:bg-error/10 hover:text-error transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
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
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
