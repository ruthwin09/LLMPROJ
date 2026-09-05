import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithFlorence2 } from '@/lib/florence_engine';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { image, task = '<MORE_DETAILED_CAPTION>', prompt = '', extracted_text, document_text } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data is required.' }, { status: 400 });
    }

    const textToUse = extracted_text || document_text;
    const analysis = await analyzeWithFlorence2(prompt, image, task, textToUse);

    return NextResponse.json({
      model: 'Florence-2 Vision LLM',
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
