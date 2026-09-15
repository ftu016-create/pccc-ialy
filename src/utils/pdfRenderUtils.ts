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
 * Converts each page of a PDF (provided as base64 or ArrayBuffer) into a PNG data URL.
 * Wrapped with a 6-second timeout to prevent any freeze during upload.
 */
export async function renderPdfPagesToDataUrls(
  pdfData: string | ArrayBuffer,
  maxPages = 20,
  scale = 1.3
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
      const imgDataUrl = canvas.toDataURL('image/png');
      pageImages.push(imgDataUrl);
    }

    return pageImages;
  } catch (err) {
    console.warn('Lỗi khi render PDF sang ảnh (sẽ dùng bản gốc khi ghép):', err);
    return [];
  }
}
