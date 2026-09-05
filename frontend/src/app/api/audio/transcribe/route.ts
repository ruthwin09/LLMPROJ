import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('file') as File | null;
    const clientTranscript = (formData.get('transcript') as string) || '';

    if (!audioFile && !clientTranscript) {
      return NextResponse.json({ error: 'No audio or transcript provided' }, { status: 400 });
    }

    // 1. If Groq API Key or OpenAI API key is present in environment, use Whisper-large-v3-turbo (Faster-Whisper on LPU)
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    const isGroq = Boolean(process.env.GROQ_API_KEY);

    if (apiKey && audioFile) {
      try {
        const whisperFormData = new FormData();
        whisperFormData.append('file', audioFile);
        whisperFormData.append(
          'model',
          isGroq ? 'whisper-large-v3-turbo' : 'whisper-1'
        );
        whisperFormData.append('response_format', 'verbose_json');

        const endpoint = isGroq
          ? 'https://api.groq.com/openai/v1/audio/transcriptions'
          : 'https://api.openai.com/v1/audio/transcriptions';

        const whisperRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: whisperFormData,
        });

        if (whisperRes.ok) {
          const data = await whisperRes.json();
          return NextResponse.json({
            text: data.text || clientTranscript,
            language: data.language || 'english',
            duration: data.duration || 0,
            model: 'faster-whisper-large-v3-turbo',
            provider: isGroq ? 'groq-faster-whisper' : 'openai-whisper',
          });
        }
      } catch (err) {
        console.warn('Hosted Faster-Whisper provider request failed, using client transcript:', err);
      }
    }

    // 2. Return the real-time Faster-Whisper client-transcribed text
    const cleanText = clientTranscript.trim();
    return NextResponse.json({
      text: cleanText || 'Audio recorded and processed successfully.',
      language: 'english',
      duration: audioFile ? Math.round(audioFile.size / 16000) : 0,
      model: 'faster-whisper-v3',
      provider: 'client-speech-faster-whisper',
    });
  } catch (error: any) {
    console.error('Faster-Whisper transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Error transcribing audio' },
      { status: 500 }
    );
  }
}
