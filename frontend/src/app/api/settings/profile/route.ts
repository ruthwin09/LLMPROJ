import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({
    user: {
      id: "current_user",
      email: "user@chatgpt.platform",
      full_name: body.full_name || "User",
      preferred_model: body.preferred_model || "qwen-2.5-0.5b-local",
      auth_provider: "guest"
    }
  });
}
