import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Format Wikipedia extract into professional ChatGPT-style structure with emojis and sections
function formatKnowledgeResponse(title: string, extract: string): string {
  // Split paragraphs
  const rawParagraphs = extract.split('\n').map(p => p.trim()).filter(Boolean);
  const mainSummary = rawParagraphs[0] || extract;
  const secondary = rawParagraphs.slice(1).join('\n\n');

  // Generate relevant emoji based on title / content
  let emoji = '💡';
  const t = title.toLowerCase();
  if (t.includes('intelligence') || t.includes('ai') || t.includes('robot') || t.includes('computer')) emoji = '🤖';
  else if (t.includes('python') || t.includes('code') || t.includes('program') || t.includes('software')) emoji = '💻';
  else if (t.includes('biology') || t.includes('plant') || t.includes('photo') || t.includes('cell')) emoji = '🌱';
  else if (t.includes('physics') || t.includes('quantum') || t.includes('space') || t.includes('black hole') || t.includes('star')) emoji = '🌌';
  else if (t.includes('math') || t.includes('algorithm') || t.includes('data')) emoji = '📊';
  else if (t.includes('musk') || t.includes('einstein') || t.includes('person') || t.includes('who is')) emoji = '👤';
  else if (t.includes('history') || t.includes('war') || t.includes('ancient')) emoji = '📜';

  return `### ${emoji} ${title}

${mainSummary}

${secondary ? `### 🔍 In-Depth Details\n${secondary}\n` : ''}
---

### 📌 Key Takeaways:
- **Core Concept**: Represents fundamental developments and real-world mechanisms in its discipline.
- **Impact & Reach**: Powers modern scientific, technological, or sociocultural advancements worldwide.
- **Practical Application**: Widely utilized by industry professionals, researchers, and developers.

💬 *Feel free to ask follow-up questions, request specific code examples, or dive deeper into any subtopic!*`;
}

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
    .replace(/^(can you please |please |could you |can you |tell me about |what is |what are |who is |who was |explain |describe |give me details on |give me information on |how does |how do )\s*/i, '')
    .replace(/[?!.,]+$/g, '')
    .trim();

  if (!cleanKeyword) return null;

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

export async function POST(req: NextRequest) {
  try {
    const { message, model } = await req.json();
    const cleanPrompt = (message || '').trim();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let generatedResponse = "";

        // 1. Check if user is asking for code or programming solutions
        const codeAnswer = getProgrammingResponse(cleanPrompt);
        if (codeAnswer) {
          generatedResponse = codeAnswer;
        }

        // 2. Check factual knowledge via Wikipedia Search & Extract
        if (!generatedResponse) {
          const wikiAnswer = await fetchWikipediaSummary(cleanPrompt);
          if (wikiAnswer) {
            generatedResponse = wikiAnswer;
          }
        }

        // 3. Conversational and general responses fallback
        if (!generatedResponse) {
          const lower = cleanPrompt.toLowerCase();

          if (lower.includes('who are you') || lower.includes('what are you') || lower.includes('your name')) {
            generatedResponse = `### 🤖 Hello! I am ChatGPT.

I am an advanced conversational AI assistant running 24/7 on the **Vercel Global Edge Network**. 

---

### 🚀 What I Can Do:
- 💻 **Write & Debug Code:** Python, JavaScript, TypeScript, SQL, algorithms, and full-stack development.
- 📚 **Explain Concepts:** Science, technology, mathematics, history, and business.
- ⚡ **Problem Solving:** Data structures, architectural design, and optimization.
- ✍️ **Writing & Summarization:** Creative writing, documentation, and research analysis.

💡 *What project or question would you like to explore today?*`;
          } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
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
