import { NextResponse } from 'next/server';

export async function POST() {
  const guestId = `guest_${Date.now()}`;
  return NextResponse.json({
    access_token: `token_${guestId}`,
    token_type: "bearer",
    user: {
      id: guestId,
      email: `${guestId}@platform.app`,
      full_name: "Guest User",
      preferred_model: "qwen-2.5-0.5b-local",
      auth_provider: "guest"
    }
  });
}
