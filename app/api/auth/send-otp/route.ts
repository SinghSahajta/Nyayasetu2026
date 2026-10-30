import { NextRequest, NextResponse } from 'next/server';
import { sendOTP } from '@/lib/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    // Validate phone is provided
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Phone number is required.' },
        { status: 400 }
      );
    }

    // Validate phone is 10 digits
    const phoneClean = phone.replace(/\s+/g, '');
    if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      return NextResponse.json(
        { success: false, message: 'Enter a valid 10-digit Indian mobile number (starts with 6-9).' },
        { status: 400 }
      );
    }

    const result = await sendOTP(phoneClean);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (err) {
    console.error('[API] send-otp error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
