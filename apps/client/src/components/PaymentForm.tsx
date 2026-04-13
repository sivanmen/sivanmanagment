import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  currency: string;
  bookingId: string;
  propertyName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentForm({
  amount,
  currency,
  bookingId,
  propertyName,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Validation failed');
      setIsProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/confirmation?booking_id=${bookingId}`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    } else {
      setSucceeded(true);
      setTimeout(onSuccess, 1500);
    }
  };

  if (succeeded) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="font-heading text-xl font-bold text-on-surface">Payment Successful!</h3>
        <p className="text-sm text-on-surface-variant">
          Your payment of {currency} {amount.toFixed(2)} has been processed.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider">Payment for</p>
            <p className="text-sm font-medium text-on-surface mt-0.5">{propertyName}</p>
          </div>
          <div className="text-end">
            <p className="text-xs text-on-surface-variant uppercase tracking-wider">Amount</p>
            <p className="text-lg font-bold text-on-surface mt-0.5">
              {currency} {amount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="rounded-xl p-4 bg-surface-container-lowest ambient-shadow">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Security Note */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Lock className="w-3.5 h-3.5" />
        <span>Secured by Stripe. Your payment details are encrypted.</span>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 rounded-xl text-sm font-medium bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant/10 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white gradient-accent hover:shadow-lg transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Pay {currency} {amount.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
