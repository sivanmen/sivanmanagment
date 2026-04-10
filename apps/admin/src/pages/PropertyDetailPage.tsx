import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MapPin,
  Star,
  Bed,
  Bath,
  Maximize,
  Users,
  Building2,
  DollarSign,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Home,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

interface PropertyDetail {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance';
  bedrooms: number;
  bathrooms: number;
  area: number;
  maxGuests: number;
  amenities: string[];
  description: string;
  basePrice: number;
  currency: string;
  rating: number;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  units: Unit[];
  images: string[];
  customFields?: Record<string, string>;
}

interface Unit {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'maintenance';
  basePrice: number;
  bedrooms: number;
}

const statusStyles = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-outline-variant/20 text-on-surface-variant',
  maintenance: 'bg-warning/10 text-warning',
};

const unitStatusStyles = {
  available: 'bg-success/10 text-success',
  occupied: 'bg-secondary/10 text-secondary',
  maintenance: 'bg-warning/10 text-warning',
};

const placeholderImages = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop',
];

const revenueData = [
  { month: 'Jan', revenue: 12400, expenses: 3200 },
  { month: 'Feb', revenue: 14200, expenses: 3800 },
  { month: 'Mar', revenue: 13800, expenses: 2900 },
  { month: 'Apr', revenue: 16500, expenses: 4200 },
  { month: 'May', revenue: 18200, expenses: 3600 },
  { month: 'Jun', revenue: 22800, expenses: 4800 },
  { month: 'Jul', revenue: 26400, expenses: 5200 },
  { month: 'Aug', revenue: 28900, expenses: 5800 },
  { month: 'Sep', revenue: 24200, expenses: 4100 },
  { month: 'Oct', revenue: 19800, expenses: 3900 },
  { month: 'Nov', revenue: 15600, expenses: 3400 },
  { month: 'Dec', revenue: 17200, expenses: 3700 },
];

const expenseBreakdown = [
  { name: 'Maintenance', value: 35, color: '#6b38d4' },
  { name: 'Utilities', value: 25, color: '#2e7d32' },
  { name: 'Cleaning', value: 20, color: '#ed6c02' },
  { name: 'Insurance', value: 12, color: '#ba1a1a' },
  { name: 'Other', value: 8, color: '#77767d' },
];

type TabKey = 'overview' | 'units' | 'financial' | 'calendar' | 'documents';

export default function PropertyDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [currentImage, setCurrentImage] = useState(0);

  const { data: property, isLoading } = useQuery<PropertyDetail>({
    queryKey: ['property', id],
    queryFn: async () => {
      const res = await apiClient.get(`/properties/${id}`);
      return res.data.data ?? res.data;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/properties/${id}`),
    onSuccess: () => {
      toast.success(t('properties.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      navigate('/properties');
    },
    onError: () => {
      toast.error(t('properties.deleteError'));
    },
  });

  const handleDelete = () => {
    if (property && window.confirm(t('properties.confirmDelete', { name: property.name }))) {
      deleteMutation.mutate();
    }
  };

  const images = property?.images?.length ? property.images : placeholderImages;

  const tabs: { key: TabKey; label: string; icon: typeof Building2 }[] = [
    { key: 'overview', label: t('properties.tabOverview'), icon: Home },
    { key: 'units', label: t('properties.tabUnits'), icon: Building2 },
    { key: 'financial', label: t('properties.tabFinancial'), icon: DollarSign },
    { key: 'calendar', label: t('properties.tabCalendar'), icon: Calendar },
    { key: 'documents', label: t('properties.tabDocuments'), icon: FileText },
  ];

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="h-8 bg-surface-container-high rounded w-48 animate-pulse" />
        <div className="h-64 bg-surface-container-high rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-48 bg-surface-container-high rounded-xl animate-pulse" />
          <div className="h-48 bg-surface-container-high rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-4 lg:p-6 text-center">
        <p className="text-on-surface-variant">{t('properties.notFound')}</p>
        <Link to="/properties" className="text-secondary font-medium text-sm mt-2 inline-block">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/properties')}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
          </button>
          <div>
            <h1 className="font-headline text-2xl font-bold text-on-surface">{property.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                <MapPin className="w-3 h-3" />
                <span>
                  {property.address}, {property.city}
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyles[property.status]}`}
              >
                {t(`properties.status${property.status.charAt(0).toUpperCase() + property.status.slice(1)}`)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/properties/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
          >
            <Pencil className="w-4 h-4" />
            <span>{t('common.edit')}</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-error bg-error/5 hover:bg-error/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('common.delete')}</span>
          </button>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="relative rounded-xl overflow-hidden ambient-shadow">
        <img
          src={images[currentImage]}
          alt={property.name}
          className="w-full h-64 sm:h-80 lg:h-96 object-cover"
        />
        <div className="absolute top-3 end-3 flex items-center gap-1 px-2.5 py-1 rounded-lg glass-card text-sm font-semibold">
          <Star className="w-4 h-4 text-warning fill-warning" />
          <span>{property.rating?.toFixed(1) ?? 'N/A'}</span>
        </div>
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImage((i) => (i === 0 ? images.length - 1 : i - 1))}
              className="absolute start-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass-card flex items-center justify-center hover:bg-white/80 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-on-surface" />
            </button>
            <button
              onClick={() => setCurrentImage((i) => (i === images.length - 1 ? 0 : i + 1))}
              className="absolute end-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass-card flex items-center justify-center hover:bg-white/80 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-on-surface" />
            </button>
            <div className="absolute bottom-3 start-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentImage ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface-container-lowest rounded-xl ambient-shadow overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'gradient-accent text-white'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Property Details */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
              {t('properties.propertyDetails')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low">
                <Bed className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                    {t('properties.bedrooms')}
                  </p>
                  <p className="text-sm font-semibold text-on-surface">{property.bedrooms}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low">
                <Bath className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                    {t('properties.bathrooms')}
                  </p>
                  <p className="text-sm font-semibold text-on-surface">{property.bathrooms}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low">
                <Maximize className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                    {t('properties.area')}
                  </p>
                  <p className="text-sm font-semibold text-on-surface">{property.area} m²</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low">
                <Users className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                    {t('properties.maxGuests')}
                  </p>
                  <p className="text-sm font-semibold text-on-surface">{property.maxGuests}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-on-surface mb-2">
                  {t('properties.description')}
                </h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-on-surface mb-2">
                  {t('properties.amenities')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary-fixed text-secondary"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Address Info */}
            <div>
              <h4 className="text-sm font-semibold text-on-surface mb-2">
                {t('properties.location')}
              </h4>
              <div className="flex items-start gap-2 text-sm text-on-surface-variant">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {property.address}, {property.city}, {property.country}
                </span>
              </div>
            </div>

            {/* Custom Fields */}
            {property.customFields && Object.keys(property.customFields).length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-on-surface mb-2">
                  {t('properties.customFields')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(property.customFields).map(([key, value]) => (
                    <div key={key} className="p-3 rounded-lg bg-surface-container-low">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                        {key}
                      </p>
                      <p className="text-sm font-medium text-on-surface">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Owner Info Card */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
              {t('properties.ownerInfo')}
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center text-white font-headline font-bold text-lg">
                {property.owner.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-on-surface">{property.owner.name}</p>
                <p className="text-xs text-on-surface-variant">{property.owner.email}</p>
              </div>
            </div>
            {property.owner.phone && (
              <p className="text-sm text-on-surface-variant mb-4">{property.owner.phone}</p>
            )}
            <Link
              to={`/owners/${property.owner.id}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
            >
              {t('properties.viewOwner')}
            </Link>

            {/* Quick Pricing */}
            <div className="mt-6 p-4 rounded-lg bg-surface-container-low">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                {t('properties.basePrice')}
              </p>
              <p className="font-headline text-2xl font-bold text-on-surface">
                {property.currency} {property.basePrice?.toLocaleString()}
                <span className="text-sm font-normal text-on-surface-variant">
                  /{t('properties.perNight')}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'units' && (
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('properties.tabUnits')}
            </h3>
            <span className="text-sm text-on-surface-variant">
              {property.units?.length ?? 0} {t('properties.units')}
            </span>
          </div>
          {property.units && property.units.length > 0 ? (
            <div className="space-y-3">
              {property.units.map((unit) => (
                <div
                  key={unit.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface text-sm">{unit.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {unit.bedrooms} {t('properties.bedrooms')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${unitStatusStyles[unit.status]}`}
                    >
                      {t(`properties.unitStatus${unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}`)}
                    </span>
                    <p className="text-sm font-semibold text-on-surface">
                      ${unit.basePrice}/
                      <span className="text-xs font-normal text-on-surface-variant">
                        {t('properties.perNight')}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-on-surface-variant">
              {t('properties.noUnits')}
            </div>
          )}
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-lg font-semibold text-on-surface">
                {t('properties.revenueVsExpenses')}
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-secondary" />
                  <span className="text-on-surface-variant">{t('properties.revenue')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-error" />
                  <span className="text-on-surface-variant">{t('properties.expenses')}</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#46464c' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#46464c' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(20px)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0px 24px 48px rgba(25,28,29,0.06)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Bar dataKey="revenue" fill="#6b38d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ba1a1a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
              {t('properties.expenseBreakdown')}
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(20px)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0px 24px 48px rgba(25,28,29,0.06)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {expenseBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-on-surface-variant">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-on-surface">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow text-center py-16">
          <Calendar className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-4" />
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-1">
            {t('properties.calendarComingSoon')}
          </h3>
          <p className="text-sm text-on-surface-variant">
            {t('properties.calendarDescription')}
          </p>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow text-center py-16">
          <FileText className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-4" />
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-1">
            {t('properties.documentsComingSoon')}
          </h3>
          <p className="text-sm text-on-surface-variant">
            {t('properties.documentsDescription')}
          </p>
        </div>
      )}
    </div>
  );
}
