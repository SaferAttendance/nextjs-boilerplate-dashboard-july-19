import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Get the Xano endpoint URL from environment variable
    const xanoEndpoint = process.env.Verify_User_Email_and_Role_From_Allowed_Users;
    
    if (!xanoEndpoint) {
      console.error('Missing Xano endpoint environment variable');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Call Xano endpoint
    const xanoUrl = `${xanoEndpoint}?email=${encodeURIComponent(email)}`;
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Add API key if available
    if (process.env.XANO_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.XANO_API_KEY}`;
    }

    const response = await fetch(xanoUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Xano API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'Failed to verify user credentials' },
        { status: response.status }
      );
    }

    const userData = await response.json();

    // Handle case where user is not found or has no data
    if (!userData || (Array.isArray(userData) && userData.length === 0)) {
      return NextResponse.json({
        email: null,
        full_name: null,
        role: null,
        district_code: null,
        school_code: null,
        sub_assigned: null,
        Phone_ID: null,
      });
    }

    // Handle array response (get first user if array)
    const user = Array.isArray(userData) ? userData[0] : userData;

    // Return user data in expected format
    return NextResponse.json({
      email: user.email || null,
      full_name: user.full_name || null,
      role: user.role || null,
      district_code: user.district_code || null,
      school_code: user.school_code || null,
      sub_assigned: user.sub_assigned || null,
      Phone_ID: user.Phone_ID || null,
    });

  } catch (error) {
    console.error('User verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error during user verification' },
      { status: 500 }
    );
  }
}
