import { NextRequest, NextResponse } from 'next/server';
import { getLicenseBySessionId } from '@/lib/licenses';

/**
 * Get license information by Stripe session ID
 */
export async function GET(request: NextRequest) {
  // Get session ID from query parameters
  const sessionId = request.nextUrl.searchParams.get('session_id');
  
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing session_id parameter' },
      { status: 400 }
    );
  }
  
  try {
    // Get license from database
    const license = await getLicenseBySessionId(sessionId);
    
    if (!license) {
      return NextResponse.json(
        { error: 'License not found for the provided session ID' },
        { status: 404 }
      );
    }
    
    // Return just the necessary information for the client
    return NextResponse.json({
      key: license.key,
      productId: license.productId,
      createdAt: license.createdAt,
      expiresAt: license.expiresAt
    });
    
  } catch (error) {
    console.error('Error retrieving license:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve license information' },
      { status: 500 }
    );
  }
}

