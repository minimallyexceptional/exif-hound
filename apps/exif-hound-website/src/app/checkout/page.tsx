'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with ssr: false
const ClientCheckout = dynamic(() => import('./client-checkout'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center min-h-screen">Loading...</div>
});

export default function CheckoutPage() {
  return <ClientCheckout />;
} 