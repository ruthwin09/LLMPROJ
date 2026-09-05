// Intelligent prompt suggestions library with domain tagging, keywords, and fuzzy matching

export interface PromptSuggestion {
  id: string;
  category: 'vision' | 'image' | 'code' | 'writing' | 'research' | 'productivity';
  title: string;
  badge: string;
  icon: string;
  prompt: string;
  keywords: string[];
}

export const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  // ─── Camera Vision Analysis (Florence-2) ───
  {
    id: 'vis-1',
    category: 'vision',
    badge: 'Florence-2 Vision',
    icon: '👁️',
    title: 'Analyze scene details in captured photo',
    prompt: 'Analyze this picture in detail with Florence-2 (<MORE_DETAILED_CAPTION>)',
    keywords: ['florence', 'vision', 'camera', 'photo', 'picture', 'snapshot', 'scene', 'analysis', 'look', 'see', 'caption'],
  },
  {
    id: 'vis-2',
    category: 'vision',
    badge: 'Florence-2 Vision',
    icon: '📦',
    title: 'Detect and identify objects in picture',
    prompt: 'Detect and identify all objects in this picture with Florence-2 (<OD>)',
    keywords: ['florence', 'detect', 'objects', 'vision', 'camera', 'photo', 'identify', 'items', 'count', 'bounding box'],
  },
  {
    id: 'vis-3',
    category: 'vision',
    badge: 'Florence-2 Vision',
    icon: '📝',
    title: 'Read and extract text from picture (OCR)',
    prompt: 'Read and extract all visible text in this picture with Florence-2 (<OCR>)',
    keywords: ['florence', 'ocr', 'text', 'read', 'extract', 'words', 'label', 'sign', 'document', 'receipt', 'invoice'],
  },

  // ─── Image Generation (SANA 1.6B) ───
  {
    id: 'img-1',
    category: 'image',
    badge: 'SANA 1.6B Image',
    icon: '🎨',
    title: 'Futuristic cyberpunk neon city',
    prompt: 'Generate an image of a futuristic neon cyberpunk city at night with rain reflections on streets',
    keywords: ['generate', 'image', 'picture', 'draw', 'paint', 'photo', 'cyberpunk', 'city', 'neon', 'futuristic', 'art', 'sana'],
  },
  {
    id: 'img-2',
    category: 'image',
    badge: 'SANA 1.6B Image',
    icon: '🎨',
    title: 'Ethereal fantasy landscape with waterfalls',
    prompt: 'Generate an image of an ethereal fantasy landscape with floating islands, lush glowing flora, and cascading waterfalls',
    keywords: ['generate', 'image', 'draw', 'paint', 'fantasy', 'landscape', 'waterfall', 'nature', 'scenery', 'wallpaper'],
  },
  {
    id: 'img-3',
    category: 'image',
    badge: 'SANA 1.6B Image',
    icon: '🎨',
    title: 'Cute animal in cinematic digital art',
    prompt: 'Generate an image of a cute red panda drinking coffee in a cozy winter cabin, highly detailed 3D digital art',
    keywords: ['generate', 'image', 'draw', 'cute', 'animal', 'panda', 'cat', 'dog', 'coffee', '3d', 'digital art'],
  },
  {
    id: 'img-4',
    category: 'image',
    badge: 'SANA 1.6B Image',
    icon: '🎨',
    title: 'Astronaut discovering crystal on alien planet',
    prompt: 'Generate an image of an astronaut discovering a giant luminous purple crystal on an alien desert planet, cinematic 8k',
    keywords: ['generate', 'image', 'draw', 'space', 'astronaut', 'alien', 'planet', 'crystal', 'cinematic', 'sci-fi'],
  },
  {
    id: 'img-5',
    category: 'image',
    badge: 'SANA 1.6B Image',
    icon: '🎨',
    title: 'Minimalist geometric abstract wallpaper',
    prompt: 'Generate an image of modern minimalist 3D geometric shapes with soft purple and gold ambient studio lighting 4K',
    keywords: ['generate', 'image', 'draw', 'minimalist', 'geometric', 'abstract', 'wallpaper', 'background', 'design'],
  },

  // ─── Coding & Architecture ───
  {
    id: 'code-1',
    category: 'code',
    badge: 'Python & Web',
    icon: '🐍',
    title: 'Web scraper with BeautifulSoup and Requests',
    prompt: 'Write a Python script to scrape data from a website using BeautifulSoup with error handling and pagination',
    keywords: ['python', 'scrape', 'web', 'scraper', 'beautifulsoup', 'requests', 'data', 'crawl', 'bot'],
  },
  {
    id: 'code-2',
    category: 'code',
    badge: 'TypeScript / React',
    icon: '⚛️',
    title: 'React useEffect with cleanup & AbortController',
    prompt: 'Explain how to use React useEffect with AbortController for cancelable fetch requests and proper cleanup',
    keywords: ['react', 'useeffect', 'hook', 'hooks', 'typescript', 'frontend', 'cleanup', 'fetch', 'abortcontroller'],
  },
  {
    id: 'code-3',
    category: 'code',
    badge: 'Databases',
    icon: '🗄️',
    title: 'SQL vs. NoSQL: Deep Architectural Comparison',
    prompt: 'What is the difference between SQL and NoSQL databases? When should I choose each for production?',
    keywords: ['sql', 'nosql', 'database', 'postgres', 'mongodb', 'difference', 'compare', 'vs', 'versus'],
  },
  {
    id: 'code-4',
    category: 'code',
    badge: 'Algorithms',
    icon: '🔄',
    title: 'Reverse string efficiently in 3 languages',
    prompt: 'How to reverse a string in Python, JavaScript, and Java with complexity analysis',
    keywords: ['reverse', 'string', 'python', 'javascript', 'java', 'algorithm', 'code', 'data structure'],
  },
  {
    id: 'code-5',
    category: 'code',
    badge: 'Backend API',
    icon: '⚡',
    title: 'FastAPI async REST API with Pydantic validation',
    prompt: 'How to build a production async REST API with Python FastAPI and Pydantic data validation',
    keywords: ['fastapi', 'rest', 'api', 'backend', 'pydantic', 'async', 'python', 'endpoint'],
  },
  {
    id: 'code-6',
    category: 'code',
    badge: 'CSS / Layout',
    icon: '🎨',
    title: 'Center a div horizontally and vertically',
    prompt: 'How to center a div horizontally and vertically using modern CSS Flexbox and Grid',
    keywords: ['center', 'div', 'css', 'flexbox', 'grid', 'html', 'style', 'align'],
  },
  {
    id: 'code-7',
    category: 'code',
    badge: 'SQL Queries',
    icon: '📊',
    title: 'SQL JOIN types explained with practical queries',
    prompt: 'Explain INNER, LEFT, RIGHT, and FULL JOINs in SQL with diagrams and practical query examples',
    keywords: ['sql', 'join', 'inner', 'left', 'right', 'query', 'group by', 'database'],
  },

  // ─── Business & Writing ───
  {
    id: 'write-1',
    category: 'writing',
    badge: 'Email',
    icon: '✉️',
    title: 'Professional sick leave / time off email',
    prompt: 'Write a professional sick leave request email to my manager with handover context',
    keywords: ['email', 'sick', 'leave', 'vacation', 'time off', 'manager', 'work', 'absence'],
  },
  {
    id: 'write-2',
    category: 'writing',
    badge: 'Job Search',
    icon: '📄',
    title: 'Job application cover letter for software role',
    prompt: 'Write a compelling, modern job application cover letter for a software engineering position',
    keywords: ['cover letter', 'job', 'application', 'resume', 'hire', 'interview', 'career', 'letter'],
  },
  {
    id: 'write-3',
    category: 'writing',
    badge: 'Resume',
    icon: '📝',
    title: 'Resume bullets with Google XYZ formula',
    prompt: 'Write high-impact bullet points for my resume using the Google XYZ formula ("Accomplished X as measured by Y by doing Z")',
    keywords: ['resume', 'cv', 'xyz', 'google', 'bullet', 'points', 'portfolio', 'linkedin', 'experience'],
  },
  {
    id: 'write-4',
    category: 'writing',
    badge: 'Career Transition',
    icon: '🤝',
    title: 'Formal two-week notice resignation letter',
    prompt: 'Draft a polite, professional two-week notice resignation letter to preserve relationships',
    keywords: ['resign', 'resignation', 'notice', 'two week', 'leave job', 'quitting', 'letter'],
  },
  {
    id: 'write-5',
    category: 'writing',
    badge: 'Follow-up',
    icon: '📬',
    title: 'Polite business follow-up email',
    prompt: 'Write a polite, professional follow-up email regarding an unresponded proposal',
    keywords: ['follow up', 'email', 'proposal', 'client', 'reminder', 'business', 'polite'],
  },

  // ─── Research & Learning ───
  {
    id: 'res-1',
    category: 'research',
    badge: 'Quantum Physics',
    icon: '🌌',
    title: 'Quantum computing and qubits in simple terms',
    prompt: 'Explain quantum computing, superposition, and entanglement in simple, intuitive terms',
    keywords: ['quantum', 'computing', 'qubit', 'superposition', 'physics', 'entanglement', 'computer'],
  },
  {
    id: 'res-2',
    category: 'research',
    badge: 'AI & Machine Learning',
    icon: '🤖',
    title: 'How Transformer attention mechanisms work',
    prompt: 'Explain how Transformers and self-attention mechanisms work in large language models',
    keywords: ['transformer', 'attention', 'llm', 'ai', 'machine learning', 'deep learning', 'neural network'],
  },
  {
    id: 'res-3',
    category: 'research',
    badge: 'Data Science',
    icon: '📈',
    title: 'Supervised vs. Unsupervised Learning',
    prompt: 'Explain the difference between supervised, unsupervised, and reinforcement machine learning with examples',
    keywords: ['supervised', 'unsupervised', 'machine learning', 'reinforcement', 'classification', 'clustering'],
  },
  {
    id: 'res-4',
    category: 'research',
    badge: 'Astrophysics',
    icon: '🪐',
    title: 'How black holes form and the event horizon',
    prompt: 'Explain how black holes form, what the event horizon is, and what happens when matter falls inside',
    keywords: ['black hole', 'event horizon', 'gravity', 'space', 'star', 'astronomy', 'universe'],
  },

  // ─── Productivity & Brainstorming ───
  {
    id: 'prod-1',
    category: 'productivity',
    badge: 'Brainstorm',
    icon: '💡',
    title: '10 innovative AI SaaS startup ideas',
    prompt: 'Brainstorm 10 innovative B2B SaaS startup ideas leveraging generative AI in 2026',
    keywords: ['startup', 'saas', 'ideas', 'business', 'brainstorm', 'ai', 'product', 'venture'],
  },
  {
    id: 'prod-2',
    category: 'productivity',
    badge: 'Roadmap',
    icon: '🗺️',
    title: 'Complete 3-month full-stack study roadmap',
    prompt: 'Create a structured 3-month daily study roadmap to learn full-stack development with Next.js and Python',
    keywords: ['roadmap', 'study', 'learn', 'plan', 'schedule', 'full stack', 'course', 'guide'],
  },
];

/**
 * Filter and rank suggestions based on user input.
 * Returns top matches (max 5) with priority given to prefix matches.
 */
export function getPromptSuggestions(input: string, maxResults = 5): PromptSuggestion[] {
  const query = input.trim().toLowerCase();
  if (!query) return [];

  const tokens = query.split(/\s+/).filter(Boolean);

  const scored = PROMPT_SUGGESTIONS.map((item) => {
    let score = 0;
    const promptLower = item.prompt.toLowerCase();
    const titleLower = item.title.toLowerCase();

    // Direct startsWith gets highest priority
    if (promptLower.startsWith(query)) score += 100;
    if (titleLower.startsWith(query)) score += 80;

    // Check token matches
    for (const token of tokens) {
      if (token.length < 2) continue;

      if (promptLower.includes(token)) score += 15;
      if (titleLower.includes(token)) score += 20;

      for (const kw of item.keywords) {
        if (kw === token) score += 25;
        else if (kw.startsWith(token)) score += 15;
        else if (kw.includes(token)) score += 8;
      }
    }

    return { item, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.item);
}
