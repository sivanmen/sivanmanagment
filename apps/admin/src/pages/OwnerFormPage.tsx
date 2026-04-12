import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, User, Building2, Percent, CreditCard, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

const ownerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(8, 'Phone number is required').optional().or(z.literal('')),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  bankDetails: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    iban: z.string().optional(),
    swift: z.string().optional(),
  }).optional(),
  defaultManagementFeePercent: z.coerce.number().min(0).max(100).default(25),
  defaultMinimumMonthlyFee: z.coerce.number().min(0).optional(),
  expenseApprovalThreshold: z.coerce.number().min(0).optional(),
  locale: z.string().default('en'),
  timezone: z.string().default('Europe/Athens'),
  notes: z.string().optional(),
  preferredPaymentMethod: z.enum(['BANK_TRANSFER', 'STRIPE', 'PAYPAL', 'CASH', 'APPLE_PAY', 'GOOGLE_PAY']).default('BANK_TRANSFER'),
});

type OwnerFormData = z.infer<typeof ownerSchema>;

export default function OwnerFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OwnerFormData>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      defaultManagementFeePercent: 25,
      defaultMinimumMonthlyFee: 0,
      expenseApprovalThreshold: 100,
      locale: 'en',
      timezone: 'Europe/Athens',
      preferredPaymentMethod: 'BANK_TRANSFER',
    },
  });

  // Fetch existing owner for edit mode
  const { data: owner, isLoading: isLoadingOwner } = useQuery({
    queryKey: ['owner', id],
    queryFn: async () => {
      const res = await apiClient.get(`/owners/${id}`);
      return res.data.data ?? res.data;
    },
    enabled: isEdit,
  });

  // Populate form when owner data loads
  useEffect(() => {
    if (owner) {
      const billingAddr = owner.billingAddress as any;
      const bank = owner.bankDetails as any;

      reset({
        firstName: owner.user?.firstName ?? '',
        lastName: owner.user?.lastName ?? '',
        email: owner.user?.email ?? '',
        phone: owner.user?.phone ?? '',
        companyName: owner.companyName ?? '',
        taxId: owner.taxId ?? '',
        billingAddress: {
          street: billingAddr?.street ?? '',
          city: billingAddr?.city ?? '',
          country: billingAddr?.country ?? '',
        },
        bankDetails: {
          bankName: bank?.bankName ?? '',
          accountNumber: bank?.accountNumber ?? '',
          iban: bank?.iban ?? '',
          swift: bank?.swift ?? '',
        },
        defaultManagementFeePercent: owner.defaultManagementFeePercent != null
          ? Number(owner.defaultManagementFeePercent)
          : 25,
        defaultMinimumMonthlyFee: owner.defaultMinimumMonthlyFee != null
          ? Number(owner.defaultMinimumMonthlyFee)
          : 0,
        expenseApprovalThreshold: owner.expenseApprovalThreshold != null
          ? Number(owner.expenseApprovalThreshold)
          : 100,
        locale: owner.user?.preferredLocale ?? 'en',
        timezone: owner.user?.timezone ?? 'Europe/Athens',
        notes: owner.notes ?? '',
        preferredPaymentMethod: owner.preferredPaymentMethod ?? 'BANK_TRANSFER',
      });
    }
  }, [owner, reset]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: OwnerFormData) => apiClient.post('/owners', data),
    onSuccess: () => {
      toast.success('Owner created successfully');
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      navigate('/owners');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create owner';
      toast.error(message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: OwnerFormData) => apiClient.put(`/owners/${id}`, data),
    onSuccess: () => {
      toast.success('Owner updated successfully');
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      queryClient.invalidateQueries({ queryKey: ['owner', id] });
      navigate(`/owners/${id}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update owner';
      toast.error(message);
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (data: OwnerFormData) => {
    if (isEdit) {
      // For update, strip out email (cannot change) and send only relevant fields
      const { email, ...updateData } = data;
      updateMutation.mutate(updateData as OwnerFormData);
    } else {
      createMutation.mutate(data);
    }
  };

  // Show loading state when fetching owner for edit
  if (isEdit && isLoadingOwner) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
          <p className="text-sm text-on-surface-variant">Loading owner data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
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
            {isEdit ? 'Edit Owner' : 'New Owner'}
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {isEdit ? 'Update owner profile and management terms' : 'Add a property owner to the system'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-secondary" />
            <h3 className="font-headline text-sm font-semibold text-on-surface">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                First Name *
              </label>
              <input
                {...register('firstName')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="John"
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Last Name *
              </label>
              <input
                {...register('lastName')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="Doe"
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
              Company
            </label>
            <input
              {...register('companyName')}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
              placeholder="Company name (optional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Email *
              </label>
              <input
                type="email"
                {...register('email')}
                disabled={isEdit}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40 disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="owner@example.com"
              />
              {isEdit && <p className="mt-1 text-[10px] text-on-surface-variant">Email cannot be changed after creation</p>}
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Phone
              </label>
              <input
                {...register('phone')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="+972-54-000-0000"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Address
              </label>
              <input
                {...register('billingAddress.street')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                City
              </label>
              <input
                {...register('billingAddress.city')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Country
              </label>
              <select
                {...register('billingAddress.country')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                <option value="">Select country</option>
                <option value="Israel">Israel</option>
                <option value="Greece">Greece</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Russia">Russia</option>
                <option value="Spain">Spain</option>
              </select>
            </div>
          </div>
        </div>

        {/* Management Terms */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-secondary" />
            <h3 className="font-headline text-sm font-semibold text-on-surface">Management Terms</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Management Fee (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  {...register('defaultManagementFeePercent', { valueAsNumber: true })}
                  className="w-full px-3 py-2.5 pr-8 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">%</span>
              </div>
              <p className="mt-1 text-[10px] text-on-surface-variant">Applied to gross booking revenue</p>
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Minimum Monthly Fee
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">EUR</span>
                <input
                  type="number"
                  {...register('defaultMinimumMonthlyFee', { valueAsNumber: true })}
                  className="w-full pl-11 pr-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  placeholder="0"
                />
              </div>
              <p className="mt-1 text-[10px] text-on-surface-variant">Fee = MAX(% revenue, minimum)</p>
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Expense Approval Threshold
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">EUR</span>
                <input
                  type="number"
                  {...register('expenseApprovalThreshold', { valueAsNumber: true })}
                  className="w-full pl-11 pr-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  placeholder="100"
                />
              </div>
              <p className="mt-1 text-[10px] text-on-surface-variant">Expenses above this need owner approval</p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
              Tax ID / VAT Number
            </label>
            <input
              {...register('taxId')}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
              placeholder="Tax identification number"
            />
          </div>
        </div>

        {/* Banking Information */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-secondary" />
            <h3 className="font-headline text-sm font-semibold text-on-surface">Banking Information</h3>
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
              Preferred Payment Method
            </label>
            <select
              {...register('preferredPaymentMethod')}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="STRIPE">Stripe</option>
              <option value="PAYPAL">PayPal</option>
              <option value="CASH">Cash</option>
              <option value="APPLE_PAY">Apple Pay</option>
              <option value="GOOGLE_PAY">Google Pay</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Bank Name
              </label>
              <input
                {...register('bankDetails.bankName')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="Bank name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Account Number
              </label>
              <input
                {...register('bankDetails.accountNumber')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="Account number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                IBAN
              </label>
              <input
                {...register('bankDetails.iban')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="IBAN"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                SWIFT / BIC
              </label>
              <input
                {...register('bankDetails.swift')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="SWIFT code"
              />
            </div>
          </div>
        </div>

        {/* Portal & Preferences */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-secondary" />
            <h3 className="font-headline text-sm font-semibold text-on-surface">Portal & Preferences</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Preferred Language
              </label>
              <select
                {...register('locale')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                <option value="he">Hebrew</option>
                <option value="en">English</option>
                <option value="es">Espanol</option>
                <option value="fr">Francais</option>
                <option value="de">Deutsch</option>
                <option value="ru">Russian</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Timezone
              </label>
              <select
                {...register('timezone')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                <option value="Europe/Athens">Europe/Athens (Greece)</option>
                <option value="Asia/Jerusalem">Asia/Jerusalem (Israel)</option>
                <option value="Europe/Berlin">Europe/Berlin (Germany)</option>
                <option value="Europe/Paris">Europe/Paris (France)</option>
                <option value="Europe/London">Europe/London (UK)</option>
                <option value="Europe/Madrid">Europe/Madrid (Spain)</option>
                <option value="Europe/Moscow">Europe/Moscow (Russia)</option>
                <option value="America/New_York">America/New_York (US East)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
              placeholder="Internal notes about this owner..."
            />
          </div>
        </div>

        {/* Building icon indicator for edit mode */}
        {isEdit && owner && (
          <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/10">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-secondary" />
              <div>
                <p className="text-sm font-medium text-on-surface">
                  {owner._count?.properties ?? 0} properties linked to this owner
                </p>
                <p className="text-xs text-on-surface-variant">
                  Manage property assignments from the Properties page or the Owner Detail page.
                </p>
              </div>
            </div>
          </div>
        )}

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
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white gradient-accent hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'Update Owner' : 'Create Owner'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
