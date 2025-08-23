// app/api/xano/view-all-subs/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function readCookie(req: NextRequest, name: string): string | undefined {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

function viewAllSubsUrl() {
  return (
    process.env.XANO_ADMIN_VIEW_ALL_SUBS ||
    `${(process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '')
      .replace(/\/$/, '')}/admin_view_all_subs`
  ).replace(/\/$/, '');
}

export async function GET(req: NextRequest) {
  const district_code = readCookie(req, 'district_code');

  if (!district_code) {
    return NextResponse.json(
      { error: 'Missing district_code' },
      { status: 401 }
    );
  }

  const url = new URL(viewAllSubsUrl());
  url.searchParams.set('district_code', district_code);

  const headers: HeadersInit = { 
    Accept: 'application/json',
    'Cache-Control': 'no-store',
    Pragma: 'no-cache'
  };
  
  if (process.env.XANO_API_KEY) {
    headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
  }

  try {
    const res = await fetch(url.toString(), { 
      method: 'GET', 
      headers, 
      cache: 'no-store' 
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error || `Failed to fetch substitutes (${res.status})` },
        { status: res.status, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(data, { 
      status: 200, 
      headers: { 'Cache-Control': 'no-store' } 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch substitutes' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
