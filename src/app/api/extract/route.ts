import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { createWorker } from "tesseract.js";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 18 * 1024 * 1024;
const OCR_TIMEOUT_MS = 45000;
const PDF_OCR_PAGE_LIMIT = 3;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json({ error: "NO_FILE", message: "Upload a document file first." }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "NO_FILE", message: "Upload a document file first." }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "FILE_TOO_LARGE", message: "File is too large for this prototype. Keep uploads under 12 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extraction = await extractText(buffer, file.name, file.type);

    return NextResponse.json({
      fileName: file.name,
      fileSize: file.size,
      ...extraction
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "EXTRACTION_FAILED",
        message: error instanceof Error ? error.message : "Could not extract readable text."
      },
      { status: 500 }
    );
  }
}

async function extractText(buffer: Buffer, fileName: string, mimeType: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (mimeType.startsWith("text/") || extension === "txt") {
    return {
      text: buffer.toString("utf8"),
      method: "text",
      latencyStrategy: "Direct text read. Lowest latency and highest text fidelity.",
      warning: ""
    };
  }

  if (
    extension === "docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
      method: "docx",
      latencyStrategy: "Native DOCX text extraction. Fast path; formatting is simplified to raw text.",
      warning: result.messages.length ? "DOCX extracted with formatting warnings; verify key evidence." : ""
    };
  }

  if (extension === "pdf" || mimeType === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const pdfWorkerPath = join(process.cwd(), "node_modules", "pdf-parse", "dist", "worker", "pdf.worker.mjs");
    PDFParse.setWorker(pathToFileURL(pdfWorkerPath).href);

    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText({
        lineEnforce: true,
        pageJoiner: "\n\n[Page {page_number} of {total_number}]\n\n"
      });
      const nativeText = result.text.trim();

      if (nativeText.length > 0) {
        return {
          text: nativeText,
          method: "pdf",
          latencyStrategy:
            "Native PDF text layer extracted first. OCR skipped to keep latency low and avoid duplicate text.",
          warning:
            nativeText.length < 300
              ? "PDF text layer is short. If this is a scanned or image-heavy document, verify that all pages extracted correctly."
              : ""
        };
      }

      let ocrText = "";
      try {
        const screenshotResult = await parser.getScreenshot({
          first: PDF_OCR_PAGE_LIMIT,
          desiredWidth: 1800,
          imageBuffer: true,
          imageDataUrl: false
        });
        ocrText = await recognizeImagesWithBudget(screenshotResult.pages.map((page) => Buffer.from(page.data)));
      } catch {
        return {
          text: "",
          method: "pdf-ocr-unavailable",
          latencyStrategy:
            "No native PDF text layer was found, and server-side PDF screenshot OCR is unavailable in this environment.",
          warning:
            "This PDF appears scanned or image-only. Upload an OCR-enabled PDF, DOCX/TXT copy, or individual page images."
        };
      }

      return {
        text: [nativeText, ocrText].filter(Boolean).join("\n\n"),
        method: "pdf-ocr",
        latencyStrategy:
          "Sparse PDF text detected. OCR was applied only to the first pages to control latency; split large scans for full OCR.",
        warning:
          "PDF appears scanned or low-text. OCR is capped for latency, so upload page ranges or a cleaner OCR PDF if the scan is long."
      };
    } finally {
      await parser.destroy();
    }
  }

  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "webp"].includes(extension ?? "")) {
    const text = await recognizeImagesWithBudget([buffer]);

    return {
      text,
      method: "ocr",
      latencyStrategy:
        "Single-image OCR with a strict time budget. For multi-page scans, upload a PDF or split images page-by-page.",
      warning:
        "Image OCR can misread legal text, especially low resolution, skewed, handwritten, or blurry scans. Verify exact evidence."
    };
  }

  return {
    text: "",
    method: "unsupported",
    latencyStrategy: "No extraction attempted for unsupported file type.",
    warning: "Unsupported file type. Use TXT, PDF, DOCX, PNG, JPG, JPEG, or WEBP."
  };
}

async function recognizeImagesWithBudget(images: Buffer[]) {
  const worker = await createWorker("eng");

  try {
    const pages: string[] = [];
    for (const [index, image] of images.entries()) {
      const text = await withTimeout(
        worker.recognize(image).then((result) => result.data.text),
        OCR_TIMEOUT_MS,
        `OCR timed out on page ${index + 1}. Try a clearer scan or split the document.`
      );
      pages.push(`[OCR page ${index + 1}]\n${text}`);
    }
    return pages.join("\n\n");
  } finally {
    await worker.terminate();
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
