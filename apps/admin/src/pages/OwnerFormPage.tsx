import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, User, Building2, Percent, CreditCard, Globe } from 'lucide-react';
import { toast } from 'sonner';

const ownerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  company: z.string().optional(),
  email: z.string().email('Valid email required'),
  phone: z.string().min(8, 'Phone number is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankSwift: z.string().optional(),
  managementFeePercent: z.number().min(0).max(100).default(15),
  minimumMonthlyFee: z.number().min(0).optional(),
  preferredLanguage: z.string().default('en'),
  notes: z.string().optional(),
  portalAccess: z.boolean().default(true),
});

type OwnerFormData = z.infer<typeof ownerSchema>;

// Demo data for edit mode
const demoOwner: OwnerFormData = {
  firstName: 'David',
  lastName: 'Cohen',
  company: 'Cohen Investments Ltd',
  email: 'david.cohen@example.com',
  phone: '+972-54-123-4567',
  address: '42 Rothschild Blvd',
  city: 'Tel Aviv',
  country: 'Israel',
  taxId: '515123456',
  bankName: 'Bank Hapoalim',
  bankAccount: 'IL620108000000099999999',
  bankSwift: 'POALILIT',
  managementFeePercent: 15,
  minimumMonthlyFee: 300,
  preferredLanguage: 'he',
  notes: 'Prefers WhatsApp communication. Has 3 properties in Chania.',
  portalAccess: true,
};

export default function OwnerFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OwnerFormData>({
    resolver: zodResolver(ownerSchema),
    defaultValues: isEdit ? demoOwner : {
      managementFeePercent: 15,
      minimumMonthlyFee: 0,
      preferredLanguage: 'en',
      portalAccess: true,
    },
  });

  const portalAccess = watch('portalAccess');

  const onSubmit = async (_data: OwnerFormData) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    toast.success(isEdit ? 'Owner updated successfully' : 'Owner created successfully');
    navigate(isEdit ? `/owners/${id}` : '/owners');
  };

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
              {...register('company')}
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
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="owner@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Phone *
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
                {...register('address')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                City
              </label>
              <input
                {...register('city')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Country
              </label>
              <select
                {...register('country')}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Management Fee (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  {...register('managementFeePercent', { valueAsNumber: true })}
                  className="w-full px-3 py-2.5 pr-8 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">%</span>
              </div>
              <p className="mt-1 text-[10px] text-on-surface-variant">Applied to gross booking revenue</p>
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Minimum Monthly Fee (€)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">€</span>
                <input
                  type="number"
                  {...register('minimumMonthlyFee', { valueAsNumber: true })}
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  placeholder="0"
                />
              </div>
              <p className="mt-1 text-[10px] text-on-surface-variant">Fee = MAX(% revenue, minimum)</p>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Bank Name
              </label>
              <input
                {...register('bankName')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="Bank name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                IBAN / Account Number
              </label>
              <input
                {...register('bankAccount')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="IBAN or account number"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                SWIFT / BIC
              </label>
              <input
                {...register('bankSwift')}
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
                {...register('preferredLanguage')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                <option value="he">עברית (Hebrew)</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ru">Русский</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('portalAccess')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-low peer-focus:ring-2 peer-focus:ring-secondary/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-surface-variant after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary peer-checked:after:bg-white" />
              </label>
              <div>
                <p className="text-sm font-medium text-on-surface">Owner Portal Access</p>
                <p className="text-xs text-on-surface-variant">
                  {portalAccess ? 'Owner can access client.sivanmanagment.com' : 'Portal access disabled'}
                </p>
              </div>
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
        {isEdit && (
          <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/10">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-secondary" />
              <div>
                <p className="text-sm font-medium text-on-surface">Properties linked to this owner</p>
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
                {isEdit ? 'Update Owner' : 'Create Owner'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
