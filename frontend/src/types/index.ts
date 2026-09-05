export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferred_model: string;
  auth_provider: string;
}

export interface Citation {
  filename: string;
  page: number;
  text: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  feedback?: 'upvote' | 'downvote';
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface UserMemory {
  id: string;
  content: string;
  created_at: string;
  category?: 'identity' | 'preference' | 'instruction' | 'general';
}

export interface DocumentFile {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  page_count: number;
  chunk_count: number;
  created_at: string;
}

