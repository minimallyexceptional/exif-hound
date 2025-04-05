import { NextResponse } from 'next/server';

// API endpoint that returns the publishable key at runtime
export async function GET() {
  return NextResponse.json({
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  });
} 