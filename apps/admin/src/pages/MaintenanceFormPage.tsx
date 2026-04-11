import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, Save, Wrench, AlertTriangle, Camera, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

const maintenanceSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Please provide a detailed description'),
  propertyId: z.string().min(1, 'Property is required'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigneeId: z.string().optional(),
  scheduledDate: z.string().optional(),
  estimatedCost: z.number().optional(),
  vendorName: z.string().optional(),
  vendorPhone: z.string().optional(),
  notes: z.string().optional(),
  affectsGuests: z.boolean().default(false),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

const demoProperties = [
  { id: 'p1', name: 'Villa Athena - Chania' },
  { id: 'p2', name: 'Sunset Suite - Rethymno' },
  { id: 'p3', name: 'Blue Horizon Apt - Heraklion' },
  { id: 'p4', name: 'Olive Garden Villa - Agios Nikolaos' },
  { id: 'p5', name: 'Sea Breeze Studio - Elounda' },
];

const demoTeam = [
  { id: 't1', name: 'Nikos Papadakis' },
  { id: 't2', name: 'Maria Stavrou' },
  { id: 't3', name: 'Yannis Dimitriou' },
  { id: 't4', name: 'External Vendor' },
];

const categories = [
  'Plumbing', 'Electrical', 'HVAC', 'Appliance Repair', 'Cleaning',
  'Painting', 'Furniture', 'Pool & Garden', 'Lock & Key', 'Pest Control',
  'Roof & Exterior', 'General Repair', 'Safety Inspection', 'Other',
];

const priorityColors: Record<string, string> = {
  low: 'bg-blue-500/10 text-blue-400',
  medium: 'bg-amber-500/10 text-amber-400',
  high: 'bg-orange-500/10 text-orange-400',
  urgent: 'bg-red-500/10 text-red-400',
};

export default function MaintenanceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: isEdit ? {
      title: 'Leaking faucet in master bathroom',
      description: 'The kitchen faucet has been dripping continuously. Guest reported it. Needs replacement of the cartridge or full faucet.',
      propertyId: 'p1',
      category: 'Plumbing',
      priority: 'high',
      assigneeId: 't1',
      scheduledDate: '2026-04-15',
      estimatedCost: 120,
      vendorName: 'Crete Plumbing Services',
      vendorPhone: '+30-28210-55555',
      notes: 'Guest checking out on April 14th. Schedule repair for April 15th morning.',
      affectsGuests: true,
    } : {
      priority: 'medium',
      affectsGuests: false,
    },
  });

  const priority = watch('priority');

  const onSubmit = async (_data: MaintenanceFormData) => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    toast.success(isEdit ? 'Request updated' : 'Maintenance request created');
    navigate(isEdit ? `/maintenance/${id}` : '/maintenance');
  };

  const handlePhotoAdd = () => {
    setPhotos([...photos, `photo_${photos.length + 1}.jpg`]);
    toast.success('Photo added');
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
            {isEdit ? 'Edit Maintenance Request' : 'New Maintenance Request'}
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {isEdit ? 'Update request details and status' : 'Report a maintenance issue for a property'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Issue Details */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-4 h-4 text-secondary" />
            <h3 className="font-headline text-sm font-semibold text-on-surface">Issue Details</h3>
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
              Title *
            </label>
            <input
              {...register('title')}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
              placeholder="Brief description of the issue"
            />
            {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
              Description *
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
              placeholder="Detailed description of the maintenance issue..."
            />
            {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                Category *
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-xs text-red-400">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              {priority === 'urgent' && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  Will send immediate notifications
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Assignment & Scheduling */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-secondary" />
            <h3 className="font-headline text-sm font-semibold text-on-surface">Assignment & Scheduling</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Assign To
              </label>
              <select
                {...register('assigneeId')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                <option value="">Unassigned</option>
                {demoTeam.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Scheduled Date
              </label>
              <input
                type="date"
                {...register('scheduledDate')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Estimated Cost (€)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">€</span>
                <input
                  type="number"
                  {...register('estimatedCost', { valueAsNumber: true })}
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Vendor / Contractor
              </label>
              <input
                {...register('vendorName')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="Vendor or contractor name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
                Vendor Phone
              </label>
              <input
                {...register('vendorPhone')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="+30-XXXX-XXXXX"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('affectsGuests')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-low peer-focus:ring-2 peer-focus:ring-secondary/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-surface-variant after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white" />
            </label>
            <div>
              <p className="text-sm font-medium text-on-surface">Affects Current Guests</p>
              <p className="text-xs text-on-surface-variant">Mark if this issue impacts guest comfort or safety</p>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="w-4 h-4 text-secondary" />
            <h3 className="font-headline text-sm font-semibold text-on-surface">Photos</h3>
          </div>

          <div className="flex flex-wrap gap-3">
            {photos.map((p, i) => (
              <div key={i} className="w-24 h-24 rounded-lg bg-surface-container-low border border-outline/10 flex items-center justify-center">
                <span className="text-[10px] text-on-surface-variant">{p}</span>
              </div>
            ))}
            <button
              type="button"
              onClick={handlePhotoAdd}
              className="w-24 h-24 rounded-lg border-2 border-dashed border-outline/20 hover:border-secondary/40 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <Camera className="w-5 h-5 text-on-surface-variant" />
              <span className="text-[10px] text-on-surface-variant">Add Photo</span>
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
          <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1.5">
            Internal Notes
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
            placeholder="Additional notes for the team..."
          />
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
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white gradient-accent hover:opacity-90 transition-opacity disabled:opacity-50`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'Update Request' : 'Create Request'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
