import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

const propertySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['apartment', 'house', 'hotel', 'commercial']),
  status: z.enum(['active', 'inactive', 'maintenance']),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  area: z.coerce.number().min(0),
  maxGuests: z.coerce.number().int().min(1),
  basePrice: z.coerce.number().min(0),
  currency: z.string().min(1),
  ownerId: z.string().min(1, 'Owner is required'),
  description: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface Owner {
  id: string;
  name: string;
  company?: string;
}

export default function PropertyFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      type: 'apartment',
      status: 'active',
      currency: 'EUR',
      bedrooms: 1,
      bathrooms: 1,
      area: 50,
      maxGuests: 2,
      basePrice: 100,
    },
  });

  // Fetch property for editing
  const { data: property } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const res = await apiClient.get(`/properties/${id}`);
      return res.data.data ?? res.data;
    },
    enabled: isEdit,
  });

  // Fetch owners for dropdown
  const { data: ownersData } = useQuery<{ data: Owner[] }>({
    queryKey: ['owners-list'],
    queryFn: async () => {
      const res = await apiClient.get('/owners', { params: { pageSize: 100 } });
      return res.data;
    },
  });

  const owners = ownersData?.data ?? [];

  // Populate form with existing property data
  useEffect(() => {
    if (property) {
      reset({
        name: property.name,
        type: property.type,
        status: property.status,
        address: property.address,
        city: property.city,
        country: property.country,
        latitude: property.latitude,
        longitude: property.longitude,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        maxGuests: property.maxGuests,
        basePrice: property.basePrice,
        currency: property.currency,
        ownerId: property.owner?.id ?? property.ownerId,
        description: property.description,
      });
    }
  }, [property, reset]);

  const mutation = useMutation({
    mutationFn: (data: PropertyFormData) => {
      if (isEdit) {
        return apiClient.put(`/properties/${id}`, data);
      }
      return apiClient.post('/properties', data);
    },
    onSuccess: () => {
      toast.success(isEdit ? t('properties.updateSuccess') : t('properties.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['property', id] });
      }
      navigate('/properties');
    },
    onError: () => {
      toast.error(isEdit ? t('properties.updateError') : t('properties.createError'));
    },
  });

  const onSubmit = (data: PropertyFormData) => {
    mutation.mutate(data);
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all border border-outline-variant/30';
  const labelClass =
    'block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5';
  const errorClass = 'text-xs text-error mt-1';

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/properties')}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
        </button>
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-0.5">
            {isEdit ? t('properties.editProperty') : t('properties.newProperty')}
          </p>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            {isEdit ? property?.name ?? '...' : t('properties.createProperty')}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
            {t('properties.basicInfo')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className={labelClass}>{t('properties.propertyName')}</label>
              <input
                {...register('name')}
                className={inputClass}
                placeholder={t('properties.propertyNamePlaceholder')}
              />
              {errors.name && <p className={errorClass}>{errors.name.message}</p>}
            </div>
            <div>
              <label className={labelClass}>{t('properties.propertyType')}</label>
              <select {...register('type')} className={inputClass}>
                <option value="apartment">{t('properties.typeApartment')}</option>
                <option value="house">{t('properties.typeHouse')}</option>
                <option value="hotel">{t('properties.typeHotel')}</option>
                <option value="commercial">{t('properties.typeCommercial')}</option>
              </select>
              {errors.type && <p className={errorClass}>{errors.type.message}</p>}
            </div>
            <div>
              <label className={labelClass}>{t('properties.status')}</label>
              <select {...register('status')} className={inputClass}>
                <option value="active">{t('properties.statusActive')}</option>
                <option value="inactive">{t('properties.statusInactive')}</option>
                <option value="maintenance">{t('properties.statusMaintenance')}</option>
              </select>
              {errors.status && <p className={errorClass}>{errors.status.message}</p>}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
            {t('properties.location')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass}>{t('properties.address')}</label>
              <input
                {...register('address')}
                className={inputClass}
                placeholder={t('properties.addressPlaceholder')}
              />
              {errors.address && <p className={errorClass}>{errors.address.message}</p>}
            </div>
            <div>
              <label className={labelClass}>{t('properties.city')}</label>
              <input
                {...register('city')}
                className={inputClass}
                placeholder={t('properties.cityPlaceholder')}
              />
              {errors.city && <p className={errorClass}>{errors.city.message}</p>}
            </div>
            <div>
              <label className={labelClass}>{t('properties.country')}</label>
              <input
                {...register('country')}
                className={inputClass}
                placeholder={t('properties.countryPlaceholder')}
              />
              {errors.country && <p className={errorClass}>{errors.country.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('properties.latitude')}</label>
                <input
                  {...register('latitude')}
                  type="number"
                  step="any"
                  className={inputClass}
                  placeholder="37.9838"
                />
              </div>
              <div>
                <label className={labelClass}>{t('properties.longitude')}</label>
                <input
                  {...register('longitude')}
                  type="number"
                  step="any"
                  className={inputClass}
                  placeholder="23.7275"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
            {t('properties.details')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>{t('properties.bedrooms')}</label>
              <input {...register('bedrooms')} type="number" min="0" className={inputClass} />
              {errors.bedrooms && <p className={errorClass}>{errors.bedrooms.message}</p>}
            </div>
            <div>
              <label className={labelClass}>{t('properties.bathrooms')}</label>
              <input {...register('bathrooms')} type="number" min="0" className={inputClass} />
              {errors.bathrooms && <p className={errorClass}>{errors.bathrooms.message}</p>}
            </div>
            <div>
              <label className={labelClass}>{t('properties.area')} (m²)</label>
              <input {...register('area')} type="number" min="0" className={inputClass} />
              {errors.area && <p className={errorClass}>{errors.area.message}</p>}
            </div>
            <div>
              <label className={labelClass}>{t('properties.maxGuests')}</label>
              <input {...register('maxGuests')} type="number" min="1" className={inputClass} />
              {errors.maxGuests && <p className={errorClass}>{errors.maxGuests.message}</p>}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
            {t('properties.pricing')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('properties.basePrice')}</label>
              <input {...register('basePrice')} type="number" min="0" step="0.01" className={inputClass} />
              {errors.basePrice && <p className={errorClass}>{errors.basePrice.message}</p>}
            </div>
            <div>
              <label className={labelClass}>{t('properties.currency')}</label>
              <select {...register('currency')} className={inputClass}>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="ILS">ILS</option>
              </select>
              {errors.currency && <p className={errorClass}>{errors.currency.message}</p>}
            </div>
          </div>
        </div>

        {/* Owner Assignment */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
            {t('properties.ownerAssignment')}
          </h3>
          <div>
            <label className={labelClass}>{t('properties.selectOwner')}</label>
            <select {...register('ownerId')} className={inputClass}>
              <option value="">{t('properties.selectOwnerPlaceholder')}</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                  {owner.company ? ` (${owner.company})` : ''}
                </option>
              ))}
            </select>
            {errors.ownerId && <p className={errorClass}>{errors.ownerId.message}</p>}
          </div>
        </div>

        {/* Description */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
            {t('properties.description')}
          </h3>
          <div>
            <label className={labelClass}>{t('properties.propertyDescription')}</label>
            <textarea
              {...register('description')}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder={t('properties.descriptionPlaceholder')}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/properties')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
          >
            <X className="w-4 h-4" />
            <span>{t('common.cancel')}</span>
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? t('common.loading') : t('common.save')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
