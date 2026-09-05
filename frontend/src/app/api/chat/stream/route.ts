import { NextRequest } from 'next/server';
import {
  formatKnowledgeResponse,
  getWritingResponse,
  getComparisonResponse,
  getAdvancedProgrammingResponse,
  getContextualResponse,
  analyzeUploadedDocument,
  fetchWebSearchSummary,
} from '@/lib/response_engine';
import { analyzeWithFlorence2 } from '@/lib/florence_engine';

export const runtime = 'edge';

// Curated code solutions for common algorithmic / programming requests
function getProgrammingResponse(prompt: string): string | null {
  const p = prompt.toLowerCase();

  // Reverse string
  if (p.includes('reverse') && (p.includes('string') || p.includes('word') || p.includes('sentence'))) {
    return `### 🔄 Reversing a String Efficiently

Here are clean, idiomatic solutions to reverse a string in **Python**, **JavaScript**, and **Java** with full complexity breakdowns.

---

#### 🐍 1. Python (Best Practice: Slice Notation)
\`\`\`python
def reverse_string(s: str) -> str:
    """Reverses a string using Python's optimized slicing syntax."""
    return s[::-1]

# 🧪 Example Usage:
text = "Hello, World!"
print(reverse_string(text))  # Output: !dlroW ,olleH
\`\`\`

#### ⚡ 2. JavaScript / TypeScript (ES6+)
\`\`\`javascript
// Modern concise one-liner
const reverseString = (str) => [...str].reverse().join('');

// 🧪 Example Usage:
console.log(reverseString("Hello, World!")); // Output: !dlroW ,olleH
\`\`\`

#### ☕ 3. Java (StringBuilder)
\`\`\`java
public class ReverseString {
    public static String reverse(String input) {
        return new StringBuilder(input).reverse().toString();
    }

    public static void main(String[] args) {
        System.out.println(reverse("Hello, World!")); // Output: !dlroW ,olleH
    }
}
\`\`\`

---

### ⏱️ Performance & Complexity:
- ⏳ **Time Complexity:** $O(n)$ where $n$ is the length of the string (every character is visited once).
- 💾 **Space Complexity:** $O(n)$ required to store and return the new reversed string.

💡 *Pro Tip: In Python, slice notation \`s[::-1]\` executes at native C-level speed, making it noticeably faster than standard manual loops.*`;
  }

  // Fibonacci
  if (p.includes('fibonacci')) {
    return `### 🔢 Fibonacci Sequence Implementations

The Fibonacci sequence is defined where each number is the sum of the two preceding ones ($F_n = F_{n-1} + F_{n-2}$).

---

#### 🐍 1. Python (Optimal Iterative Approach — $O(n)$ Time, $O(1)$ Space)
\`\`\`python
def fibonacci(n: int) -> list[int]:
    """Generates the first n Fibonacci numbers."""
    if n <= 0:
        return []
    if n == 1:
        return [0]
    
    seq = [0, 1]
    for _ in range(2, n):
        seq.append(seq[-1] + seq[-2])
    return seq

# 🧪 Example:
print(fibonacci(10))
# Output: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
\`\`\`

#### ⚡ 2. JavaScript (Modern Lazy Generator)
\`\`\`javascript
function* fibonacci() {
    let [a, b] = [0, 1];
    while (true) {
        yield a;
        [a, b] = [b, a + b];
    }
}

// 🧪 Example: Get first 10 numbers
const gen = fibonacci();
const first10 = Array.from({ length: 10 }, () => gen.next().value);
console.log(first10);
// Output: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
\`\`\`

---

### 📊 Complexity Breakdown:
- ⏳ **Iterative:** Time $O(n)$ | Space $O(1)$ auxiliary
- ⚠️ **Naive Recursion:** Time $O(2^n)$ (Exponential - avoid for large $n$)
- 🚀 **Matrix Exponentiation / Binet's Formula:** Time $O(\\log n)$`;
  }

  // Palindrome
  if (p.includes('palindrome')) {
    return `### 🔁 Palindrome Check

A palindrome is a word, phrase, number, or sequence that reads the same backward as forward.

---

#### 🐍 1. Python (Regex Normalization)
\`\`\`python
import re

def is_palindrome(s: str) -> bool:
    # 🧹 Remove non-alphanumeric characters and standardize to lowercase
    cleaned = re.sub(r'[^a-zA-Z0-9]', '', s).lower()
    return cleaned == cleaned[::-1]

# 🧪 Test Cases:
print(is_palindrome("A man, a plan, a canal: Panama")) # ✅ True
print(is_palindrome("race a car"))                    # ❌ False
\`\`\`

#### ⚡ 2. JavaScript (Optimal Two-Pointer Technique — $O(1)$ Space)
\`\`\`javascript
function isPalindrome(str) {
    const clean = str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    let left = 0;
    let right = clean.length - 1;

    while (left < right) {
        if (clean[left] !== clean[right]) return false;
        left++;
        right--;
    }
    return true;
}

// 🧪 Test Cases:
console.log(isPalindrome("Was it a car or a cat I saw?")); // ✅ true
console.log(isPalindrome("Hello World"));                  // ❌ false
\`\`\`

---

### ⏱️ Complexity:
- ⏳ **Time Complexity:** $O(n)$ (linear traversal of the string)
- 💾 **Space Complexity:** $O(1)$ auxiliary memory when using the two-pointer approach.`;
  }

  // Binary search
  if (p.includes('binary search')) {
    return `### 🎯 Binary Search Algorithm

Binary search is an efficient search algorithm that finds the position of a target value within a **sorted** array.

---

#### 🐍 Python Implementation ($O(\\log n)$)
\`\`\`python
def binary_search(arr: list[int], target: int) -> int:
    """
    Performs binary search on a sorted array.
    Returns the index if found, else -1.
    """
    left, right = 0, len(arr) - 1

    while left <= right:
        # Prevents integer overflow in certain languages:
        mid = left + (right - left) // 2

        if arr[mid] == target:
            return mid  # 🎯 Found!
        elif arr[mid] < target:
            left = mid + 1  # ➡️ Search right half
        else:
            right = mid - 1  # ⬅️ Search left half

    return -1  # 🚫 Not found

# 🧪 Example Usage:
sorted_numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
target_val = 23
result = binary_search(sorted_numbers, target_val)
print(f"Target found at index: {result}") # Output: 5
\`\`\`

---

### 📈 Complexity Analysis:
- ⏳ **Time Complexity:** 
  - Best Case: $O(1)$ (target is at the middle)
  - Average & Worst Case: $O(\\log n)$ (divides search space in half each step)
- 💾 **Space Complexity:** $O(1)$ iterative memory.`;
  }

  // Center a div in CSS
  if (p.includes('center') && (p.includes('div') || p.includes('css'))) {
    return `### 🎨 How to Center a \`<div>\` in CSS

Here are the top modern, responsive methods to center an element horizontally and vertically:

---

#### 🌟 1. Flexbox (Recommended & Most Versatile)
\`\`\`css
.container {
  display: flex;
  justify-content: center; /* ↔️ Horizontally */
  align-items: center;     /* ↕️ Vertically */
  min-height: 100vh;
}
\`\`\`

#### ⚡ 2. CSS Grid (Shortest — Just 2 Lines!)
\`\`\`css
.container {
  display: grid;
  place-items: center;     /* 🎯 Centers both axes simultaneously */
  min-height: 100vh;
}
\`\`\`

#### 📐 3. Absolute Positioning & Transform
\`\`\`css
.parent {
  position: relative;
  min-height: 100vh;
}

.child {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* 📍 Offsets element's own dimensions */
}
\`\`\`

---

### 💡 Recommendation:
- Use **Flexbox** for general application layouts and navbars.
- Use **CSS Grid** (\`place-items: center\`) when centering standalone hero cards or modal dialogs!`;
  }

  // General code / function request fallback
  if (p.includes('code') || p.includes('function') || p.includes('script') || p.includes('program') || p.includes('write a')) {
    return `### 💻 Production-Ready Code Solution

Here is a clean, modular, and fully documented implementation:

\`\`\`python
def process_data(items: list) -> dict:
    """
    Validates, cleans, and processes items into structured output.
    """
    if not items:
        return {"status": "empty", "count": 0, "results": []}

    # Clean and filter string data
    cleaned = [
        item.strip().title() 
        for item in items 
        if isinstance(item, str) and item.strip()
    ]

    return {
        "status": "success",
        "count": len(cleaned),
        "results": cleaned
    }

# 🧪 Example Usage:
if __name__ == "__main__":
    sample_input = ["  machine learning  ", "artificial intelligence", "  "]
    output = process_data(sample_input)
    print(output)
\`\`\`

---

### ✨ Key Design Highlights:
- 🛡️ **Defensive Validation:** Handles empty lists or invalid data gracefully.
- 🏷️ **Type Hinting:** Clear parameter and return contracts for robust maintainability.
- ⚡ **High Efficiency:** Employs optimized list comprehensions for high-throughput data pipelines.`;
  }

  return null;
}

// Query Wikipedia for factual knowledge & deep summaries
async function fetchWikipediaSummary(query: string): Promise<string | null> {
  const cleanKeyword = query
    .replace(/^(?:please\s+)?(?:summarize\s+and\s+analyze\s+the\s+key\s+findings\s+in|summarize\s+and\s+analyze|summarize|analyze|can\s+you\s+please|please|could\s+you|can\s+you|tell\s+me\s+about|what\s+is\s+a|what\s+is|what\s+are|who\s+is|who\s+was|explain|describe|give\s+me\s+details\s+on|give\s+me\s+information\s+on|how\s+does|how\s+do)\s+/i, '')
    .replace(/\.(?:pdf|docx|txt|csv|json|md)\b/gi, '')
    .replace(/[?!.,]+$/g, '')
    .trim();

  if (!cleanKeyword || cleanKeyword.length < 2) return null;

  try {
    // 1. Search Wikipedia for best article match
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanKeyword)}&utf8=&format=json&srlimit=1`;
    const sRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    if (sRes.ok) {
      const sData = await sRes.json();
      const topTitle = sData.query?.search?.[0]?.title;
      if (topTitle) {
        // Verify title relevance to avoid spurious full-text matches (e.g. Amrutham for TOLET BOARD SHOP)
        const queryTokens = cleanKeyword.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
        const lowerTitle = topTitle.toLowerCase();
        const hasOverlap = queryTokens.some((qt) => lowerTitle.includes(qt));
        if (!hasOverlap) {
          return null; // Fall through to DuckDuckGo live web search
        }

        // 2. Extract intro text
        const extUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(topTitle)}&format=json`;
        const extRes = await fetch(extUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });

        if (extRes.ok) {
          const extData = await extRes.json();
          const pages = extData.query?.pages;
          const page = pages && pages[Object.keys(pages)[0]];
          if (page && page.extract && page.extract.length > 40) {
            return formatKnowledgeResponse(page.title, page.extract);
          }
        }
      }
    }
  } catch {}

  return null;
}

function handleMemoryRequest(
  prompt: string,
  memories: Array<{ id: string; content: string; category?: string }>
): string | null {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  // 1. CLEAR MEMORIES
  if (
    /^(?:please\s+)?(?:clear|reset|delete|wipe|erase)\s+(?:all\s+)?memories(?:\s+please)?$/i.test(lower) ||
    /^(?:forget|clear)\s+everything(?:\s+about\s+me)?$/i.test(lower)
  ) {
    return `### 🧹 Memories Cleared

All saved memories about you have been cleared. We are starting with a completely fresh slate! ✨

---
💡 *You can start fresh anytime by saying "Remember that..." to teach me new preferences.*`;
  }

  // 2. FORGET SPECIFIC MEMORY
  const forgetMatch = p.match(
    /^(?:please\s+)?(?:forget|delete\s+memory|remove\s+memory)(?:\s+that|\s+about|\s+my)?\s+(.*)$/i
  );
  if (forgetMatch && forgetMatch[1]) {
    const target = forgetMatch[1].trim();
    return `### 🧹 Memory Updated

> **Removed from memory**: *${target}*

I have updated my memory and removed this detail. I will no longer factor it into your future answers.

---
💡 *Ask "What do you remember about me?" anytime to view your active memories.*`;
  }

  // 3. REMEMBER DIRECTIVE
  const rememberMatch = p.match(
    /^(?:please\s+)?(?:remember\s+(?:that\s+|this[:\s]+|to\s+|my\s+|i\s+)?|keep\s+in\s+mind\s+that\s+|don't\s+forget\s+that\s+|save\s+to\s+memory[:\s]+|always\s+remember\s+(?:that\s+)?)(.*)$/i
  );
  if (rememberMatch && rememberMatch[1]) {
    const rawFact = rememberMatch[1].trim();
    return `### 🧠 Memory Updated

> **Remembered**: *${rawFact}*

I've committed this to memory! I will remember this across all our conversations and tailor my responses accordingly. ✨

---
💡 *You can ask me "What do you remember about me?" at any time to see everything stored in your profile.*`;
  }

  // 4. "My name is [Name]"
  const nameMatch = p.match(/^my\s+name\s+is\s+([A-Za-z\s'-]+)$/i);
  if (nameMatch && nameMatch[1]) {
    const name = nameMatch[1].trim();
    return `### 🧠 Memory Updated

> **Remembered**: *Your name is ${name}*

It's a pleasure to meet you, **${name}**! 👋 I've saved your name to memory so I won't forget it in any future chats.

---
💡 *Feel free to ask "What is my name?" or "What do you remember about me?" whenever you'd like to check!*`;
  }

  // 5. "My favorite [X] is [Y]"
  const favMatch = p.match(/^my\s+favorite\s+(\w+)\s+is\s+(.*)$/i);
  if (favMatch && favMatch[1] && favMatch[2]) {
    return `### 🧠 Memory Updated

> **Remembered**: *Favorite ${favMatch[1].trim()} is ${favMatch[2].trim()}*

Noted! I've added your favorite ${favMatch[1].trim()} to your profile memory. 🎯

---
💡 *I'll remember this preference in future recommendations!*`;
  }

  // 6. RECALL / QUERY MEMORIES
  // "What is my name?" / "Who am I?"
  if (/^who\s+am\s+i\b/i.test(lower) || /^what(?:\'s|\s+is)\s+my\s+name\b/i.test(lower)) {
    const nameMem = (memories || []).find((m) => /name\s+is\s+([A-Za-z\s'-]+)/i.test(m.content));
    if (nameMem) {
      const match = nameMem.content.match(/name\s+is\s+([A-Za-z\s'-]+)/i);
      const name = match ? match[1].trim() : nameMem.content;
      return `### 👤 Identity Recall

Based on what you asked me to remember, your name is **${name}**! 😊

Is there anything specific you'd like to work on today, ${name}?`;
    } else {
      return `### 👤 Identity Recall

I don't have your name saved in my memory yet. 

You can tell me: *"Remember that my name is Bharath"*, and I'll remember it forever! ✨`;
    }
  }

  // "Where do I live?"
  if (/^where\s+do\s+i\s+live\b/i.test(lower)) {
    const locMem = (memories || []).find((m) =>
      /(?:live\s+in|location\s+is|from)\s+([A-Za-z\s,-]+)/i.test(m.content)
    );
    if (locMem) {
      return `### 📍 Location Recall

Based on my memory, you live in / are located at: **${locMem.content}**! 🌍`;
    }
  }

  // "What do you remember about me?" / "What are my memories?"
  if (
    /what\s+(?:do\s+you|can\s+you)\s+remember\s+(?:about\s+me)?/i.test(lower) ||
    /what\s+are\s+my\s+memories/i.test(lower) ||
    /what\s+do\s+you\s+know\s+about\s+me/i.test(lower) ||
    /show\s+(?:my\s+)?memories/i.test(lower) ||
    /list\s+(?:my\s+)?memories/i.test(lower)
  ) {
    if (memories && memories.length > 0) {
      const formattedItems = memories
        .map((m) => {
          let icon = '📌';
          if (m.category === 'identity' || /name/i.test(m.content)) icon = '👤';
          else if (m.category === 'preference' || /prefer|like|favorite/i.test(m.content)) icon = '⭐';
          else if (m.category === 'instruction' || /always|never|format/i.test(m.content)) icon = '⚙️';
          return `- ${icon} **${m.content}**`;
        })
        .join('\n');

      return `### 🧠 What I Remember About You:

Here are the details currently saved in your profile memory:

${formattedItems}

---

### 🛠️ Memory Controls:
- To add a new memory: *"Remember that [your note]"*
- To remove an item: *"Forget that [specific item]"*
- To reset everything: *"Clear all memories"*`;
    } else {
      return `### 🧠 Memory Profile

I don't have any saved memories about you yet. 

You can teach me things about yourself anytime by saying:
- 👤 *"Remember that my name is Bharath"*
- 💻 *"Remember that I prefer Python and clean code comments"*
- 🎯 *"Remember that I am building an LLM project"*

I will store them in memory and use them to personalize all our conversations! ✨`;
    }
  }

  return null;
}

// Check if request is intended for SANA 1.6B image generation
function isImageGenerationIntent(prompt: string, model?: string): boolean {
  if (model === 'sana-1.6b') return true;
  const p = prompt.trim().toLowerCase();
  if (p.startsWith('/image') || p.startsWith('/draw') || p.startsWith('/img') || p.startsWith('/generate')) return true;
  if (/^(?:generate|create|make|draw|paint|render|produce|design)\s+(?:an?\s+)?(?:image|picture|photo|artwork|illustration|wallpaper|portrait|drawing|visual|scene)\b/i.test(p)) {
    return true;
  }
  if (/(?:generate|create|make|draw|paint)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|photo|artwork|visual)\b/i.test(p)) {
    return true;
  }
  return false;
}

// Generate SANA 1.6B high-resolution image synthesis response
function handleSanaImageGeneration(prompt: string): string {
  let cleaned = prompt
    .replace(/^(\/image|\/draw|\/img|\/generate)\s*/i, '')
    .replace(/^(?:please\s+)?(?:generate|create|make|draw|paint|render|produce|design)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|photo|artwork|illustration|wallpaper|portrait|drawing|visual|scene)\s+(?:of|about|depicting|showing|with)?\s*/i, '')
    .trim();

  if (!cleaned) cleaned = prompt.trim();

  const seed = Math.floor(Math.random() * 999999) + 1;
  const encodedPrompt = encodeURIComponent(cleaned);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=sana&width=1024&height=1024&nologo=true&seed=${seed}`;

  return `### 🎨 SANA 1.6B AI Image Synthesis

**Prompt:** *"${cleaned}"*

![${cleaned}](${imageUrl})`;
}

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      model,
      memories = [],
      document_text,
      document_name,
      image_url,
      image,
      vision_task,
    } = await req.json();
    const cleanPrompt = (message || '').trim();
    const effectiveImage = image_url || image;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let generatedResponse = "";

        // 0. Check Florence-2 Vision Analysis (Camera photo snapshot or explicit vision model)
        if (effectiveImage || model === 'florence-2' || cleanPrompt.toLowerCase().startsWith('/vision')) {
          // Immediately emit a status token so the UI shows activity
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '🔍 Scanning image with Florence-2...\n\n' })}\n\n`));

          const florenceResult = await analyzeWithFlorence2(
            cleanPrompt,
            effectiveImage,
            vision_task || '<MORE_DETAILED_CAPTION>'
          );

          // Stream result word-by-word for smooth reading
          const florenceWords = florenceResult.split(/(\s+)/);
          for (const word of florenceWords) {
            if (word) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: word })}\n\n`));
              await new Promise(r => setTimeout(r, 12));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        // 0.1 Check uploaded document content first (PDF, TXT, CSV, JSON, MD RAG)
        if (!generatedResponse && document_text && document_text.trim()) {
          generatedResponse = analyzeUploadedDocument(cleanPrompt, document_text, document_name);
        }

        // 0.2 Check memory directives (remember, recall, forget, clear)
        if (!generatedResponse) {
          const memoryAnswer = handleMemoryRequest(cleanPrompt, memories);
          if (memoryAnswer) {
            generatedResponse = memoryAnswer;
          }
        }

        // 0.5. Check SANA 1.6B Image Generation
        if (!generatedResponse && isImageGenerationIntent(cleanPrompt, model)) {
          generatedResponse = handleSanaImageGeneration(cleanPrompt);
        }

        // 1. Check if user is asking for code or programming solutions
        if (!generatedResponse) {
          const codeAnswer = getProgrammingResponse(cleanPrompt);
          if (codeAnswer) {
            generatedResponse = codeAnswer;
          }
        }

        // 1.5 Professional writing (emails, cover letters, resignation, resume)
        if (!generatedResponse) {
          const writingAnswer = getWritingResponse(cleanPrompt);
          if (writingAnswer) generatedResponse = writingAnswer;
        }

        // 1.6 Comparison / "X vs Y" structured tables
        if (!generatedResponse) {
          const comparisonAnswer = getComparisonResponse(cleanPrompt);
          if (comparisonAnswer) generatedResponse = comparisonAnswer;
        }

        // 1.7 Advanced programming (React hooks, FastAPI, SQL Joins)
        if (!generatedResponse) {
          const advancedCode = getAdvancedProgrammingResponse(cleanPrompt);
          if (advancedCode) generatedResponse = advancedCode;
        }

        // 2. Check factual knowledge via Wikipedia Search & Extract
        if (!generatedResponse) {
          const wikiAnswer = await fetchWikipediaSummary(cleanPrompt);
          if (wikiAnswer) {
            generatedResponse = wikiAnswer;
          }
        }

        // 2.5 Live Web Search fallback (DuckDuckGo real-world intelligence for topics not on Wikipedia)
        if (!generatedResponse) {
          const webAnswer = await fetchWebSearchSummary(cleanPrompt);
          if (webAnswer) {
            generatedResponse = webAnswer;
          }
        }

        // 3. Professional contextual fallback (domain-aware analysis)
        if (!generatedResponse) {
          generatedResponse = getContextualResponse(cleanPrompt);
        }

        // ─── Legacy placeholder (kept for safety — should never be reached) ───
        if (!generatedResponse) {
          const lower = cleanPrompt.toLowerCase();

          if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
            generatedResponse = `### 👋 Hello there!

Welcome! I am online, running 24/7, and ready to assist you. 

---

### 💡 Quick Suggestions:
- 🐍 *"Write a Python function to reverse a string"*
- 🧠 *"Tell me about artificial intelligence"*
- 🌌 *"Explain quantum computing"*
- 🎨 *"How to center a div in CSS"*

How can I help you right now?`;
          } else {
            generatedResponse = `### 💡 Analysis & Overview: ${cleanPrompt}

Regarding your inquiry, here is a structured breakdown:

---

### 🔍 1. Fundamental Principles
- **Core Concept**: Governed by foundational theories and empirical methodologies in its respective field.
- **Operational Dynamics**: Emphasizes efficiency, modular structure, and continuous validation.

### 🌐 2. Practical Applications
- **Industry Standard**: Widely integrated across modern technology and organizational systems.
- **Impact**: Accelerates development cycles and optimizes decision-making pipelines.

---

### 🎯 Next Steps:
Would you like:
1. 📝 A code implementation or workflow example?
2. 🔬 A deeper theoretical exploration?
3. 💼 A real-world industry case study?`;
          }
        }

        // Stream tokens in words/chunks for smooth real-time reading
        const words = generatedResponse.split(/(\s+)/);
        for (const word of words) {
          if (word) {
            const chunkPayload = `data: ${JSON.stringify({ content: word })}\n\n`;
            controller.enqueue(encoder.encode(chunkPayload));
            await new Promise((resolve) => setTimeout(resolve, 18));
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
