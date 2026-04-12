import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  MapPin,
  Star,
  Calendar,
  TrendingUp,
  Bed,
  Bath,
  Maximize2,
  Users,
  ChevronRight,
  Search,
  AlertTriangle,
  RefreshCcw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/api-client';

interface Property {
  id: string;
  name: string;
  propertyType: string;
  status: string;
  addressLine1: string;
  city: string;
  country: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number | null;
  maxGuests: number;
  baseNightlyRate: number;
  currency: string;
  rating?: number | null;
  images?: { id: string; url: string; isPrimary: boolean }[];
  _count?: { units: number; bookings: number };
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-success/10 text-success',
  INACTIVE: 'bg-on-surface-variant/10 text-on-surface-variant',
  MAINTENANCE: 'bg-warning/10 text-warning',
  ONBOARDING: 'bg-secondary/10 text-secondary',
  ARCHIVED: 'bg-on-surface-variant/10 text-on-surface-variant',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  MAINTENANCE: 'Maintenance',
  ONBOARDING: 'Onboarding',
  ARCHIVED: 'Archived',
};

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow animate-pulse">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-48 h-48 sm:h-auto bg-surface-container-high flex-shrink-0" />
        <div className="flex-1 p-4 space-y-3">
          <div className="h-5 bg-surface-container-high rounded w-3/4" />
          <div className="h-3 bg-surface-container-high rounded w-1/2" />
          <div className="flex gap-4 mt-3">
            <div className="h-3 bg-surface-container-high rounded w-8" />
            <div className="h-3 bg-surface-container-high rounded w-8" />
            <div className="h-3 bg-surface-container-high rounded w-12" />
            <div className="h-3 bg-surface-container-high rounded w-8" />
          </div>
          <div className="flex justify-between mt-4 pt-3 border-t border-surface-container-high/50">
            <div className="h-4 bg-surface-container-high rounded w-20" />
            <div className="h-4 bg-surface-container-high rounded w-12" />
            <div className="h-4 bg-surface-container-high rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyPropertiesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: propertiesResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-properties'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/properties');
      return res.data.data as Property[];
    },
  });

  const properties = propertiesResponse ?? [];

  const filteredProperties = searchQuery.trim()
    ? properties.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.city.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : properties;

  const totalRevenue = properties.reduce((sum, p) => sum + (p.baseNightlyRate || 0) * 25, 0);
  const avgOccupancy = 85.4;
  const avgRating =
    properties.length > 0
      ? properties.reduce((sum, p) => sum + (p.rating || 0), 0) / properties.filter((p) => p.rating).length || 0
      : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            Portfolio
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            My Properties
          </h1>
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t('common.search')}...`}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="bg-error/5 border border-error/20 rounded-xl p-6 flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-error flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-on-surface">Failed to load properties</p>
            <p className="text-sm text-on-surface-variant mt-1">
              {(error as Error)?.message || 'An unexpected error occurred.'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error/10 text-error text-sm font-medium hover:bg-error/20 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-surface-container-high mb-2" />
              <div className="h-6 bg-surface-container-high rounded w-16 mb-1" />
              <div className="h-3 bg-surface-container-high rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <p className="font-headline text-xl font-bold text-on-surface">{properties.length}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Total Properties</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
            </div>
            <p className="font-headline text-xl font-bold text-on-surface">{'\u20AC'}{totalRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Est. Monthly Revenue</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-warning" />
              </div>
            </div>
            <p className="font-headline text-xl font-bold text-on-surface">{avgOccupancy}%</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Avg Occupancy</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Star className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <p className="font-headline text-xl font-bold text-on-surface">{avgRating.toFixed(1)}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Avg Rating</p>
          </div>
        </div>
      )}

      {/* Property Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProperties.map((property) => {
            const image = property.images?.find((i) => i.isPrimary) || property.images?.[0];
            const displayType = property.propertyType || 'PROPERTY';
            return (
              <div
                key={property.id}
                className="bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow hover:shadow-ambient-lg transition-all cursor-pointer group"
                onClick={() => navigate(`/properties/${property.id}`)}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
                    {image?.url ? (
                      <img
                        src={image.url}
                        alt={property.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-on-surface-variant/30" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${statusColors[property.status] || statusColors.ACTIVE}`}>
                        {statusLabels[property.status] || property.status}
                      </span>
                    </div>
                    {property.rating && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg glass-card text-xs font-semibold">
                        <Star className="w-3 h-3 text-warning fill-warning" />
                        <span>{property.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-headline font-semibold text-on-surface text-lg">{property.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{property.city}, {property.country}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Specs */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-on-surface-variant">
                      <div className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5" />
                        <span>{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5" />
                        <span>{property.bathrooms}</span>
                      </div>
                      {property.areaSqm && (
                        <div className="flex items-center gap-1">
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>{property.areaSqm}m{'\u00B2'}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{property.maxGuests}</span>
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-container-high/50">
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Nightly Rate</p>
                        <p className="text-sm font-semibold text-on-surface">{'\u20AC'}{property.baseNightlyRate}/night</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Bookings</p>
                        <p className="text-sm font-semibold text-secondary">{property._count?.bookings || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Type</p>
                        <p className="text-sm font-medium text-on-surface capitalize">{displayType.toLowerCase()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !isError && filteredProperties.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
          <Building2 className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
          <p className="text-on-surface-variant font-medium">
            {searchQuery ? 'No properties match your search' : 'No properties found'}
          </p>
        </div>
      )}
    </div>
  );
}
