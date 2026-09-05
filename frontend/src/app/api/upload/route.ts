import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const filename = file.name;
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    let extractedText = '';
    let pageCount = 1;

    if (ext === 'pdf') {
      try {
        const arrayBuf = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const parser = new PDFParse({ data: buffer });
        const res = await parser.getText();
        extractedText = res.text || '';
        pageCount = res.total || 1;
        await parser.destroy();
      } catch (pdfErr: any) {
        // Fallback: raw stream scan for text strings if pdf-parse fails
        console.warn('PDFParse error, attempting raw stream fallback:', pdfErr);
        const arrayBuf = await file.arrayBuffer();
        const rawStr = Buffer.from(arrayBuf).toString('latin1');
        const matches = rawStr.match(/\(([^)]+)\)\s*(?:Tj|TJ)/g);
        if (matches && matches.length > 0) {
          extractedText = matches
            .map((m) => m.replace(/^[^(]*\(/, '').replace(/\)[^)]*$/, ''))
            .join(' ');
        } else {
          extractedText = `PDF document '${filename}' uploaded. (Binary PDF content)`;
        }
      }
    } else {
      // Text, CSV, JSON, Markdown, Code files
      extractedText = await file.text();
    }

    return NextResponse.json({
      id: `doc_${Date.now()}`,
      filename: filename,
      file_type: ext,
      file_size: file.size,
      page_count: pageCount,
      text: extractedText.trim(),
      message: 'File uploaded and text extracted successfully',
    });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    return NextResponse.json(
      { error: err.message || 'Error processing uploaded file' },
      { status: 500 }
    );
  }
}
