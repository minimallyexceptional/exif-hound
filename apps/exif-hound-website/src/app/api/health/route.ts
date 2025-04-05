import { NextResponse } from 'next/server';

/**
 * Health check endpoint
 * Simple endpoint to check if the API is up and running
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
} 