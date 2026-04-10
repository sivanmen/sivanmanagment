import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  Star,
  Percent,
  DollarSign,
  TrendingUp,
  Users,
  Globe,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import apiClient from '../lib/api-client';

interface OwnerDetail {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  address?: string;
  taxId?: string;
  status: 'active' | 'inactive';
  managementFee: number;
  minimumMonthlyFee?: number;
  properties: OwnerProperty[];
  financialSummary: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    managementFees: number;
  };
}

interface OwnerProperty {
  id: string;
  name: string;
  city: string;
  country: string;
  status: 'active' | 'inactive' | 'maintenance';
  occupancyRate: number;
  monthlyRevenue: number;
  rating: number;
  image?: string;
}

const statusStyles = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-outline-variant/20 text-on-surface-variant',
  maintenance: 'bg-warning/10 text-warning',
};

const placeholderImages = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
];

const monthlyRevenueData = [
  { month: 'Jan', revenue: 28000 },
  { month: 'Feb', revenue: 32000 },
  { month: 'Mar', revenue: 29500 },
  { month: 'Apr', revenue: 35000 },
  { month: 'May', revenue: 38000 },
  { month: 'Jun', revenue: 42000 },
  { month: 'Jul', revenue: 48000 },
  { month: 'Aug', revenue: 52000 },
  { month: 'Sep', revenue: 44000 },
  { month: 'Oct', revenue: 36000 },
  { month: 'Nov', revenue: 31000 },
  { month: 'Dec', revenue: 34000 },
];

export default function OwnerDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: owner, isLoading } = useQuery<OwnerDetail>({
    queryKey: ['owner', id],
    queryFn: async () => {
      const res = await apiClient.get(`/owners/${id}`);
      return res.data.data ?? res.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="h-8 bg-surface-container-high rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-64 bg-surface-container-high rounded-xl animate-pulse" />
          <div className="lg:col-span-2 h-64 bg-surface-container-high rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="p-4 lg:p-6 text-center">
        <p className="text-on-surface-variant">{t('owners.notFound')}</p>
        <Link to="/owners" className="text-secondary font-medium text-sm mt-2 inline-block">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  const financialCards = [
    {
      label: t('owners.totalRevenue'),
      value: `$${(owner.financialSummary?.totalRevenue ?? 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
    {
      label: t('owners.totalExpenses'),
      value: `$${(owner.financialSummary?.totalExpenses ?? 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-error/10',
      iconColor: 'text-error',
    },
    {
      label: t('owners.netIncome'),
      value: `$${(owner.financialSummary?.netIncome ?? 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      label: t('owners.managementFeesEarned'),
      value: `$${(owner.financialSummary?.managementFees ?? 0).toLocaleString()}`,
      icon: Percent,
      color: 'bg-warning/10',
      iconColor: 'text-warning',
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/owners')}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
        </button>
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-0.5">
            {t('owners.ownerDetail')}
          </p>
          <h1 className="font-headline text-2xl font-bold text-on-surface">{owner.name}</h1>
        </div>
      </div>

      {/* Owner Info + Fee Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Owner Info Card */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center text-white font-headline font-bold text-2xl">
              {owner.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold text-on-surface">{owner.name}</h2>
              {owner.company && (
                <p className="text-sm text-on-surface-variant">{owner.company}</p>
              )}
              <span
                className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyles[owner.status]}`}
              >
                {t(`owners.status${owner.status.charAt(0).toUpperCase() + owner.status.slice(1)}`)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span>{owner.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{owner.phone}</span>
            </div>
            {owner.address && (
              <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                <Globe className="w-4 h-4 flex-shrink-0" />
                <span>{owner.address}</span>
              </div>
            )}
            {owner.taxId && (
              <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span>
                  {t('owners.taxId')}: {owner.taxId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Fee Configuration */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
            {t('owners.feeConfiguration')}
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-surface-container-low">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                {t('owners.managementFee')}
              </p>
              <p className="font-headline text-3xl font-bold text-on-surface">
                {owner.managementFee}
                <span className="text-lg text-on-surface-variant">%</span>
              </p>
            </div>
            {owner.minimumMonthlyFee !== undefined && (
              <div className="p-4 rounded-lg bg-surface-container-low">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  {t('owners.minimumMonthlyFee')}
                </p>
                <p className="font-headline text-2xl font-bold text-on-surface">
                  ${owner.minimumMonthlyFee.toLocaleString()}
                  <span className="text-sm font-normal text-on-surface-variant">
                    /{t('owners.month')}
                  </span>
                </p>
              </div>
            )}
            <div className="p-4 rounded-lg bg-surface-container-low">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                {t('owners.propertiesManaged')}
              </p>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-secondary" />
                <p className="font-headline text-2xl font-bold text-on-surface">
                  {owner.properties?.length ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
            {t('owners.financialSummary')}
          </h3>
          <div className="space-y-3">
            {financialCards.map((card) => (
              <div
                key={card.label}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center`}
                  >
                    <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                  <p className="text-xs text-on-surface-variant">{card.label}</p>
                </div>
                <p className="text-sm font-bold text-on-surface">{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <h3 className="font-headline text-lg font-semibold text-on-surface mb-6">
          {t('owners.monthlyRevenue')}
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyRevenueData} barCategoryGap="20%">
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
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Properties Owned */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg font-semibold text-on-surface">
            {t('owners.propertiesOwned')}
          </h3>
          <span className="text-sm text-on-surface-variant">
            {owner.properties?.length ?? 0} {t('owners.properties')}
          </span>
        </div>

        {owner.properties && owner.properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {owner.properties.map((property, index) => (
              <Link
                key={property.id}
                to={`/properties/${property.id}`}
                className="bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow hover:shadow-ambient-lg transition-all group"
              >
                {/* Image */}
                <div className="relative h-36 overflow-hidden">
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
                    className={`absolute top-3 start-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyles[property.status]}`}
                  >
                    {t(`properties.status${property.status.charAt(0).toUpperCase() + property.status.slice(1)}`)}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h4 className="font-headline font-semibold text-on-surface mb-1">
                    {property.name}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-3">
                    <MapPin className="w-3 h-3" />
                    <span>
                      {property.city}, {property.country}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                        {t('properties.revenue')}
                      </p>
                      <p className="text-sm font-semibold text-on-surface">
                        ${(property.monthlyRevenue / 1000).toFixed(1)}k/mo
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                        {t('properties.occupancy')}
                      </p>
                      <p className="text-sm font-semibold text-success">
                        {property.occupancyRate}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-accent transition-all duration-500"
                      style={{ width: `${property.occupancyRate}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow text-center">
            <Building2 className="w-10 h-10 mx-auto text-on-surface-variant/40 mb-3" />
            <p className="text-sm text-on-surface-variant">{t('owners.noProperties')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
