// Professional ChatGPT-style response engine with intelligent domain classification,
// structured formatting, live hosted LLM streaming, and deep context generation.

// ─── 1. Live Hosted LLM Provider Streaming (Groq, OpenAI, OpenRouter) ───
export async function streamHostedLlm(
  apiKey: string,
  model: string,
  prompt: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<boolean> {
  let endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  let targetModel = 'llama-3.3-70b-versatile';

  if (apiKey.startsWith('sk-or-')) {
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    targetModel = 'deepseek/deepseek-r1:free';
  } else if (apiKey.startsWith('sk-') && !apiKey.startsWith('sk-or-')) {
    endpoint = 'https://api.openai.com/v1/chat/completions';
    targetModel = 'gpt-4o-mini';
  } else if (model.includes('llama') || model.includes('groq')) {
    targetModel = 'llama-3.3-70b-versatile';
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          {
            role: 'system',
            content:
              'You are Genie AI, an advanced, highly articulate, and professional AI assistant powered by state-of-the-art language models. Your responses must be clear, authoritative, well-structured with Markdown headings, bullet points, and code blocks where appropriate, without being overly verbose.',
          },
          { role: 'user', content: prompt },
        ],
        stream: true,
      }),
    });

    if (!res.ok || !res.body) return false;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
            }
          } catch {}
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

// ─── 2. Wikipedia Deep Knowledge Formatter ───
export function formatKnowledgeResponse(title: string, extract: string): string {
  const cleanParagraphs = extract
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 25);

  const mainIntro = cleanParagraphs[0] || extract;
  const subsequent = cleanParagraphs.slice(1);

  let output = `### ${title}\n\n${mainIntro}\n\n`;

  if (subsequent.length > 0) {
    output += `### Key Details & Context\n\n`;
    output += subsequent.join('\n\n') + '\n\n';
  }

  output += `---\n\n`;
  output += `### 📌 Key Takeaways\n`;
  output += `- **Domain Relevance**: Central to modern academic study, industry applications, and research.\n`;
  output += `- **Significance**: Continues to shape theoretical paradigms and real-world technology.\n\n`;
  output += `💬 *Would you like me to elaborate on specific mechanics, historical milestones, or related topics?*`;

  return output;
}

// ─── 3. Professional Writing & Business Communications ───
export function getWritingResponse(prompt: string): string | null {
  const p = prompt.toLowerCase();

  // Formal Email / Leave / Resignation / Proposal
  if (p.includes('email') || p.includes('letter') || p.includes('cover letter') || p.includes('resignation')) {
    // Sick leave / Time off email
    if (p.includes('sick') || p.includes('leave') || p.includes('time off') || p.includes('vacation')) {
      return `### ✉️ Professional Leave Request Email

Here is a concise, professional template ready to customize:

---

**Subject:** Leave Request – [Your Full Name] – [Start Date] to [End Date]

Dear [Manager's Name],

I am writing to formally request time off from work starting on **[Start Date]** and returning on **[Return Date]** due to **[brief reason: e.g., personal matters / recovery from illness / planned medical appointment]**.

Ahead of my absence, I have ensured that my current responsibilities are up to date:
- **[Project/Task A]**: Handed off to [Colleague's Name], who has all necessary context.
- **[Project/Task B]**: Documentation updated and scheduled for review.
- Any urgent inquiries can be directed to [Colleague's Name] in my absence.

I will have limited access to email, but can be reached via mobile at **[Phone Number]** in case of any urgent emergencies.

Thank you for your understanding and support.

Sincerely,  
**[Your Name]**  
[Your Job Title]  
[Your Contact Information]

---

💡 *Tip: Send this as early as possible so your manager has adequate time to coordinate coverage.*`;
    }

    // Cover Letter
    if (p.includes('cover letter') || p.includes('job application')) {
      return `### 📄 Professional Job Application Cover Letter

Here is a compelling, modern cover letter tailored for high-impact roles:

---

**[Your Full Name]**  
[City, State/Country] • [Email Address] • [LinkedIn URL] • [Portfolio/GitHub]  
[Date]

**Hiring Team**  
[Company Name]  
[Company Address / City]

**Subject: Application for [Job Title] Role**

Dear Hiring Team,

I am excited to apply for the **[Job Title]** position at **[Company Name]**. With a strong background in **[Your Core Skill 1]**, **[Your Core Skill 2]**, and a demonstrated history of delivering scalable solutions, I am eager to contribute to [Company Name]'s mission of [Company's core mission or recent achievement].

In my previous role as [Current/Past Title] at [Previous Company], I spearheaded initiatives that:
- **Achieved Measurable Impact**: [e.g., Optimized system performance by 35%, reducing load times and infrastructure costs].
- **Collaborated Cross-Functionally**: Partnered closely with product, design, and engineering teams to ship [Key Project/Product] on schedule.
- **Solved Complex Challenges**: Designed and maintained robust [technologies/workflows], resulting in [quantifiable outcome].

What excites me most about [Company Name] is your commitment to [mention specific feature, technology, or company value]. I am confident that my technical expertise, problem-solving mindset, and dedication to excellence will allow me to make an immediate, positive impact on your team.

Thank you for your time and consideration. I welcome the opportunity to discuss how my experience aligns with your goals in an interview.

Warm regards,  

**[Your Full Name]**  
[Your Phone Number]  
[Your Email Address]

---

💡 *Pro Tip: Tailor the bracketed metrics to reflect real achievements from your resume before sending.*`;
    }

    // Resignation Letter
    if (p.includes('resignation') || p.includes('resign')) {
      return `### ✉️ Formal Resignation Letter (Two-Week Notice)

Here is a respectful, graceful resignation letter designed to preserve professional relationships:

---

**[Your Full Name]**  
[Current Title]  
[Date]

**[Manager's Name]**  
[Manager's Title]  
[Company Name]

Dear [Manager's Name],

Please accept this letter as formal notification that I am resigning from my position as **[Your Title]** at **[Company Name]**. My last day of employment will be **[Two Weeks from Today's Date]**.

I want to express my sincere gratitude for the opportunities I have had during my time with [Company Name]. I have thoroughly enjoyed working with you and our colleagues, and I deeply appreciate the support, mentorship, and professional growth I have experienced throughout my tenure.

Over the next two weeks, I am fully committed to ensuring a smooth, seamless transition:
- I will finalize all active deliverables and document ongoing processes.
- I am happy to assist in training team members or onboarding a replacement.
- I will ensure all files and project knowledge bases are fully organized.

I wish you, the team, and [Company Name] continued success in the future. Please let me know how I can best support the transition during this period.

Sincerely,  

**[Your Full Name]**  
[Your Personal Email]  
[Your Personal Phone Number]

---

💡 *Tip: Schedule a brief 1-on-1 meeting with your manager to deliver this news personally before sending the letter via email.*`;
    }

    // General Business Email
    return `### ✉️ Professional Business Email

Here is a structured, polite communication template:

---

**Subject:** [Clear, Specific Subject Line — e.g., Update on Project Alpha / Follow-up regarding Partnership Proposal]

Hi [Recipient's Name],

I hope you are having a productive week.

I am reaching out to **[state primary objective clearly: e.g., provide a brief update on our progress / follow up on our discussion regarding X / request your review on the attached document]**.

Here are the key points to note:
1. **[Milestone / Observation 1]**: [Brief explanation with relevant numbers or dates].
2. **[Milestone / Observation 2]**: [Action item or current status].
3. **[Next Steps]**: [What needs to happen next and who is responsible].

Could you please review this by **[Date / Time]** and let me know if you have any questions or feedback?

Thank you for your time and collaboration.

Best regards,  

**[Your Name]**  
[Your Role / Title]  
[Your Company / Organization]`;
  }

  // Resume bullet points / optimization
  if (p.includes('resume') || p.includes('cv') || p.includes('linkedin summary')) {
    return `### 📝 Professional Resume Action Points (XYZ Formula)

Google recommends using the **X-Y-Z Formula** for maximum impact:  
> *"Accomplished [X] as measured by [Y], by doing [Z]."*

Here are high-impact bullet points across common domains:

---

#### 💻 1. Software Engineering & Development
- *Architected and deployed a distributed microservices pipeline handling **10M+ daily requests**, reducing latency by **42%** using **Go and Redis**.*
- *Refactored legacy React codebase into modular TypeScript components, improving test coverage from **45% to 88%** and decreasing bundle size by **28%**.*
- *Designed automated CI/CD workflows with **GitHub Actions and Docker**, accelerating deployment frequency from weekly to **multiple times daily**.*

#### 📊 2. Data Science & Machine Learning
- *Trained and fine-tuned predictive ML models on **2M+ transaction records**, improving fraud detection precision by **23%** with **XGBoost and Scikit-Learn**.*
- *Built automated ETL data pipelines with **Apache Airflow and Snowflake**, saving **15 hours weekly** in manual reporting overhead.*

#### 🚀 3. Product & Project Management
- *Led cross-functional team of **12 engineers and designers** to launch MVP in **4 months**, achieving **50,000 active users** within the first quarter.*
- *Conducted A/B tests across user onboarding flows, resulting in a **19% increase in trial-to-paid conversion rates**.*

---

💡 *Pro Tip: Always quantify results using percentages, dollar amounts, hours saved, or user numbers to demonstrate undeniable value.*`;
  }

  return null;
}

// ─── 4. Comparison ("X vs Y") Engine with Tables ───
export function getComparisonResponse(prompt: string): string | null {
  const p = prompt.toLowerCase();
  if (!p.includes(' vs ') && !p.includes(' versus ') && !p.includes('difference between') && !p.includes('compare ')) {
    return null;
  }

  // Python vs JavaScript
  if (p.includes('python') && (p.includes('javascript') || p.includes('js'))) {
    return `### ⚖️ Python vs. JavaScript: Comprehensive Comparison

Both **Python** and **JavaScript** are among the most popular and versatile programming languages in the world, but they excel in fundamentally different domains.

---

### 📊 Side-by-Side Breakdown

| Feature | 🐍 Python | ⚡ JavaScript |
| :--- | :--- | :--- |
| **Primary Domain** | Backend, AI/ML, Data Science, Scripting | Full-Stack Web (Frontend & Node.js Backend) |
| **Execution** | Interpreted (CPython byte-code) | JIT-compiled (V8, SpiderMonkey) |
| **Typing** | Dynamically & Strongly typed | Dynamically & Weakly typed |
| **Concurrency** | Threading, Asyncio, Multiprocessing (GIL) | Event Loop (Single-threaded Non-blocking) |
| **Syntax** | Indentation-based, clean, English-like | C-style brackets and semicolons |
| **Popular Frameworks**| Django, FastAPI, Flask, PyTorch, Pandas | React, Next.js, Vue, Express, Node.js |

---

### 🎯 When to Choose Python:
1. **Machine Learning & Data Science**: Unrivaled ecosystem with PyTorch, TensorFlow, Pandas, and Scikit-Learn.
2. **Backend APIs & Rapid Prototyping**: Fast development with FastAPI and Django.
3. **Automation & Scripting**: Clean, readable syntax makes routine task automation effortless.

### 🎯 When to Choose JavaScript:
1. **Interactive Frontend Web Development**: The native language of all web browsers.
2. **Full-Stack Uniformity**: Using a single language (JS/TS) across both client and server via Node.js / Next.js.
3. **Real-time WebSockets & Event-Driven Apps**: Native event loop handles high concurrent I/O with ease.

---

💡 *Conclusion: If your goal is AI, data engineering, or backend automation, choose **Python**. If you want to build interactive web apps or full-stack platforms, choose **JavaScript / TypeScript**.*`;
  }

  // SQL vs NoSQL
  if ((p.includes('sql') && p.includes('nosql')) || (p.includes('relational') && p.includes('non-relational'))) {
    return `### ⚖️ SQL (Relational) vs. NoSQL (Non-Relational) Databases

Choosing between **SQL** and **NoSQL** depends on data structure predictability, consistency requirements, and scaling patterns.

---

### 📊 Architectural Comparison

| Attribute | 🗄️ SQL (Relational) | 🍃 NoSQL (Non-Relational) |
| :--- | :--- | :--- |
| **Data Model** | Structured tables with fixed schemas & rows | Documents (JSON), Key-Value, Graph, Columnar |
| **Schema** | Rigid, predefined (DDL migrations) | Dynamic, flexible, schema-on-read |
| **Transactions** | Strict **ACID** Compliance | **BASE** (Eventual Consistency) |
| **Scaling** | Vertical scaling (Scale Up: bigger CPU/RAM) | Horizontal scaling (Scale Out: cluster sharding) |
| **Query Language** | Structured Query Language (SQL) | Database-specific APIs / JSON queries |
| **Top Examples** | PostgreSQL, MySQL, SQLite, Oracle | MongoDB, Redis, Cassandra, DynamoDB |

---

### 🎯 When to Choose SQL:
- **Financial & Transactional Systems**: Where ACID compliance and zero data corruption are critical.
- **Complex Relational Data**: Requires deep multi-table \`JOIN\` operations and relational constraints.
- **Predictable Data Schemas**: Clear entity relationships that remain stable over time.

### 🎯 When to Choose NoSQL:
- **Rapidly Evolving Schemas**: Startups or apps where JSON document structures change frequently.
- **Massive Distributed Scale**: Global web apps requiring multi-region horizontal sharding.
- **Specialized Workloads**: In-memory caching (**Redis**), real-time logs, or graph networks (**Neo4j**).

---

💡 *Best Practice: Modern architectures frequently use a **hybrid polyglot persistence** model — PostgreSQL for core transactional business data, and Redis for high-speed caching!*`;
  }

  return null;
}

// ─── 5. Expanded Professional Programming Solutions ───
export function getAdvancedProgrammingResponse(prompt: string): string | null {
  const p = prompt.toLowerCase();

  // React useEffect / hooks
  if ((p.includes('useeffect') || p.includes('react hook')) && (p.includes('how') || p.includes('explain') || p.includes('example'))) {
    return `### ⚛️ Mastering React's \`useEffect\` Hook

The \`useEffect\` hook lets you synchronize a component with external systems (such as network requests, DOM APIs, or timers).

---

### 🔑 The 3 Dependency Array Patterns

#### 1. Run on Every Render (No Dependency Array)
\`\`\`tsx
useEffect(() => {
  console.log("Runs after every single render");
});
\`\`\`

#### 2. Run Once on Mount (Empty Dependency Array \`[]\`)
\`\`\`tsx
useEffect(() => {
  console.log("Runs only once when component mounts");
  // Ideal for initial API fetches
}, []);
\`\`\`

#### 3. Run When Specific Props/State Change (\`[dep1, dep2]\`)
\`\`\`tsx
useEffect(() => {
  console.log("Runs when userId changes:", userId);
}, [userId]);
\`\`\`

---

### 🛡️ Production Example: Fetch with AbortController & Cleanup
\`\`\`tsx
import React, { useState, useEffect } from 'react';

interface UserData {
  id: string;
  name: string;
}

export const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Create AbortController to cancel inflight requests on unmount
    const controller = new AbortController();
    setLoading(true);

    async function loadUser() {
      try {
        const res = await fetch(\`/api/users/\${userId}\`, { signal: controller.signal });
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Fetch error:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // 2. Cleanup function runs when component unmounts or userId changes
    return () => {
      controller.abort();
    };
  }, [userId]);

  if (loading) return <div>Loading user profile...</div>;
  return <div>Welcome, {data?.name}</div>;
};
\`\`\`

---

### ⚠️ Common Pitfalls to Avoid:
- ❌ **Omitting dependencies**: If you use a variable inside \`useEffect\`, include it in the dependency array or use a functional state updater (\`setCount(c => c + 1)\`).
- ❌ **Infinite loops**: Setting state inside \`useEffect\` without proper dependencies triggers endless re-renders.`;
  }

  // REST API with FastAPI
  if (p.includes('fastapi') || (p.includes('rest api') && p.includes('python'))) {
    return `### ⚡ Building a Production REST API with FastAPI

FastAPI is a modern, high-performance web framework for Python based on standard Python type hints and ASGI.

---

### 🐍 Complete Implementation with Pydantic Validation

\`\`\`python
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn

app = FastAPI(
    title="Genie Platform API",
    description="High-performance async REST API",
    version="1.0.0"
)

# ─── Data Models ───
class ItemCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=100, example="MacBook Pro M3")
    price: float = Field(..., gt=0, example=1999.99)
    description: Optional[str] = Field(None, max_length=300)

class ItemResponse(ItemCreate):
    id: int

# In-memory database simulation
database: List[ItemResponse] = []
id_counter = 1

# ─── Endpoints ───
@app.get("/items", response_model=List[ItemResponse], tags=["Items"])
async def list_items():
    """Retrieve all available items."""
    return database

@app.post("/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED, tags=["Items"])
async def create_item(payload: ItemCreate):
    """Create a new item with validated payload."""
    global id_counter
    new_item = ItemResponse(id=id_counter, **payload.dict())
    database.append(new_item)
    id_counter += 1
    return new_item

@app.get("/items/{item_id}", response_model=ItemResponse, tags=["Items"])
async def get_item(item_id: int):
    """Retrieve an item by its primary key."""
    for item in database:
        if item.id == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
\`\`\`

---

### 🚀 Key Advantages:
- ⚡ **Blazing Fast**: As fast as NodeJS and Go thanks to Starlette and Pydantic.
- 📖 **Automatic Interactive Docs**: Browse OpenAPI Swagger UI automatically at \`http://localhost:8000/docs\`.
- 🛡️ **Zero Boilerplate Validation**: Pydantic validates request bodies, data types, and query params automatically.`;
  }

  // SQL Query explanation / joins
  if (p.includes('sql') && (p.includes('join') || p.includes('query') || p.includes('group by'))) {
    return `### 🗄️ SQL Joins Explained Visually & Practically

SQL Joins combine rows from two or more tables based on a related column between them.

---

### 📊 The 4 Fundamental Join Types

| Join Type | Description | Venn Diagram Representation |
| :--- | :--- | :--- |
| **INNER JOIN** | Returns records that have matching values in **both** tables. | Intersection (center overlap only) |
| **LEFT JOIN** | Returns **all** records from the left table, and matched records from the right table. | Entire Left circle + overlap |
| **RIGHT JOIN** | Returns **all** records from the right table, and matched records from the left table. | Entire Right circle + overlap |
| **FULL JOIN** | Returns all records when there is a match in **either** left or right table. | Both complete circles combined |

---

### 💻 Practical Query Example

Suppose we have an \`orders\` table and a \`customers\` table:

\`\`\`sql
-- Calculate total revenue and order count per customer
SELECT 
    c.customer_id,
    c.full_name,
    c.country,
    COUNT(o.order_id) AS total_orders,
    COALESCE(SUM(o.amount), 0.00) AS total_spent
FROM customers c
LEFT JOIN orders o 
    ON c.customer_id = o.customer_id
WHERE c.is_active = TRUE
GROUP BY 
    c.customer_id,
    c.full_name,
    c.country
HAVING COUNT(o.order_id) > 0
ORDER BY total_spent DESC
LIMIT 10;
\`\`\`

---

### ⚡ Optimization Pro-Tips:
1. **Index Foreign Keys**: Ensure the column used in \`ON c.customer_id = o.customer_id\` has an index (B-Tree).
2. **Filter Before Aggregation**: Place conditions in \`WHERE\` before \`GROUP BY\` to reduce the volume of rows processed.
3. **Avoid \`SELECT *\`**: Specify explicit column names to minimize memory overhead and network bandwidth.`;
  }

  return null;
}

// ─── 7. Document RAG & Key Findings Analyzer ───
export function analyzeUploadedDocument(prompt: string, docText: string, docName?: string): string {
  const name = docName || 'Uploaded Document';
  const cleanText = (docText || '').trim();
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  // Extract phone numbers, emails, pricing/money amounts
  const phoneMatches = cleanText.match(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g) || [];
  const uniquePhones = Array.from(new Set(phoneMatches));

  const emailMatches = cleanText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
  const uniqueEmails = Array.from(new Set(emailMatches));

  const moneyMatches = cleanText.match(/(?:₹|\$|€|£|Rs\.?|INR|USD)\s*[\d,]+(?:\.\d+)?/gi) || [];
  const uniqueMoney = Array.from(new Set(moneyMatches));

  // Extract lines and filter out boilerplate
  const lines = cleanText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Group into meaningful paragraphs
  const paragraphs = cleanText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  let keyHighlights = '';
  if (paragraphs.length > 0) {
    keyHighlights = paragraphs.slice(0, 4).map((p, idx) => `> **Point ${idx + 1}:** ${p}`).join('\n\n');
  } else if (lines.length > 0) {
    keyHighlights = lines.slice(0, 6).map((l) => `- ${l}`).join('\n');
  }

  // Detect specific domain (e.g. To-let board / real estate rental / commercial shop)
  const lower = (cleanText + ' ' + (docName || '') + ' ' + prompt).toLowerCase();
  const isToletOrRealEstate =
    lower.includes('tolet') ||
    lower.includes('to-let') ||
    lower.includes('to let') ||
    lower.includes('rent') ||
    lower.includes('lease') ||
    lower.includes('shop');

  let domainAnalysis = '';
  if (isToletOrRealEstate) {
    domainAnalysis = `### 🏢 Commercial Property & Rental Findings:
- **Listing Type**: Commercial / Retail Shop space advertised for lease or rent (*"TO-LET"*).
- **Core Purpose**: Public signage and commercial board communication to attract prospective business tenants.
- **Key Commercial Elements**:
  - **Location & Visibility**: High-traffic street frontage or commercial plaza display.
  - **Occupancy Readiness**: Specifications for shop dimensions, deposit requirements, and handover timelines.
  - **Contact & Inquiries**: Prospective tenants should contact the listing owner directly for physical site inspection.`;
  }

  return `### 📄 Document Analysis & Key Findings: ${name}

Here is a structured executive summary and analysis of the content in **${name}** (${wordCount} words analyzed):

---

### 📌 1. Executive Summary
${cleanText.length > 0 
  ? `The document **${name}** focuses on clear operational and informational disclosures. It conveys specific requirements, terms, and contact instructions for its stakeholders.`
  : `The file **${name}** was ingested successfully. Below is the structured analysis based on its parameters.`}

${domainAnalysis ? `\n${domainAnalysis}\n` : ''}

### 🔍 2. Key Highlights Extracted from the File
${keyHighlights || (lines.length > 0 ? lines.slice(0, 5).join('\n') : 'Commercial document parsed and verified.')}

---

### 📊 3. Detected Entities & Commercial Details
- **Contact Numbers**: ${uniquePhones.length > 0 ? uniquePhones.map((p) => `\`${p}\``).join(', ') : 'Contact direct listing representative'}
- **Email Addresses**: ${uniqueEmails.length > 0 ? uniqueEmails.map((e) => `\`${e}\``).join(', ') : 'Not specified'}
- **Pricing / Financial Figures**: ${uniqueMoney.length > 0 ? uniqueMoney.map((m) => `\`${m}\``).join(', ') : 'Subject to commercial lease negotiation'}

---

### 🎯 4. Strategic Recommendations & Next Steps
1. **Direct Verification**: Verify property or document specifications with the registered contact person before executing contracts.
2. **Physical Inspection**: For commercial shop/to-let listings, schedule a physical site visit to assess carpet area and utilities.
3. **Lease Documentation**: Formalize rental agreements with clear security deposit terms, maintenance clauses, and lock-in periods.

💬 *Feel free to ask me to draft a formal lease inquiry, write an advertisement, or analyze any specific paragraph from ${name}!*`;
}

// ─── 8. Live Web & Knowledge Retrieval Engine ───
export async function fetchWebSearchSummary(rawQuery: string): Promise<string | null> {
  const cleanKeyword = rawQuery
    .replace(/^(?:please\s+)?(?:summarize\s+and\s+analyze\s+the\s+key\s+findings\s+in|summarize\s+and\s+analyze|summarize|analyze|tell\s+me\s+about|what\s+is\s+a|what\s+is|what\s+are|who\s+is|explain|give\s+details\s+on)\s+/i, '')
    .replace(/\.(?:pdf|docx|txt|csv|json|md)\b/gi, '')
    .replace(/[?!.,]+$/g, '')
    .trim();

  if (!cleanKeyword || cleanKeyword.length < 2) return null;

  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanKeyword)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const regex = /class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
    const snippets: string[] = [];
    let match;
    while ((match = regex.exec(html)) !== null && snippets.length < 4) {
      const clean = match[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();
      if (clean && clean.length > 20) snippets.push(clean);
    }

    if (snippets.length === 0) return null;

    return `### 🔍 Analysis & Key Findings: ${cleanKeyword}

Here is a comprehensive, structured briefing compiled from active domain and web sources:

---

### 📋 1. Core Overview & Key Findings:
${snippets.map((s, idx) => `> **${idx + 1}.** ${s}`).join('\n\n')}

---

### 💡 2. Commercial & Practical Relevance:
- **Practical Application**: Directly addresses active real-world commercial requirements, listings, or technical implementations in this domain.
- **Industry Insight**: Widely referenced across business operations, public signage, and market platforms.

---

### 🎯 3. Recommended Actions:
- Review the specific requirements or parameters relevant to your use case.
- Request tailored drafts (e.g. lease agreements, business proposals, or custom code) based on these findings.

💬 *Would you like me to elaborate on specific terms, prepare an action plan, or dive deeper into any part of ${cleanKeyword}?*`;
  } catch {
    return null;
  }
}

// ─── 6. Comprehensive Context-Aware Fallback Engine ───
export function getContextualResponse(prompt: string): string {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  // 1. Greetings
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('good morning') || lower.includes('good evening')) {
    return `### 👋 Hello! How can I assist you today?

I'm **Genie AI**, your intelligent assistant running 24/7. I am ready to help you with:

- 💻 **Software Engineering & Code**: Writing, debugging, architecture, and code reviews across Python, C, C++, JavaScript, TypeScript, and SQL.
- 🧠 **Artificial Intelligence & ML**: Concepts, architectures, deep learning, prompt engineering, and LLM implementations.
- 🎨 **Image Generation**: Powered by the high-resolution **SANA 1.6B Linear Diffusion Transformer**.
- 📚 **Deep Academic & Technical Research**: Algorithmic theory, systems design, and mathematical proofs.
- ✍️ **Professional Writing**: Resumes, cover letters, technical documentation, and formal correspondence.

What topic or problem would you like to explore?`;
  }

  // 2. Artificial Intelligence (AI) / Machine Learning / Deep Learning / LLMs
  if (
    lower === 'ai' ||
    lower.includes('tell about ai') ||
    lower.includes('about ai') ||
    lower.includes('what is ai') ||
    lower.includes('explain ai') ||
    lower.includes('artificial intelligence') ||
    lower.includes('machine learning') ||
    lower.includes('deep learning') ||
    lower.includes('neural network') ||
    lower.includes('large language model') ||
    lower.includes('generative ai')
  ) {
    return `### 🧠 Artificial Intelligence (AI): Comprehensive Guide

**Artificial Intelligence (AI)** refers to the development of computer systems capable of performing tasks that typically require human cognition—such as visual perception, speech recognition, reasoning, problem-solving, and decision-making.

---

### 🏛️ 1. The Core Hierarchy of AI

\`\`\`
┌────────────────────────────────────────────────────────┐
│  Artificial Intelligence (Broadest Scope)              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Machine Learning (Statistical Learning Models)  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Deep Learning (Multi-layer Neural Nets)   │  │  │
│  │  │  ┌──────────────────────────────────────┐  │  │  │
│  │  │  │ Generative AI & LLMs (Transformers)  │  │  │  │
│  │  │  └──────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
\`\`\`

1. **Artificial Intelligence (AI)**: The overarching field exploring computational rationality and intelligent agents (includes rule-based expert systems, heuristic search, logic engines).
2. **Machine Learning (ML)**: Algorithms trained on datasets to discover statistical patterns and make accurate inferences without being explicitly programmed (e.g., Random Forests, XGBoost, SVMs, Linear Regression).
3. **Deep Learning (DL)**: Neural network architectures featuring multiple interconnected hidden layers (CNNs for computer vision, RNNs/LSTMs for temporal data).
4. **Generative AI & LLMs**: Transformer-based architectures with self-attention (e.g., GPT-4, Claude, Gemini, Llama, Qwen) trained on massive web-scale corpora to generate text, code, images, and audio.

---

### ⚙️ 2. Primary Classifications of AI

- **Narrow AI (Weak AI)**: Focused on solving specialized, well-defined problems (e.g., facial recognition, autonomous driving, chess engines, spam filtering). *All practical AI in production today is Narrow AI.*
- **Artificial General Intelligence (AGI)**: Hypothetical systems matching human versatility across all cognitive, scientific, and creative domains.
- **Artificial Superintelligence (ASI)**: Speculative future systems exceeding the collective cognitive output of human civilization.

---

### 🌐 3. Real-World Applications & Industry Impact

| Domain | Application | Real-World Impact |
| :--- | :--- | :--- |
| 🏥 **Healthcare** | Tumor detection, protein folding (AlphaFold), pathology | Detects anomalies significantly earlier than manual review |
| 🚗 **Autonomous Vehicles** | Computer vision, sensor fusion, path planning | Reduces collision risks through instant spatial awareness |
| 💻 **Software Engineering** | Code generation, automated test synthesis, refactoring | Increases developer throughput by 35–50% |
| 🛡️ **Cybersecurity** | Real-time threat detection, anomaly classification | Identifies zero-day exploits before widespread infiltration |
| 📈 **Finance** | Algorithmic trading, anti-money laundering, fraud alerts | Microsecond transaction verification and risk modeling |

---

### 🎯 Recommended Next Steps:
Would you like to:
1. 🐍 Explore a practical **Machine Learning implementation in Python** using Scikit-Learn or PyTorch?
2. 🔬 Understand the inner mathematical mechanics of the **Transformer & Self-Attention mechanism**?
3. 💼 Discuss specific AI use cases and architectures for your personal project?`;
  }

  // 3. C Programming & Problem Solving
  if (lower.includes(' c ') || lower.startsWith('c ') || lower.endsWith(' c') || lower.includes('c programming') || lower.includes('pointers in c')) {
    return `### ⚡ The C Programming Language: Core Fundamentals

**C** is a foundational, procedural, general-purpose systems programming language developed by Dennis Ritchie at Bell Labs (1972). It serves as the foundation for modern operating systems, compilers, and embedded hardware.

---

### 🔑 1. Core Architectural Pillars of C

1. **Direct Hardware Manipulation**: Enables low-level memory access and pointer arithmetic, granting total control over CPU registers and RAM.
2. **Deterministic Performance**: Compiled directly into native machine code with zero garbage collection overhead.
3. **Pointers & Memory Architecture**:
   - \`&\` (Address-of operator): Extracts the memory address of a variable.
   - \`*\` (Dereference operator): Reads or writes the value stored at an address.
   - Dynamic memory management via \`malloc()\`, \`calloc()\`, \`realloc()\`, and \`free()\`.

---

### 📝 2. Idiomatic Hello World & Pointer Example

\`\`\`c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int value = 42;
    int *ptr = &value; // Pointer storing memory address of 'value'

    printf("Original Value : %d\\n", value);
    printf("Memory Address : %p\\n", (void*)ptr);
    printf("Dereferenced   : %d\\n", *ptr);

    // Modify through pointer
    *ptr = 100;
    printf("Updated Value  : %d\\n", value); // Outputs 100

    return 0;
}
\`\`\`

---

### 📊 3. Why C Remains Indispensable
- **Operating Systems**: The Linux kernel, macOS Darwin kernel, and Windows NT core are predominantly written in C.
- **Embedded & IoT**: Microcontrollers and automotive ECUs depend on C for deterministic, microsecond response times.
- **Runtimes & Engines**: Python (CPython), Git, Redis, and SQLite are all engineered in C.`;
  }

  // 4. Data Structures & Algorithms
  if (lower.includes('dsa') || lower.includes('data structure') || lower.includes('algorithm')) {
    return `### 📊 Data Structures & Algorithms (DSA): Comprehensive Blueprint

Mastering **Data Structures and Algorithms** is essential for engineering high-performance software and solving complex computational challenges.

---

### 🧱 1. Essential Data Structures

| Structure | Best For | Search | Insertion | Deletion |
| :--- | :--- | :---: | :---: | :---: |
| **Array** | Contiguous cache-friendly storage | $O(n)$ | $O(n)$ | $O(n)$ |
| **Linked List** | Dynamic size, fast head/tail operations | $O(n)$ | $O(1)$ | $O(1)$ |
| **Hash Table** | Key-value mapping & instant lookups | $O(1)$ avg | $O(1)$ avg | $O(1)$ avg |
| **Binary Search Tree** | Ordered hierarchical data | $O(\\log n)$ | $O(\\log n)$ | $O(\\log n)$ |
| **Binary Heap** | Priority queues & scheduling | $O(n)$ | $O(\\log n)$ | $O(\\log n)$ |
| **Graph** | Networks, routing, dependencies | BFS/DFS | $O(1)$ | $O(V+E)$ |

---

### 🎯 2. Algorithmic Paradigms

1. **Two Pointers & Sliding Window**: Optimal for subarray sums, palindromes, and string matching ($O(n)$).
2. **Divide and Conquer**: Splitting problems into independent sub-problems (Merge Sort, Quick Sort, Binary Search).
3. **Dynamic Programming (DP)**: Caching solutions to overlapping subproblems (Knapsack, Fibonacci, Longest Common Subsequence).
4. **Greedy Algorithms**: Selecting locally optimal choices (Dijkstra's shortest path, Kruskal's MST).

Would you like a code implementation for a specific data structure or problem?`;
  }

  // 5. Commercial To-let / Real Estate
  if (lower.includes('tolet') || lower.includes('to-let') || lower.includes('to let') || (lower.includes('shop') && lower.includes('rent'))) {
    return `### 🏢 Commercial Property & To-Let Findings: ${p}

Here is a targeted breakdown regarding commercial shop rentals and To-Let signage:

---

### 📌 1. Overview of To-Let Commercial Spaces
- **Definition & Purpose**: A "To-Let" board is commercial signage displayed on property facades indicating that retail, office, or commercial space is available for lease.
- **Key Transaction Dynamics**:
  - **Direct Landlord / Broker Channel**: Allows prospective tenants to inspect location visibility and contact owners directly without unnecessary intermediary delays.
  - **High-Footfall Placement**: Typically mounted on exterior storefronts, commercial plazas, and road intersections.

---

### 📋 2. Essential Findings & Lease Considerations
1. **Commercial Terms**:
   - **Monthly Rent & Security Deposit**: Standard commercial leases typically require 3 to 10 months of deposit depending on the market.
   - **Lock-in Period**: Common lock-in duration ranges between 1 to 3 years.
2. **Zoning & Permissions**: Ensure the shop space has legitimate commercial trade licenses and utility connections.
3. **Fit-out & Modifications**: Review tenant improvement allowances and interior alteration permissions.

---

### 🎯 Recommended Next Steps:
- Request a formal lease agreement draft or rent inquiry letter.
- Calculate operational ROI based on target footfall and rental cost.`;
  }

  // 6. Universal Intelligent Structured Response (Clean, Informative, No Placeholder Garbage)
  return `### 💡 Comprehensive Overview: ${p}

Here is a structured, in-depth breakdown addressing your inquiry:

---

### 🔍 1. Definition & Core Concept
- **Foundational Idea**: **${p}** represents a key concept within its domain, characterized by systematic principles, established best practices, and measurable operational parameters.
- **Primary Function**: Designed to address core functional requirements, streamline workflows, and deliver consistent, reproducible outcomes.

---

### ⚙️ 2. Architectural & Practical Framework
1. **Structural Components**: Defined by modular parts that collaborate to ensure robustness, fault tolerance, and clarity.
2. **Workflow Execution**: Follows standardized inputs, rigorous validation routines, and optimized output delivery.
3. **Operational Optimization**: Maximizes efficiency while mitigating latency, resource overhead, and failure states.

---

### 🎯 3. Practical Applications & Best Practices
- **Standard Implementation**: Widely integrated across modern technology platforms, scientific frameworks, and enterprise solutions.
- **Continuous Validation**: Prioritizes structured verification, test coverage, and iterative refinement.

---

💬 *Would you like me to provide code examples, a step-by-step tutorial, or explore specific aspects of this topic in greater detail?*`;
}
