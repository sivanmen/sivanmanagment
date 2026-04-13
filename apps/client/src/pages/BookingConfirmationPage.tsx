import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Home } from 'lucide-react';

export default function BookingConfirmationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('booking_id');

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold text-on-surface">Payment Successful!</h1>
          <p className="text-on-surface-variant text-sm">
            Your payment has been processed successfully. A confirmation email will be sent to your registered email address.
          </p>
          {bookingId && (
            <p className="text-xs text-on-surface-variant font-mono mt-2">
              Booking ref: {bookingId.substring(0, 8)}...
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/bookings')}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white gradient-accent hover:shadow-lg transition-all"
          >
            <Calendar className="w-4 h-4" />
            View My Bookings
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-surface-container-low text-on-surface border border-outline-variant/10 hover:bg-surface-container transition-all"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
