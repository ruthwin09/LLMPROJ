import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json({
    id: `doc_${Date.now()}`,
    filename: "document.txt",
    message: "File uploaded successfully"
  });
}
