import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithFlorence2 } from '@/lib/florence_engine';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { image, task = '<MORE_DETAILED_CAPTION>', prompt = '' } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data is required.' }, { status: 400 });
    }

    const analysis = analyzeWithFlorence2(prompt, image, task);

    return NextResponse.json({
      model: 'microsoft/Florence-2-large',
      task,
      analysis,
    });
  } catch (error: any) {
    console.error('Florence-2 vision API error:', error);
    return NextResponse.json(
      { error: 'Florence-2 vision analysis failed', detail: error.message },
      { status: 500 }
    );
  }
}
