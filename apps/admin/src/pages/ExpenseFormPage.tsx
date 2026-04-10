import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

const expenseSchema = z.object({
  propertyId: z.string().optional(),
  ownerId: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().default('EUR'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
  vendor: z.string().optional(),
  receiptUrl: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.string().optional(),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const expenseCategories = [
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'SUPPLIES', label: 'Supplies' },
  { value: 'TAXES', label: 'Taxes' },
  { value: 'OTHER', label: 'Other' },
];

const demoProperties = [
  { id: 'p1', name: 'Santorini Sunset Villa' },
  { id: 'p2', name: 'Athens Central Loft' },
  { id: 'p3', name: 'Mykonos Beach House' },
  { id: 'p4', name: 'Crete Harbor Suite' },
  { id: 'p5', name: 'Rhodes Old Town Apt' },
];

const demoOwners = [
  { id: 'o1', name: 'Dimitris Papadopoulos' },
  { id: 'o2', name: 'Maria Konstantinou' },
  { id: 'o3', name: 'Yannis Alexiou' },
];

const currencies = ['EUR', 'USD', 'GBP'];

export default function ExpenseFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: '',
      amount: undefined,
      currency: 'EUR',
      description: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      receiptUrl: '',
      isRecurring: false,
      recurrencePattern: '',
      notes: '',
    },
  });

  const isRecurring = watch('isRecurring');

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      // In production, this would call the API
      console.log('Expense data:', data);
      toast.success(isEditing ? 'Expense updated successfully' : 'Expense created successfully');
      navigate('/finance/expenses');
    } catch {
      toast.error('Failed to save expense');
    }
  };

  const inputClasses =
    'w-full px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';
  const labelClasses = 'block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5';
  const errorClasses = 'text-xs text-error mt-1';

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/finance/expenses')}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
        </button>
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('nav.finance')}
          </p>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            {isEditing ? 'Edit Expense' : t('finance.addExpense')}
          </h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
        {/* Property & Owner */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow space-y-4">
          <h3 className="font-headline text-lg font-semibold text-on-surface">Assignment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Property (optional)</label>
              <select {...register('propertyId')} className={inputClasses}>
                <option value="">No specific property</option>
                {demoProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Owner (optional)</label>
              <select {...register('ownerId')} className={inputClasses}>
                <option value="">No specific owner</option>
                {demoOwners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow space-y-4">
          <h3 className="font-headline text-lg font-semibold text-on-surface">Expense Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>{t('finance.category')} *</label>
              <select {...register('category')} className={inputClasses}>
                <option value="">Select category...</option>
                {expenseCategories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.category && <p className={errorClasses}>{errors.category.message}</p>}
            </div>
            <div>
              <label className={labelClasses}>Date *</label>
              <input type="date" {...register('date')} className={inputClasses} />
              {errors.date && <p className={errorClasses}>{errors.date.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelClasses}>Description *</label>
            <input
              type="text"
              {...register('description')}
              placeholder="e.g. Plumber - kitchen faucet repair"
              className={inputClasses}
            />
            {errors.description && <p className={errorClasses}>{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClasses}>{t('finance.amount')} *</label>
              <input
                type="number"
                step="0.01"
                {...register('amount')}
                placeholder="0.00"
                className={inputClasses}
              />
              {errors.amount && <p className={errorClasses}>{errors.amount.message}</p>}
            </div>
            <div>
              <label className={labelClasses}>Currency</label>
              <select {...register('currency')} className={inputClasses}>
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>{t('finance.vendor')}</label>
              <input
                type="text"
                {...register('vendor')}
                placeholder="e.g. Nikos Plumbing Co."
                className={inputClasses}
              />
            </div>
          </div>
        </div>

        {/* Receipt & Recurrence */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow space-y-4">
          <h3 className="font-headline text-lg font-semibold text-on-surface">
            {t('finance.receipt')} & Recurrence
          </h3>

          <div>
            <label className={labelClasses}>{t('finance.receipt')} URL</label>
            <input
              type="url"
              {...register('receiptUrl')}
              placeholder="https://..."
              className={inputClasses}
            />
            <p className="text-xs text-on-surface-variant mt-1">
              Paste a URL to the receipt image or document. File upload coming soon.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isRecurring"
              {...register('isRecurring')}
              className="w-4 h-4 rounded border-outline-variant text-secondary focus:ring-secondary/30"
            />
            <label htmlFor="isRecurring" className="text-sm text-on-surface font-medium">
              This is a recurring expense
            </label>
          </div>

          {isRecurring && (
            <div>
              <label className={labelClasses}>Recurrence Pattern</label>
              <select {...register('recurrencePattern')} className={inputClasses}>
                <option value="">Select pattern...</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow space-y-4">
          <h3 className="font-headline text-lg font-semibold text-on-surface">Notes</h3>
          <textarea
            {...register('notes')}
            rows={4}
            placeholder="Any additional notes about this expense..."
            className={inputClasses + ' resize-none'}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? t('common.save') : t('common.create')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/finance/expenses')}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
