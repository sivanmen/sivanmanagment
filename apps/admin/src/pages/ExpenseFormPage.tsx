import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  Upload,
  FileText,
  AlertTriangle,
  X,
  CreditCard,
  Banknote,
  Building2,
  Repeat,
} from 'lucide-react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const expenseSchema = z
  .object({
    category: z.string().min(1, 'Category is required'),
    amount: z.coerce.number().positive('Amount must be positive'),
    date: z.string().min(1, 'Date is required'),
    propertyId: z.string().optional(),
    vendor: z.string().optional(),
    description: z.string().min(1, 'Description is required'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    isRecurring: z.boolean().default(false),
    recurrencePattern: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => !data.isRecurring || (data.recurrencePattern && data.recurrencePattern.length > 0),
    { message: 'Select a frequency for recurring expenses', path: ['recurrencePattern'] },
  );

type ExpenseFormData = z.infer<typeof expenseSchema>;

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const expenseCategories = [
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'SUPPLIES', label: 'Supplies' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'PROFESSIONAL_SERVICES', label: 'Professional Services' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'OTHER', label: 'Other' },
];

const demoProperties = [
  { id: 'p1', name: 'Santorini Sunset Villa' },
  { id: 'p2', name: 'Athens Central Loft' },
  { id: 'p3', name: 'Mykonos Beach House' },
  { id: 'p4', name: 'Crete Harbor Suite' },
  { id: 'p5', name: 'Rhodes Old Town Apt' },
];

const paymentMethods = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building2 },
  { value: 'CREDIT_CARD', label: 'Credit Card', icon: CreditCard },
  { value: 'PAYPAL', label: 'PayPal', icon: CreditCard },
];

const recurrenceOptions = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUAL', label: 'Annual' },
];

// Demo data used when editing an existing expense
const demoExpense: ExpenseFormData & { receiptFileName?: string } = {
  category: 'MAINTENANCE',
  amount: 320,
  date: '2026-03-28',
  propertyId: 'p1',
  vendor: 'Nikos Plumbing Co.',
  description: 'Kitchen faucet replacement and pipe inspection',
  paymentMethod: 'BANK_TRANSFER',
  isRecurring: false,
  recurrencePattern: '',
  notes: 'Annual inspection recommended next March',
  receiptFileName: 'receipt-nikos-plumbing-2026.pdf',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExpenseFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  // Receipt upload state (visual only)
  const [receiptFile, setReceiptFile] = useState<string | null>(
    isEditing ? demoExpense.receiptFileName ?? null : null,
  );
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: isEditing
      ? {
          category: demoExpense.category,
          amount: demoExpense.amount,
          date: demoExpense.date,
          propertyId: demoExpense.propertyId,
          vendor: demoExpense.vendor,
          description: demoExpense.description,
          paymentMethod: demoExpense.paymentMethod,
          isRecurring: demoExpense.isRecurring,
          recurrencePattern: demoExpense.recurrencePattern,
          notes: demoExpense.notes,
        }
      : {
          category: '',
          amount: undefined as unknown as number,
          date: new Date().toISOString().split('T')[0],
          propertyId: '',
          vendor: '',
          description: '',
          paymentMethod: '',
          isRecurring: false,
          recurrencePattern: '',
          notes: '',
        },
  });

  const isRecurring = watch('isRecurring');
  const watchedAmount = watch('amount');

  // ---- Drag & drop handlers (visual only) ----
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setReceiptFile(file.name);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file.name);
    }
  }, []);

  const removeReceipt = useCallback(() => {
    setReceiptFile(null);
  }, []);

  // ---- Submit ----
  const onSubmit = async (data: ExpenseFormData) => {
    try {
      // In production, this would call the API
      console.log('Expense data:', { ...data, receiptFile });
      toast.success(
        isEditing ? 'Expense updated successfully' : 'Expense created successfully',
      );
      navigate('/finance/expenses');
    } catch {
      toast.error('Failed to save expense');
    }
  };

  // ---- Style tokens ----
  const inputClasses =
    'w-full px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all border border-outline/5';
  const labelClasses =
    'block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5';
  const errorClasses = 'text-xs text-error mt-1';
  const sectionClasses =
    'bg-surface-container-lowest rounded-xl p-5 ambient-shadow space-y-4 border border-outline/5';

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      {/* ---------------------------------------------------------------- */}
      {/* Header                                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/finance/expenses')}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors border border-outline/5"
        >
          <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
        </button>
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('nav.finance')}
          </p>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            {isEditing ? 'Edit Expense' : 'New Expense'}
          </h1>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Form                                                             */}
      {/* ---------------------------------------------------------------- */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ---------- Category & Amount ---------- */}
        <div className={sectionClasses}>
          <h3 className="font-headline text-lg font-semibold text-on-surface">Expense Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className={labelClasses}>Category *</label>
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

            {/* Amount with Euro indicator */}
            <div>
              <label className={labelClasses}>Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-secondary">
                  &euro;
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('amount')}
                  placeholder="0.00"
                  className={inputClasses + ' pl-8'}
                />
              </div>
              {errors.amount && <p className={errorClasses}>{errors.amount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className={labelClasses}>Date *</label>
              <input type="date" {...register('date')} className={inputClasses} />
              {errors.date && <p className={errorClasses}>{errors.date.message}</p>}
            </div>

            {/* Property */}
            <div>
              <label className={labelClasses}>Property</label>
              <select {...register('propertyId')} className={inputClasses}>
                <option value="">No specific property</option>
                {demoProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vendor */}
          <div>
            <label className={labelClasses}>Vendor / Supplier</label>
            <input
              type="text"
              {...register('vendor')}
              placeholder="e.g. Nikos Plumbing Co."
              className={inputClasses}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClasses}>Description *</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Describe the expense..."
              className={inputClasses + ' resize-none'}
            />
            {errors.description && (
              <p className={errorClasses}>{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* ---------- Receipt Upload ---------- */}
        <div className={sectionClasses}>
          <h3 className="font-headline text-lg font-semibold text-on-surface">Receipt</h3>

          {receiptFile ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/10 border border-secondary/20">
              <FileText className="w-5 h-5 text-secondary shrink-0" />
              <span className="text-sm text-on-surface truncate flex-1">{receiptFile}</span>
              <button
                type="button"
                onClick={removeReceipt}
                className="p-1 rounded hover:bg-surface-container-low transition-colors"
              >
                <X className="w-4 h-4 text-on-surface-variant" />
              </button>
            </div>
          ) : (
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                flex flex-col items-center justify-center gap-3 px-6 py-8 rounded-xl cursor-pointer
                border-2 border-dashed transition-all
                ${
                  isDragging
                    ? 'border-secondary bg-secondary/10'
                    : 'border-outline/10 hover:border-secondary/30 hover:bg-secondary/5'
                }
              `}
            >
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-secondary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-on-surface">
                  Drag & drop receipt here
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  or click to browse -- PDF, JPG, PNG up to 10 MB
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* ---------- Payment Method ---------- */}
        <div className={sectionClasses}>
          <h3 className="font-headline text-lg font-semibold text-on-surface">Payment Method *</h3>

          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {paymentMethods.map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = field.value === pm.value;
                  return (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => field.onChange(pm.value)}
                      className={`
                        flex flex-col items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border
                        ${
                          isSelected
                            ? 'bg-secondary/10 border-secondary/30 text-secondary'
                            : 'bg-surface-container-lowest border-outline/5 text-on-surface-variant hover:bg-surface-container-low'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.paymentMethod && (
            <p className={errorClasses}>{errors.paymentMethod.message}</p>
          )}
        </div>

        {/* ---------- Recurring ---------- */}
        <div className={sectionClasses}>
          <div className="flex items-center gap-3">
            <Repeat className="w-5 h-5 text-on-surface-variant" />
            <h3 className="font-headline text-lg font-semibold text-on-surface">Recurring</h3>
          </div>

          <Controller
            name="isRecurring"
            control={control}
            render={({ field }) => (
              <label className="relative inline-flex items-center cursor-pointer gap-3">
                <div
                  className={`
                    relative w-11 h-6 rounded-full transition-colors
                    ${field.value ? 'bg-secondary' : 'bg-outline/20'}
                  `}
                  onClick={() => field.onChange(!field.value)}
                >
                  <div
                    className={`
                      absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform
                      ${field.value ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </div>
                <span className="text-sm text-on-surface font-medium">
                  This is a recurring expense
                </span>
              </label>
            )}
          />

          {isRecurring && (
            <div className="pt-1">
              <label className={labelClasses}>Frequency *</label>
              <div className="grid grid-cols-3 gap-3">
                {recurrenceOptions.map((opt) => {
                  const currentValue = watch('recurrencePattern');
                  const isSelected = currentValue === opt.value;
                  return (
                    <Controller
                      key={opt.value}
                      name="recurrencePattern"
                      control={control}
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={`
                            px-4 py-2.5 rounded-lg text-sm font-medium transition-all border
                            ${
                              isSelected
                                ? 'bg-secondary/10 border-secondary/30 text-secondary'
                                : 'bg-surface-container-lowest border-outline/5 text-on-surface-variant hover:bg-surface-container-low'
                            }
                          `}
                        >
                          {opt.label}
                        </button>
                      )}
                    />
                  );
                })}
              </div>
              {errors.recurrencePattern && (
                <p className={errorClasses}>{errors.recurrencePattern.message}</p>
              )}
            </div>
          )}
        </div>

        {/* ---------- Notes ---------- */}
        <div className={sectionClasses}>
          <h3 className="font-headline text-lg font-semibold text-on-surface">Notes</h3>
          <textarea
            {...register('notes')}
            rows={4}
            placeholder="Any additional notes about this expense..."
            className={inputClasses + ' resize-none'}
          />
        </div>

        {/* ---------- Approval threshold notice ---------- */}
        {typeof watchedAmount === 'number' && watchedAmount > 300 && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm text-amber-200">
                This expense exceeds the owner's approval threshold. It will be sent to the property
                owner for approval via WhatsApp.
              </p>
              <p className="text-xs text-amber-200/60">
                The owner can approve or reject by replying to the WhatsApp message, or through the
                client portal. A reminder will be sent if no response is received within 24 hours.
              </p>
            </div>
          </div>
        )}

        {/* ---------- Submit & Cancel ---------- */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Changes' : 'Create Expense'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/finance/expenses')}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors border border-outline/5"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
