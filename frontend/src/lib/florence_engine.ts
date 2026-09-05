/**
 * Florence-2 Vision Engine
 * Calls the live Gradio Space: https://gokaygokay-florence-2.hf.space
 * Model: microsoft/Florence-2-large-ft
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
  '<VQA>':                   'More Detailed Caption',   // VQA uses caption + text_input
  'scene':                   'More Detailed Caption',
  'od':                      'Object Detection',
  'ocr':                     'OCR',
  'vqa':                     'More Detailed Caption',
};

function resolveTaskLabel(task: string): string {
  return TASK_LABEL_MAP[task] || 'More Detailed Caption';
}

function generateSessionHash(): string {
  return Math.random().toString(36).slice(2, 14);
}

/**
 * Analyzes an image using the real Florence-2 Gradio Space API.
 * Returns a formatted markdown string with analysis results.
 *
 * @param prompt   - User's question / prompt (used for VQA tasks)
 * @param imageUrl - Base64 data URL (data:image/jpeg;base64,...) or HTTPS image URL
 * @param task     - Vision task token (e.g. '<MORE_DETAILED_CAPTION>', '<OD>', '<OCR>')
 */
export async function analyzeWithFlorence2(
  prompt: string,
  imageUrl?: string,
  task: string = '<MORE_DETAILED_CAPTION>'
): Promise<string> {
  if (!imageUrl) {
    return '⚠️ No image provided. Please capture or upload a photo first.';
  }

  const taskLabel  = resolveTaskLabel(task);
  const textInput  = (task === '<VQA>' || task === 'vqa') ? (prompt || '') : '';
  const sessionHash = generateSessionHash();

  // ── Step 1: Join the Gradio queue ──────────────────────────────────────────
  let eventId: string;
  try {
    const joinRes = await fetch(`${GRADIO_BASE}/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fn_index: 4,
        data: [
          imageUrl,
          taskLabel,
          textInput,
          'microsoft/Florence-2-large',
        ],
        session_hash: sessionHash,
        event_data: null,
      }),
    });

    if (!joinRes.ok) {
      throw new Error(`Queue join failed: ${joinRes.status} ${joinRes.statusText}`);
    }

    const joinData = await joinRes.json();
    eventId = joinData.event_id;
  } catch (err: any) {
    console.error('[Florence-2] Queue join error:', err);
    return `❌ Florence-2 vision unavailable: ${err.message}`;
  }

  // ── Step 2: Poll for result via SSE stream ─────────────────────────────────
  const MAX_WAIT_MS  = 60_000;
  const POLL_INTERVAL_MS = 800;
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_WAIT_MS) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

    try {
      const dataRes = await fetch(
        `${GRADIO_BASE}/queue/data?session_hash=${sessionHash}`,
        { headers: { Accept: 'text/event-stream' } }
      );

      if (!dataRes.ok || !dataRes.body) continue;

      const text = await dataRes.text();

      // Parse SSE events from the response body
      const lines = text.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        try {
          const json = JSON.parse(line.slice(5).trim());

          if (json.msg === 'process_completed') {
            const output = json.output;
            if (output?.error) {
              return `❌ Florence-2 analysis error: ${output.error}`;
            }

            const resultData = output?.data;
            if (Array.isArray(resultData) && resultData.length > 0) {
              return formatFlorenceResult(resultData, taskLabel, prompt);
            }
          }

          if (json.msg === 'queue_full') {
            return '⏳ Florence-2 server is busy. Please try again in a moment.';
          }
        } catch {
          // Not a JSON SSE event, skip
        }
      }
    } catch (err) {
      // Network blip during polling — keep trying
    }
  }

  return '⏱️ Florence-2 timed out. The image may be too large or the server is under load. Please try again.';
}

function formatFlorenceResult(
  data: unknown[],
  taskLabel: string,
  prompt: string
): string {
  // data[0] is the text output, data[1] may be bounding-box JSON
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

  // If object detection returned bounding boxes, render them as a list
  if (taskLabel === 'Object Detection' && boxJson && typeof boxJson === 'object') {
    try {
      const boxes = boxJson as { labels?: string[]; bboxes?: number[][] };
      if (boxes.labels && boxes.labels.length > 0) {
        md += `**Detected Objects (${boxes.labels.length}):**\n`;
        boxes.labels.slice(0, 20).forEach((label, i) => {
          md += `- ${label}\n`;
        });
        md += '\n';
      }
    } catch {
      // ignore formatting error
    }
  }

  if (!textOutput) {
    md += '_No analysis output returned._\n';
  }

  return md;
}
