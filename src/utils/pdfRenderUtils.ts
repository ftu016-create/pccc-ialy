import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Initialize PDF.js worker safely
if (typeof window !== 'undefined') {
  try {
    const worker = new Worker(
      new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
      { type: 'module' }
    );
    pdfjsLib.GlobalWorkerOptions.workerPort = worker;
  } catch {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    } catch {
      // fallback
    }
  }
}

/**
 * Automatically trims excessive white outer borders from a rendered canvas,
 * allowing tables and documents to fill the A4 landscape page gracefully
 * without wasteful blank margins.
 */
export function trimCanvasWhiteBorders(
  sourceCanvas: HTMLCanvasElement,
  padding = 16
): HTMLCanvasElement {
  try {
    const ctx = sourceCanvas.getContext('2d');
    if (!ctx) return sourceCanvas;

    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    if (w < 50 || h < 50) return sourceCanvas;

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let minX = w, minY = h, maxX = 0, maxY = 0;
    let found = false;

    // Scan with step 2 for sub-millisecond execution
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const idx = (y * w + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        if (a > 30 && (r < 248 || g < 248 || b < 248)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }

    if (!found) return sourceCanvas;

    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(w - 1, maxX + padding);
    maxY = Math.min(h - 1, maxY + padding);

    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;

    // Only crop if there is significant excess margin (> 24px saved)
    if (w - cropW < 24 && h - cropH < 24) {
      return sourceCanvas;
    }

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return sourceCanvas;

    croppedCtx.fillStyle = '#ffffff';
    croppedCtx.fillRect(0, 0, cropW, cropH);
    croppedCtx.drawImage(sourceCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

    return croppedCanvas;
  } catch {
    return sourceCanvas;
  }
}

/**
 * Converts each page of a PDF (provided as base64 or ArrayBuffer) into a PNG data URL.
 * Wrapped with a 6-second timeout to prevent any freeze during upload.
 */
export async function renderPdfPagesToDataUrls(
  pdfData: string | ArrayBuffer,
  maxPages = 20,
  scale = 1.8
): Promise<string[]> {
  try {
    let sourceData: Uint8Array | ArrayBuffer;

    if (typeof pdfData === 'string') {
      const base64Clean = pdfData.includes(',') ? pdfData.split(',')[1] : pdfData;
      const clean = base64Clean.replace(/\s/g, '');
      const binary = atob(clean);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      sourceData = bytes;
    } else {
      sourceData = pdfData;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: sourceData,
    });

    const pdfDoc = await Promise.race([
      loadingTask.promise,
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('PDF.js render timeout')), 6000)
      ),
    ]);

    if (!pdfDoc) return [];

    const pageCount = Math.min(pdfDoc.numPages, maxPages);
    const pageImages: string[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Fill white background for PDF page
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await page.render(renderContext as any).promise;

      // Trim outer dead margins so content fits landscape page cleanly
      const trimmedCanvas = trimCanvasWhiteBorders(canvas, 16);
      const imgDataUrl = trimmedCanvas.toDataURL('image/png');
      pageImages.push(imgDataUrl);
    }

    return pageImages;
  } catch (err) {
    console.warn('Lỗi khi render PDF sang ảnh (sẽ dùng bản gốc khi ghép):', err);
    return [];
  }
}
