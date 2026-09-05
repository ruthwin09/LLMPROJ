import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = `conv_${Date.now()}`;
    return NextResponse.json({
      id,
      title: body.title || 'New Chat',
      model: body.model || 'qwen-2.5-0.5b-local',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
