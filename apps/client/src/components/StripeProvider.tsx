import { useState, useEffect, ReactNode } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import apiClient from '../lib/api-client';

let stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = apiClient
      .get('/payments/stripe/config')
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data.publishableKey && data.isConfigured) {
          return loadStripe(data.publishableKey);
        }
        return null;
      })
      .catch(() => null);
  }
  return stripePromise;
}

interface StripeProviderProps {
  children: ReactNode;
  clientSecret?: string;
}

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStripePromise().then((s) => {
      setStripe(s);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stripe) {
    return (
      <div className="p-6 text-center">
        <p className="text-on-surface-variant text-sm">Payment system is not configured.</p>
      </div>
    );
  }

  const options = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: 'night' as const,
          variables: {
            colorPrimary: '#6b38d4',
            colorBackground: '#1a1a1a',
            colorText: '#e8e0e0',
            colorDanger: '#ef4444',
            borderRadius: '8px',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        },
      }
    : undefined;

  return (
    <Elements stripe={stripe} options={options}>
      {children}
    </Elements>
  );
}
