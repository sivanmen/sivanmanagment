import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';
import { useAuthStore } from '../store/auth.store';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberDevice: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberDevice: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Authentication failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-headline text-xl font-bold text-on-surface mb-1">
          {t('auth.login')}
        </h2>
        <p className="text-sm text-on-surface-variant">
          Manage your properties, bookings, and team.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-2">
            {t('auth.email')}
          </label>
          <input
            type="email"
            {...register('email')}
            className="w-full px-4 py-3 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
            placeholder="you@company.com"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-error">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">
              {t('auth.password')}
            </label>
            <button type="button" className="text-xs text-secondary hover:text-secondary-container transition-colors">
              {t('auth.forgotPassword')}
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              className="w-full px-4 py-3 pr-12 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
              placeholder="Enter your security key"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-error">{errors.password.message}</p>
          )}
        </div>

        {/* Remember device */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('rememberDevice')}
            className="w-4 h-4 rounded border-outline accent-secondary"
          />
          <span className="text-xs text-on-surface-variant">
            {t('auth.rememberDevice')}
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-on-primary gradient-primary hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t('auth.loggingIn')}</span>
            </>
          ) : (
            <>
              <span>{t('auth.login')}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Demo credentials hint */}
      <div className="mt-6 p-3 rounded-lg bg-secondary/5 border border-secondary/10">
        <p className="text-[10px] font-semibold tracking-widest text-secondary uppercase mb-2">Demo Access</p>
        <div className="space-y-1 text-xs text-on-surface-variant font-mono">
          <p>admin@sivanmanagment.com / Admin123!@#</p>
        </div>
      </div>

      {/* Request access */}
      <div className="mt-4 text-center">
        <p className="text-xs text-on-surface-variant">
          {t('auth.newUser')}{' '}
          <button className="text-secondary hover:text-secondary-container font-medium transition-colors">
            {t('auth.requestAccess')}
          </button>
        </p>
      </div>
    </div>
  );
}
