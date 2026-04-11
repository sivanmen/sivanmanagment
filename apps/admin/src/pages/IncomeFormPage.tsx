import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const incomeSchema = z.object({
  type: z.enum(['booking', 'cleaning_fee', 'extra_service', 'penalty', 'other']),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('EUR'),
  date: z.string().min(1, 'Date is required'),
  propertyId: z.string().min(1, 'Property is required'),
  bookingId: z.string().optional(),
  source: z.enum(['airbnb', 'booking_com', 'vrbo', 'direct', 'other']),
  guestName: z.string().optional(),
  description: z.string().optional(),
  paymentMethod: z.enum(['bank_transfer', 'credit_card', 'cash', 'paypal', 'stripe', 'ota_payout']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

const demoProperties = [
  { id: 'p1', name: 'Villa Athena - Chania' },
  { id: 'p2', name: 'Sunset Suite - Rethymno' },
  { id: 'p3', name: 'Blue Horizon Apt - Heraklion' },
  { id: 'p4', name: 'Olive Garden Villa - Agios Nikolaos' },
  { id: 'p5', name: 'Sea Breeze Studio - Elounda' },
];

export default function IncomeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: isEdit ? {
      type: 'booking',
      amount: 2100,
      currency: 'EUR',
      date: '2026-03-22',
      propertyId: 'p1',
      bookingId: 'BK-2026-089',
      source: 'airbnb',
      guestName: 'Michael Schmidt',
      description: 'Booking payout - 7 nights',
      paymentMethod: 'ota_payout',
      reference: 'PAY-AIR-20260322-89',
      notes: 'Includes cleaning fee of €80',
    } : {
      type: 'booking',
      currency: 'EUR',
      source: 'direct',
      paymentMethod: 'bank_transfer',
    },
  });

  const onSubmit = async (_data: IncomeFormData) => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    toast.success(isEdit ? 'Income record updated' : 'Income recorded successfully');
    navigate('/finance/income');
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
        </button>
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            {isEdit ? 'Edit Income' : 'Record Income'}
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {isEdit ? 'Update income record details' : 'Add a new income entry'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Income Details */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-secondary" />
            <h3 className="font-headline text-sm font-semibold text-on-surface">Income Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Type *
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                <option value="booking">Booking Revenue</option>
                <option value="cleaning_fee">Cleaning Fee</option>
                <option value="extra_service">Extra Service</option>
                <option value="penalty">Cancellation Penalty</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Source *
              </label>
              <select
                {...register('source')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                <option value="airbnb">Airbnb</option>
                <option value="booking_com">Booking.com</option>
                <option value="vrbo">VRBO</option>
                <option value="direct">Direct Booking</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">€</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  placeholder="0.00"
                />
              </div>
              {errors.amount && <p className="mt-1 text-xs text-red-400">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Date *
              </label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
              />
              {errors.date && <p className="mt-1 text-xs text-red-400">{errors.date.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Payment Method
              </label>
              <select
                {...register('paymentMethod')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                <option value="ota_payout">OTA Payout</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="cash">Cash</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Property *
              </label>
              <select
                {...register('propertyId')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                <option value="">Select property</option>
                {demoProperties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {errors.propertyId && <p className="mt-1 text-xs text-red-400">{errors.propertyId.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Booking ID
              </label>
              <input
                {...register('bookingId')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="BK-XXXX-XXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Guest Name
              </label>
              <input
                {...register('guestName')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="Guest name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Reference Number
              </label>
              <input
                {...register('reference')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="Payment reference"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
              Description
            </label>
            <input
              {...register('description')}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
              placeholder="Brief description"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white gradient-accent hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'Update Income' : 'Record Income'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
