import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  ArrowLeft,
  Building2,
  Calendar,
  Moon,
  User,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import apiClient from '../lib/api-client';
import { StripeProvider } from '../components/StripeProvider';
import { PaymentForm } from '../components/PaymentForm';

export default function BookingPaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Fetch booking details
  const { data: bookingRes, isLoading, isError } = useQuery({
    queryKey: ['booking-payment', bookingId],
    queryFn: () => apiClient.get(`/bookings/${bookingId}`).then(r => r.data?.data || r.data),
    enabled: !!bookingId,
  });

  const booking = bookingRes;

  // Check if returning from redirect
  const paymentStatus = searchParams.get('redirect_status');

  // Initialize payment intent
  const initializePayment = async () => {
    if (!bookingId) return;
    setIsInitializing(true);
    setInitError(null);
    try {
      const res = await apiClient.post('/payments/guest-payment-intent', { bookingId });
      const data = res.data?.data || res.data;
      setClientSecret(data.clientSecret);
      setPaymentData(data);
    } catch (e: any) {
      setInitError(e.response?.data?.message || e.response?.data?.error || 'Failed to initialize payment');
    } finally {
      setIsInitializing(false);
    }
  };

  // If already paid, show success
  if (booking?.paymentStatus === 'PAID' || paymentStatus === 'succeeded') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-on-surface">Payment Complete!</h1>
          <p className="text-on-surface-variant text-sm">
            Your payment for this booking has been successfully processed. You will receive a confirmation email shortly.
          </p>
          <button
            onClick={() => navigate('/bookings')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white gradient-accent hover:shadow-lg transition-all"
          >
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-on-surface-variant text-sm">Booking not found</p>
          <button
            onClick={() => navigate('/bookings')}
            className="text-sm text-secondary underline hover:text-secondary/80"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const amount = Number(booking.totalAmount);
  const currency = booking.currency || 'EUR';
  const propertyName = booking.property?.name || booking.propertyName || 'Property';
  const checkIn = new Date(booking.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const checkOut = new Date(booking.checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center hover:bg-surface-container transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
        </button>
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase">Payment</p>
          <h1 className="font-heading text-xl font-bold text-on-surface">Complete Your Booking</h1>
        </div>
      </div>

      {/* Booking Summary Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 ambient-shadow space-y-4">
        <h2 className="font-heading text-lg font-semibold text-on-surface">Booking Summary</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
            <span className="text-sm text-on-surface">{propertyName}</span>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
            <span className="text-sm text-on-surface">{booking.guestName}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
            <span className="text-sm text-on-surface">{checkIn} — {checkOut}</span>
          </div>
          <div className="flex items-center gap-3">
            <Moon className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
            <span className="text-sm text-on-surface">{booking.nights} nights</span>
          </div>
        </div>

        <div className="border-t border-outline-variant/10 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-on-surface-variant">Total Amount</span>
            <span className="text-xl font-bold text-on-surface">{currency} {amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      {!clientSecret && !initError && (
        <div className="bg-surface-container-lowest rounded-2xl p-5 ambient-shadow space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto">
            <CreditCard className="w-7 h-7 text-secondary" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-on-surface">Ready to Pay?</h3>
          <p className="text-sm text-on-surface-variant">
            Click below to securely process your payment via Stripe.
          </p>
          <button
            onClick={initializePayment}
            disabled={isInitializing}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-medium text-white gradient-accent hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Proceed to Payment
              </>
            )}
          </button>
          <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secured & encrypted by Stripe</span>
          </div>
        </div>
      )}

      {initError && (
        <div className="bg-surface-container-lowest rounded-2xl p-5 ambient-shadow">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Payment initialization failed</p>
              <p className="text-xs text-red-400/80 mt-1">{initError}</p>
            </div>
          </div>
          <button
            onClick={initializePayment}
            className="mt-3 text-sm text-secondary underline hover:text-secondary/80"
          >
            Try again
          </button>
        </div>
      )}

      {clientSecret && (
        <div className="bg-surface-container-lowest rounded-2xl p-5 ambient-shadow">
          <StripeProvider clientSecret={clientSecret}>
            <PaymentForm
              amount={amount}
              currency={currency}
              bookingId={bookingId!}
              propertyName={propertyName}
              onSuccess={() => navigate('/bookings')}
              onCancel={() => {
                setClientSecret(null);
                setPaymentData(null);
              }}
            />
          </StripeProvider>
        </div>
      )}
    </div>
  );
}
