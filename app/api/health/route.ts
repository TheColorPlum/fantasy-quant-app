import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export const runtime = 'nodejs';

/**
 * Health check endpoint
 * Returns system status, version, and database response time
 */
export async function GET() {
  try {
    // Measure database response time
    const startTime = Date.now();
    await db.$queryRaw`SELECT 1 as result`;
    const dbMs = Date.now() - startTime;

    return NextResponse.json({
      ok: true,
      version: process.env.npm_package_version || '1.0.0',
      dbMs
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      ok: false,
      error: 'Database connection failed'
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  }
}