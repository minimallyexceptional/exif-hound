import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your secret key from environment variable
// Make sure to set STRIPE_SECRET_KEY in your .env.local file
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('Missing STRIPE_SECRET_KEY environment variable');
}

// Create Stripe instance only if we have a valid key (not during build time)
let stripe: Stripe | null = null;
if (stripeSecretKey && !stripeSecretKey.includes('dummy_key_for_build')) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16' as any, // Using a stable API version
  });
}

export async function POST() {
  try {
    // Check if Stripe is properly initialized
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not properly configured. Check your API keys.' },
        { status: 500 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'EXIF Hound Pro License',
              description: 'One-time purchase with 1 year of updates',
              images: ['https://your-domain.com/product-image.jpg'], // Replace with actual image URL
            },
            unit_amount: 3995, // $39.95 in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        productId: 'exif-hound-pro',
        productType: 'pro'
      },
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`,
      // `payment_method_types` was removed from newer Stripe API type definitions
      // but remains valid for the pinned 2023-10-16 API version.
    } as any);

    // Return the session ID to be used by the client
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 