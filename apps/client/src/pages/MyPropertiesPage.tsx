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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api-client';

interface Property {
  id: string;
  name: string;
  type: string;
  status: string;
  address: string;
  city: string;
  country: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  maxGuests: number;
  basePrice: number;
  currency: string;
  rating: number | null;
  images: { url: string; isPrimary: boolean }[];
  _count?: { units: number; bookings: number };
}

// Demo data until API is connected
const demoProperties: Property[] = [
  {
    id: '1',
    name: 'Aegean Sunset Villa',
    type: 'VILLA',
    status: 'ACTIVE',
    address: 'Elounda Beach Road 42',
    city: 'Elounda',
    country: 'Greece',
    bedrooms: 4,
    bathrooms: 3,
    area: 220,
    maxGuests: 8,
    basePrice: 280,
    currency: 'EUR',
    rating: 4.9,
    images: [{ url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop', isPrimary: true }],
    _count: { units: 1, bookings: 24 },
  },
  {
    id: '2',
    name: 'Heraklion Harbor Suite',
    type: 'APARTMENT',
    status: 'ACTIVE',
    address: 'Venetian Harbor 15',
    city: 'Heraklion',
    country: 'Greece',
    bedrooms: 2,
    bathrooms: 1,
    area: 85,
    maxGuests: 4,
    basePrice: 150,
    currency: 'EUR',
    rating: 4.7,
    images: [{ url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop', isPrimary: true }],
    _count: { units: 1, bookings: 18 },
  },
  {
    id: '3',
    name: 'Chania Old Town Residence',
    type: 'HOUSE',
    status: 'ACTIVE',
    address: 'Theotokopoulou 8',
    city: 'Chania',
    country: 'Greece',
    bedrooms: 3,
    bathrooms: 2,
    area: 140,
    maxGuests: 6,
    basePrice: 200,
    currency: 'EUR',
    rating: 4.8,
    images: [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop', isPrimary: true }],
    _count: { units: 1, bookings: 31 },
  },
  {
    id: '4',
    name: 'Rethymno Beachfront Studio',
    type: 'STUDIO',
    status: 'UNDER_MAINTENANCE',
    address: 'Venizelou 22',
    city: 'Rethymno',
    country: 'Greece',
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    maxGuests: 2,
    basePrice: 90,
    currency: 'EUR',
    rating: 4.5,
    images: [{ url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop', isPrimary: true }],
    _count: { units: 1, bookings: 12 },
  },
];

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-success/10 text-success',
  INACTIVE: 'bg-on-surface-variant/10 text-on-surface-variant',
  UNDER_MAINTENANCE: 'bg-warning/10 text-warning',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  UNDER_MAINTENANCE: 'Maintenance',
};

export default function MyPropertiesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: properties } = useQuery({
    queryKey: ['my-properties'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/properties');
        return res.data.data as Property[];
      } catch {
        return demoProperties;
      }
    },
    initialData: demoProperties,
  });

  const totalRevenue = properties.reduce((sum, p) => sum + p.basePrice * 25, 0);
  const avgOccupancy = 85.4;
  const avgRating = properties.reduce((sum, p) => sum + (p.rating || 0), 0) / properties.length;

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
            placeholder={`${t('common.search')}...`}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
      </div>

      {/* Summary Cards */}
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

      {/* Property Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {properties.map((property) => {
          const image = property.images.find((i) => i.isPrimary) || property.images[0];
          return (
            <div
              key={property.id}
              className="bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow hover:shadow-ambient-lg transition-all cursor-pointer group"
              onClick={() => navigate(`/properties/${property.id}`)}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
                  <img
                    src={image?.url}
                    alt={property.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${statusColors[property.status]}`}>
                      {statusLabels[property.status]}
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
                    <div className="flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>{property.area}m{'\u00B2'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{property.maxGuests}</span>
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-container-high/50">
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Nightly Rate</p>
                      <p className="text-sm font-semibold text-on-surface">{'\u20AC'}{property.basePrice}/night</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Bookings</p>
                      <p className="text-sm font-semibold text-secondary">{property._count?.bookings || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Type</p>
                      <p className="text-sm font-medium text-on-surface capitalize">{property.type.toLowerCase()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
