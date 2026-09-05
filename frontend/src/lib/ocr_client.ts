/**
 * Client-Side Local OCR Engine
 * Uses Tesseract.js running 100% locally in the browser via WebAssembly.
 * ZERO external API calls, ZERO API keys, 100% private and on-device.
 */

export async function extractTextLocally(imageSource: string): Promise<string> {
  if (typeof window === 'undefined' || !imageSource) {
    return '';
  }

  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    const ret = await worker.recognize(imageSource);
    await worker.terminate();
    return ret?.data?.text ? ret.data.text.trim() : '';
  } catch (err) {
    console.warn('[OCR Engine] Local extraction warning:', err);
    return '';
  }
}
