import axios from 'axios';
import { getStoredToken } from './auth';

// In Firebase production: NEXT_PUBLIC_API_URL points to Cloud Run backend
// In local dev: /api is proxied to localhost:8000 via next.config.js rewrites
const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const streamChatResponse = async (
  payload: {
    conversation_id: string;
    message: string;
    model?: string;
    system_prompt?: string;
    document_ids?: string[];
    document_text?: string;
    document_name?: string;
    memories?: any[];
    api_key?: string;
  },
  onChunk: (chunk: string) => void,
  onError: (err: string) => void,
  onComplete: () => void
) => {
  const token = getStoredToken();
  
  try {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      onError(`Server error (${response.status}): ${errText}`);
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');

    if (!reader) {
      onError('Response body reader not available.');
      return;
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') {
            onComplete();
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.content) {
              onChunk(parsed.content);
            }
          } catch {
            // ignore non-json SSE lines
          }
        }
      }
    }
    onComplete();
  } catch (err: any) {
    onError(err.message || 'Network stream connection error.');
  }
};
