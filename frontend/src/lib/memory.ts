import { UserMemory } from '@/types';

const MEMORY_STORAGE_KEY = 'chatgpt_user_memories';
const MEMORY_ENABLED_KEY = 'chatgpt_memory_enabled';

export function isMemoryEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(MEMORY_ENABLED_KEY);
  return val === null ? true : val === 'true';
}

export function setMemoryEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MEMORY_ENABLED_KEY, enabled ? 'true' : 'false');
}

export function getStoredMemories(): UserMemory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredMemories(memories: UserMemory[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
  } catch {}
}

export function addMemory(content: string, category: 'identity' | 'preference' | 'instruction' | 'general' = 'general'): UserMemory {
  const memories = getStoredMemories();
  const cleanContent = content.trim().replace(/^["']|["']$/g, '');

  // Deduplicate exact or very similar memories
  const existingIdx = memories.findIndex(
    (m) => m.content.toLowerCase() === cleanContent.toLowerCase()
  );

  const newMemory: UserMemory = {
    id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    content: cleanContent,
    category,
    created_at: new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    memories[existingIdx] = newMemory;
  } else {
    memories.unshift(newMemory);
  }

  saveStoredMemories(memories);
  return newMemory;
}

export function removeMemory(id: string): UserMemory[] {
  const memories = getStoredMemories().filter((m) => m.id !== id);
  saveStoredMemories(memories);
  return memories;
}

export function removeMemoryByText(text: string): { removed: boolean; remaining: UserMemory[] } {
  const memories = getStoredMemories();
  const lower = text.toLowerCase().trim();
  const remaining = memories.filter((m) => !m.content.toLowerCase().includes(lower));
  const removed = remaining.length < memories.length;
  saveStoredMemories(remaining);
  return { removed, remaining };
}

export function clearAllMemories(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MEMORY_STORAGE_KEY);
}

export interface MemoryIntent {
  type: 'remember' | 'recall' | 'forget' | 'clear' | 'none';
  fact?: string;
  category?: 'identity' | 'preference' | 'instruction' | 'general';
  target?: string;
}

export function detectMemoryIntent(text: string): MemoryIntent {
  const raw = text.trim();
  const lower = raw.toLowerCase();

  // 1. Clear intent
  if (
    /^(?:please\s+)?(?:clear|reset|delete|wipe|erase)\s+(?:all\s+)?memories(?:\s+please)?$/i.test(lower) ||
    /^(?:forget|clear)\s+everything(?:\s+about\s+me)?$/i.test(lower)
  ) {
    return { type: 'clear' };
  }

  // 2. Forget specific intent
  const forgetMatch = raw.match(/^(?:please\s+)?(?:forget|delete\s+memory|remove\s+memory)(?:\s+that|\s+about|\s+my)?\s+(.*)$/i);
  if (forgetMatch && forgetMatch[1]) {
    return {
      type: 'forget',
      target: forgetMatch[1].trim(),
    };
  }

  // 3. Recall intent
  if (
    /what\s+(?:do\s+you|can\s+you)\s+remember\s+(?:about\s+me)?/i.test(lower) ||
    /what\s+are\s+my\s+memories/i.test(lower) ||
    /what\s+do\s+you\s+know\s+about\s+me/i.test(lower) ||
    /show\s+(?:my\s+)?memories/i.test(lower) ||
    /list\s+(?:my\s+)?memories/i.test(lower) ||
    /who\s+am\s+i\b/i.test(lower) ||
    /what(?:\'s|\s+is)\s+my\s+name\b/i.test(lower) ||
    /where\s+do\s+i\s+live\b/i.test(lower) ||
    /what\s+is\s+my\s+favorite\b/i.test(lower) ||
    /what(?:\s+coding|\s+programming)?\s+language\s+do\s+i\s+prefer\b/i.test(lower)
  ) {
    return { type: 'recall', target: raw };
  }

  // 4. Remember intent
  // A) Explicit remember directive: "remember that ...", "remember this: ...", "remember I ...", "remember my ..."
  const rememberMatch = raw.match(
    /^(?:please\s+)?(?:remember\s+(?:that\s+|this[:\s]+|to\s+|my\s+|i\s+)?|keep\s+in\s+mind\s+that\s+|don't\s+forget\s+that\s+|save\s+to\s+memory[:\s]+|always\s+remember\s+(?:that\s+)?)(.*)$/i
  );

  if (rememberMatch && rememberMatch[1]) {
    let fact = rememberMatch[1].trim();
    // Normalize phrasing: "I prefer Python" -> "User prefers Python" or keep first-person formatted
    let category: 'identity' | 'preference' | 'instruction' | 'general' = 'general';

    if (/\b(?:name\s+is|call\s+me|i\s+am\s+named)\b/i.test(fact)) {
      category = 'identity';
    } else if (/\b(?:prefer|like|favorite|love|enjoy|hate|dislike)\b/i.test(fact)) {
      category = 'preference';
    } else if (/\b(?:always|never|format|bullet|concise|style)\b/i.test(fact)) {
      category = 'instruction';
    }

    return {
      type: 'remember',
      fact,
      category,
    };
  }

  // B) Conversational declarative statements: "My name is Bharath"
  const nameMatch = raw.match(/^my\s+name\s+is\s+([A-Za-z\s'-]+)$/i);
  if (nameMatch && nameMatch[1]) {
    return {
      type: 'remember',
      fact: `My name is ${nameMatch[1].trim()}`,
      category: 'identity',
    };
  }

  // C) "My favorite [X] is [Y]"
  const favMatch = raw.match(/^my\s+favorite\s+(\w+)\s+is\s+(.*)$/i);
  if (favMatch && favMatch[1] && favMatch[2]) {
    return {
      type: 'remember',
      fact: `Favorite ${favMatch[1].trim()} is ${favMatch[2].trim()}`,
      category: 'preference',
    };
  }

  return { type: 'none' };
}
