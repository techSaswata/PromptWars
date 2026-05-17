# LEXGUARD OCR And Chunking Strategy

LEXGUARD uses a latency-aware pipeline so large and messy documents are supported without pretending OCR is perfect.

## Extraction Priority

1. Native text first for `.txt`, `.docx`, and born-digital PDFs. This is fastest and usually most accurate.
2. Sparse PDF fallback: if a PDF has very little text, LEXGUARD treats it as likely scanned and runs OCR only on the first few pages inside the request latency budget.
3. Image OCR for `.png`, `.jpg`, `.jpeg`, and `.webp` with a strict timeout.
4. Every OCR path adds a visible warning so the user verifies evidence against the original scan.

## Latency Rules

- Native text extraction should stay fast for normal documents.
- OCR is intentionally bounded because full OCR on large scanned PDFs can take many seconds or minutes.
- Long scanned PDFs should be split into page ranges or converted to a searchable OCR PDF before upload.
- LEXGUARD surfaces partial OCR as uncertainty instead of treating omitted pages as safe.

## Chunking Rules

- Prefer legal structure first: headings, numbered sections, all-caps section names, paragraphs.
- For long sections, use approximately 850-word chunks with 120-word overlap.
- Overlap preserves cross-boundary context, such as definitions, exceptions, survival language, and references to previous clauses.
- Every chunk becomes a coverage-map entry with a status: `reviewed`, `needs-review`, or `limited`.

## Anti-Overlook Policy

LEXGUARD never claims perfect legal review. Instead, it tries to make missed-risk conditions visible:

- Low-quality OCR becomes an uncertainty note.
- Sparse text becomes an uncertainty note.
- External exhibits, schedules, appendices, or referenced URLs become an uncertainty note.
- Contradictions become flags.
- Missing protections become absence flags.
- Long documents are chunked and displayed in the coverage map.
