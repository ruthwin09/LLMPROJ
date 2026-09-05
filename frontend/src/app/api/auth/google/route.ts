import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();
    let email = "user@gmail.com";
    let name = "Google User";
    let picture = "";
    let sub = `google_${Date.now()}`;

    if (credential) {
      try {
        const parts = credential.split(".");
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
          email = payload.email || email;
          name = payload.name || payload.given_name || name;
          picture = payload.picture || "";
          sub = payload.sub || sub;
        }
      } catch {}
    }

    return NextResponse.json({
      access_token: `token_${sub}`,
      token_type: "bearer",
      user: {
        id: sub,
        email,
        full_name: name,
        avatar_url: picture,
        preferred_model: "qwen-2.5-0.5b-local",
        auth_provider: "google"
      }
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 400 });
  }
}
