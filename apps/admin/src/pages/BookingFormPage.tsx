import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

interface BookingFormData {
  propertyId: string;
  unitId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  nightlyRate: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  currency: string;
  source: string;
  status: string;
  paymentStatus: string;
  specialRequests: string;
  internalNotes: string;
}

interface Property {
  id: string;
  name: string;
  basePrice: number;
  currency?: string;
  units?: { id: string; unitNumber: string; unitType?: string }[];
}

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export default function BookingFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>({
    defaultValues: {
      propertyId: '',
      unitId: '',
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      checkIn: '',
      checkOut: '',
      guestsCount: 2,
      adults: 2,
      children: 0,
      infants: 0,
      pets: 0,
      nightlyRate: 0,
      cleaningFee: 50,
      serviceFee: 30,
      taxes: 0,
      currency: 'EUR',
      source: 'DIRECT',
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
      specialRequests: '',
      internalNotes: '',
    },
  });

  // ---- Fetch existing booking for edit mode ----
  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const res = await apiClient.get(`/bookings/${id}`);
      return res.data.data ?? res.data;
    },
    enabled: isEdit,
  });

  // ---- Fetch properties for dropdown ----
  const { data: propertiesData } = useQuery({
    queryKey: ['properties-list'],
    queryFn: async () => {
      const res = await apiClient.get('/properties', { params: { pageSize: 200 } });
      return res.data;
    },
  });

  const properties: Property[] = propertiesData?.data ?? [];

  // ---- Fetch guests for autofill suggestions ----
  const { data: guestsData } = useQuery({
    queryKey: ['guests-list'],
    queryFn: async () => {
      const res = await apiClient.get('/guests', { params: { pageSize: 200 } });
      return res.data;
    },
  });

  const guests: Guest[] = guestsData?.data ?? [];

  // ---- Populate form when editing ----
  useEffect(() => {
    if (booking) {
      reset({
        propertyId: booking.propertyId ?? '',
        unitId: booking.unitId ?? '',
        guestName: booking.guestName ?? '',
        guestEmail: booking.guestEmail ?? '',
        guestPhone: booking.guestPhone ?? '',
        checkIn: booking.checkIn ? booking.checkIn.slice(0, 10) : '',
        checkOut: booking.checkOut ? booking.checkOut.slice(0, 10) : '',
        guestsCount: booking.guestsCount ?? 2,
        adults: booking.adults ?? 2,
        children: booking.children ?? 0,
        infants: booking.infants ?? 0,
        pets: booking.pets ?? 0,
        nightlyRate: booking.nightlyRate ?? 0,
        cleaningFee: booking.cleaningFee ?? 0,
        serviceFee: booking.serviceFee ?? 0,
        taxes: booking.taxes ?? 0,
        currency: booking.currency ?? 'EUR',
        source: booking.source ?? 'DIRECT',
        status: booking.status ?? 'CONFIRMED',
        paymentStatus: booking.paymentStatus ?? 'PENDING',
        specialRequests: booking.specialRequests ?? '',
        internalNotes: booking.internalNotes ?? '',
      });
    }
  }, [booking, reset]);

  const selectedPropertyId = watch('propertyId');
  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');
  const nightlyRate = watch('nightlyRate');
  const cleaningFee = watch('cleaningFee');
  const serviceFee = watch('serviceFee');
  const taxes = watch('taxes');

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const units = selectedProperty?.units ?? [];

  // Auto-fill nightly rate when property changes (only on create)
  useEffect(() => {
    if (selectedProperty && !isEdit) {
      setValue('nightlyRate', selectedProperty.basePrice);
    }
  }, [selectedPropertyId, selectedProperty, setValue, isEdit]);

  // Calculate nights and total
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  }, [checkIn, checkOut]);

  const total = useMemo(() => {
    return nightlyRate * nights + cleaningFee + serviceFee + taxes;
  }, [nightlyRate, nights, cleaningFee, serviceFee, taxes]);

  // ---- Create / Update mutation ----
  const mutation = useMutation({
    mutationFn: (data: BookingFormData) => {
      const adults = data.adults || 0;
      const children = data.children || 0;
      const infants = data.infants || 0;
      const payload = {
        ...data,
        guestsCount: adults + children + infants || data.guestsCount || 1,
        unitId: data.unitId || undefined,
      };
      if (isEdit) {
        return apiClient.put(`/bookings/${id}`, payload);
      }
      return apiClient.post('/bookings', payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Booking updated successfully' : 'Booking created successfully');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['booking', id] });
      }
      navigate('/bookings');
    },
    onError: () => {
      toast.error(isEdit ? 'Failed to update booking' : 'Failed to create booking');
    },
  });

  const onSubmit = (data: BookingFormData) => {
    mutation.mutate(data);
  };

  // ---- Auto-fill guest info from guest dropdown ----
  const handleGuestSelect = (guestId: string) => {
    const guest = guests.find((g) => g.id === guestId);
    if (guest) {
      setValue('guestName', `${guest.firstName} ${guest.lastName}`.trim());
      if (guest.email) setValue('guestEmail', guest.email);
      if (guest.phone) setValue('guestPhone', guest.phone);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all border border-outline-variant/30';
  const labelClass =
    'block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5';
  const errorClass = 'text-xs text-error mt-1';

  // Loading state for edit mode
  if (isEdit && bookingLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/bookings')}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
        </button>
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-0.5">
            {isEdit ? 'Edit Booking' : t('bookings.newBooking')}
          </p>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            {isEdit ? `Booking ${id?.slice(0, 14).toUpperCase()}` : 'Create New Booking'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Property & Unit */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">Property</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Property *</label>
              <select {...register('propertyId', { required: 'Property is required' })} className={inputClass}>
                <option value="">Select a property...</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {errors.propertyId && <p className={errorClass}>{errors.propertyId.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Unit (optional)</label>
              <select {...register('unitId')} className={inputClass} disabled={units.length === 0}>
                <option value="">{units.length === 0 ? 'No units available' : 'Select a unit...'}</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.unitNumber}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Guest */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">Guest Information</h3>

          {/* Guest quick-select */}
          {guests.length > 0 && (
            <div className="mb-4">
              <label className={labelClass}>Select Existing Guest</label>
              <select
                className={inputClass}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) handleGuestSelect(e.target.value);
                }}
              >
                <option value="">Fill from existing guest...</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.firstName} {g.lastName}{g.email ? ` (${g.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Guest Name *</label>
              <input
                {...register('guestName', { required: 'Guest name is required' })}
                className={inputClass}
                placeholder="Full name"
              />
              {errors.guestName && <p className={errorClass}>{errors.guestName.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input {...register('guestEmail')} type="email" className={inputClass} placeholder="email@example.com" />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input {...register('guestPhone')} className={inputClass} placeholder="+30 694..." />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">Dates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t('bookings.checkIn')} *</label>
              <input
                {...register('checkIn', { required: 'Check-in date is required' })}
                type="date"
                className={inputClass}
              />
              {errors.checkIn && <p className={errorClass}>{errors.checkIn.message}</p>}
            </div>
            <div>
              <label className={labelClass}>{t('bookings.checkOut')} *</label>
              <input
                {...register('checkOut', { required: 'Check-out date is required' })}
                type="date"
                className={inputClass}
              />
              {errors.checkOut && <p className={errorClass}>{errors.checkOut.message}</p>}
            </div>
            <div>
              <label className={labelClass}>{t('bookings.nights')}</label>
              <div className="px-4 py-2.5 rounded-lg bg-surface-container-low text-sm font-semibold text-on-surface">
                {nights}
              </div>
            </div>
          </div>
        </div>

        {/* Guests */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">Guests</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Adults</label>
              <input {...register('adults', { valueAsNumber: true })} type="number" min="1" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Children</label>
              <input {...register('children', { valueAsNumber: true })} type="number" min="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Infants</label>
              <input {...register('infants', { valueAsNumber: true })} type="number" min="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Pets</label>
              <input {...register('pets', { valueAsNumber: true })} type="number" min="0" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">Pricing</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Nightly Rate</label>
              <input {...register('nightlyRate', { valueAsNumber: true })} type="number" min="0" step="0.01" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Cleaning Fee</label>
              <input {...register('cleaningFee', { valueAsNumber: true })} type="number" min="0" step="0.01" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Service Fee</label>
              <input {...register('serviceFee', { valueAsNumber: true })} type="number" min="0" step="0.01" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Taxes</label>
              <input {...register('taxes', { valueAsNumber: true })} type="number" min="0" step="0.01" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <select {...register('currency')} className={inputClass}>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="ILS">ILS</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Total</label>
              <div className="px-4 py-2.5 rounded-lg bg-surface-container-low text-sm font-headline font-bold text-on-surface">
                {watch('currency') === 'EUR' ? '\u20AC' : '$'}{total.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Source, Status & Payment */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">Booking Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t('bookings.source')}</label>
              <select {...register('source')} className={inputClass}>
                <option value="DIRECT">Direct</option>
                <option value="AIRBNB">Airbnb</option>
                <option value="BOOKING_COM">Booking.com</option>
                <option value="VRBO">VRBO</option>
                <option value="MANUAL">Manual</option>
                <option value="WIDGET">Widget</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select {...register('status')} className={inputClass}>
                <option value="INQUIRY">Inquiry</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="CHECKED_OUT">Checked Out</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No Show</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('bookings.payment')}</label>
              <select {...register('paymentStatus')} className={inputClass}>
                <option value="PENDING">Pending</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
                <option value="REFUNDED">Refunded</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">Additional Information</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Special Requests</label>
              <textarea
                {...register('specialRequests')}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Guest special requests..."
              />
            </div>
            <div>
              <label className={labelClass}>Internal Notes</label>
              <textarea
                {...register('internalNotes')}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Internal notes (not visible to guest)..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
          >
            <X className="w-4 h-4" />
            <span>{t('common.cancel')}</span>
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-60"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{mutation.isPending ? t('common.loading') : t('common.save')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
