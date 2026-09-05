/**
 * Florence-2 Vision Engine
 * Uses /api/predict — synchronous direct call (no queue polling).
 * Space: https://gokaygokay-florence-2.hf.space
 * Model: microsoft/Florence-2-base-ft  (fast, accurate)
 */

const GRADIO_BASE = 'https://gokaygokay-florence-2.hf.space';

// Map internal task tokens → human-readable Gradio labels
const TASK_LABEL_MAP: Record<string, string> = {
  '<MORE_DETAILED_CAPTION>': 'More Detailed Caption',
  '<DETAILED_CAPTION>':      'Detailed Caption',
  '<CAPTION>':               'Caption',
  '<OD>':                    'Object Detection',
  '<OCR>':                   'OCR',
  '<OCR_WITH_REGION>':       'OCR with Region',
  '<VQA>':                   'More Detailed Caption',
  'scene':                   'More Detailed Caption',
  'od':                      'Object Detection',
  'ocr':                     'OCR',
  'vqa':                     'More Detailed Caption',
};

function resolveTaskLabel(task: string): string {
  return TASK_LABEL_MAP[task] ?? 'More Detailed Caption';
}

/**
 * Analyzes an image using the real Florence-2 Gradio Space.
 * Uses /api/predict for a fast synchronous response.
 *
 * @param prompt   - User question (used for VQA)
 * @param imageUrl - base64 data URL or HTTPS URL
 * @param task     - Vision task token e.g. '<OD>', '<OCR>', '<MORE_DETAILED_CAPTION>'
 */
export async function analyzeWithFlorence2(
  prompt: string,
  imageUrl?: string,
  task: string = '<MORE_DETAILED_CAPTION>'
): Promise<string> {
  if (!imageUrl) {
    return '⚠️ No image provided. Please capture or upload a photo first.';
  }

  const taskLabel = resolveTaskLabel(task);
  const textInput = (task === '<VQA>' || task === 'vqa') ? (prompt || '') : '';

  // ── /api/predict: synchronous, no queue polling needed ───────────────────
  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 45_000); // 45 s max

    const res = await fetch(`${GRADIO_BASE}/api/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
      body: JSON.stringify({
        fn_index: 4,
        data: [
          imageUrl,
          taskLabel,
          textInput,
          'microsoft/Florence-2-base-ft',  // fastest model
        ],
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Florence-2 API returned ${res.status}: ${res.statusText}`);
    }

    const json = await res.json() as { data?: unknown[]; error?: string };

    if (json.error) {
      throw new Error(json.error);
    }

    const resultData = json.data;
    if (!Array.isArray(resultData) || resultData.length === 0) {
      throw new Error('Empty response from Florence-2');
    }

    return formatFlorenceResult(resultData, taskLabel, prompt);

  } catch (err: any) {
    if (err.name === 'AbortError') {
      return '⏱️ Florence-2 timed out (45 s). The server may be under load — please try again.';
    }
    console.error('[Florence-2] API error:', err);
    return `❌ Florence-2 vision unavailable: ${err.message}`;
  }
}

function formatFlorenceResult(
  data: unknown[],
  taskLabel: string,
  prompt: string
): string {
  const textOutput = typeof data[0] === 'string' ? data[0].trim() : '';
  const boxJson    = data[1];

  let md = `### 👁️ Florence-2 Vision Analysis\n\n`;
  md += `**Task:** ${taskLabel}\n\n`;

  if (prompt) {
    md += `**Query:** *"${prompt}"*\n\n`;
  }

  if (textOutput) {
    md += `**Result:**\n\n${textOutput}\n\n`;
  }

  // Object detection: list detected labels
  if (taskLabel === 'Object Detection' && boxJson && typeof boxJson === 'object') {
    try {
      const boxes = boxJson as { labels?: string[]; bboxes?: number[][] };
      if (boxes.labels && boxes.labels.length > 0) {
        md += `**Detected Objects (${boxes.labels.length}):**\n`;
        boxes.labels.slice(0, 20).forEach(label => { md += `- ${label}\n`; });
        md += '\n';
      }
    } catch { /* ignore */ }
  }

  if (!textOutput) {
    md += '_No analysis output returned._\n';
  }

  return md;
}
