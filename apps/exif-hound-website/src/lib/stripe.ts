import { loadStripe } from '@stripe/stripe-js';

// Fetch Stripe publishable key from the API at runtime
const fetchStripeKey = async (): Promise<string> => {
  try {
    const response = await fetch('/api/stripe-config');
    if (!response.ok) {
      throw new Error('Failed to fetch Stripe config');
    }
    const { publishableKey } = await response.json();
    return publishableKey || '';
  } catch (error) {
    console.error('Error fetching Stripe key:', error);
    return '';
  }
};

// Initialize Stripe with runtime key
let stripePromise: Promise<any> | null = null;

export const getStripe = async () => {
  if (!stripePromise) {
    const key = await fetchStripeKey();
    if (!key) {
      console.error('Stripe publishable key is missing');
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}; 