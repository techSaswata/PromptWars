# LEXGUARD

AI contract intelligence for extracting legal text, identifying risk signals, and turning dense agreement language into a visual decision report.

Live deployment: [https://lexguard-6ucd5lskna-el.a.run.app](https://lexguard-6ucd5lskna-el.a.run.app)

## Architecture

LEXGUARD is a Next.js app with a deterministic analysis core and an optional LLM enhancement layer. The deterministic layer owns coverage, evidence extraction, baseline scoring, missing-term detection, and uncertainty reporting. The LLM layer is constrained to improve language, confidence, decision labels, and negotiation framing from that baseline rather than inventing unsupported conclusions.

| Layer | Responsibility | Main Files |
| --- | --- | --- |
| Landing | Minimal entry page with product header and CTA | `src/app/page.tsx`, `src/components/lexguard/hero.tsx` |
| Workspace | Client-side intake, local report restore, analysis orchestration | `src/app/workspace/page.tsx`, `src/components/lexguard-app.tsx` |
| Extraction API | Converts TXT, DOCX, PDF, and image uploads into text with latency-aware fallbacks | `src/app/api/extract/route.ts` |
| Analysis API | Validates input, runs deterministic analysis, applies LLM enhancement, persists report metadata | `src/app/api/analyze/route.ts` |
| Deterministic Core | Clause splitting, risk rules, coverage map, missing terms, confidence thresholds, scoring | `src/lib/analysis.ts` |
| LLM Enhancement | JSON-only model pass for summary, decision display, visual labels, and dynamic confidence | `src/lib/llm.ts` |
| Persistence | Stores report intelligence and a text fingerprint, not raw contract text | `src/lib/persistence.ts`, `src/lib/supabase.ts` |
| Report UI | Visual risk decision, pie chart, findings, coverage, scenarios, playbook, evidence check | `src/components/lexguard/*` |

## Request Flow

| Step | Path | Output |
| --- | --- | --- |
| Upload | Browser sends file to `/api/extract` as multipart form data | Extracted text, method, latency strategy, warning |
| Intake | Workspace app inserts extraction notes into the editable text buffer | User can review or modify extracted text |
| Analyze | Browser sends text and file name to `/api/analyze` | Full `AnalysisReport` JSON |
| Baseline | Deterministic analyzer normalizes text, chunks sections, finds risks, scores report | Evidence-grounded baseline report |
| Enhance | LLM receives contract excerpt plus baseline, returns schema-validated JSON | Dynamic summary, labels, confidence, decision display |
| Persist | Server writes structured report rows when persistence is available | Analysis id or a non-blocking save reason |
| Restore | Browser saves the last completed analysis in `localStorage` | Reload keeps the latest report visible |

## Chunking Strategy

The analyzer starts from document shape rather than arbitrary token windows. It first normalizes whitespace and removes extraction metadata, then looks for headings, numbered clauses, uppercase section labels, and paragraph boundaries. Long sections are split into bounded review units.

| Rule | Value | Reason |
| --- | --- | --- |
| Target section size | ~850 words | Large enough for legal context, small enough for focused risk linking |
| Overlap | ~120 words | Preserves definitions, exceptions, survival language, and cross-clause references |
| Max sections | 80 | Keeps reports responsive and makes truncation explicit |
| Coverage status | `reviewed`, `needs-review`, `limited` | Turns document coverage into visible report state |
| Finding threshold | `0.64` minimum confidence | Filters noisy low-confidence flags before rendering |

Chunking feeds two systems: risk detection and the coverage map. Each section keeps notes, confidence, word count, and linked risk signal count so the UI can show what was reviewed instead of presenting a black-box model answer.

## Latency Strategy

Extraction is optimized for fast, reliable native text first. OCR is treated as a bounded fallback, not a silent full-document guarantee.

| Input | Strategy | Latency Control | Caveat Surfaced |
| --- | --- | --- | --- |
| TXT | Direct UTF-8 read | No parser overhead | None unless input is empty |
| DOCX | `mammoth.extractRawText` | Raw text only, no layout reconstruction | Formatting warnings if Mammoth reports issues |
| Born-digital PDF | `pdf-parse` text layer | OCR skipped when native text exists | Short text layer warning for sparse/image-heavy PDFs |
| Scanned PDF | First pages rendered then OCR attempted | OCR page cap: 3 pages | Warns that long scans need page ranges or OCR-enabled PDFs |
| Images | Tesseract OCR | 45 second timeout per image/page | Warns about OCR misreads and evidence verification |

This design avoids blocking the request on unbounded OCR. When extraction quality is uncertain, the uncertainty is carried into the report through warnings and evidence-check UI rather than hidden.

## Analysis Model

| Stage | Deterministic Role | LLM Role |
| --- | --- | --- |
| Contract type | Infer from document language and file name | Preserve or refine through summary wording |
| Findings | Match risk categories, contradictions, and missing protections | Add compact visual labels and evidence-weighted confidence |
| Score | Calculate from severity, missing terms, warnings, and uncertainty | Choose compatible executive decision text |
| Decision display | Fallback from score band | Generate contract-specific title, badge, and stage labels |
| Trust | Build evidence ledger from confidence and coverage | Explain weak evidence without overstating certainty |

The LLM output is parsed through Zod and clipped to UI-safe limits. If parsing fails or the model is unavailable, the deterministic report remains usable and the failure is surfaced as an edge warning.

## File Structure

```text
.
|-- src/
|   |-- app/
|   |   |-- page.tsx             Landing page
|   |   |-- workspace/page.tsx   Analyzer workspace route
|   |   |-- api/
|   |   |   |-- analyze/route.ts Analysis API
|   |   |   |-- extract/route.ts File extraction API
|   |   |   `-- smoke/route.ts   LLM connectivity probe
|   |   `-- globals.css          Theme, panels, animations
|   |-- components/
|   |   |-- lexguard-app.tsx     Workspace state, API calls, local restore
|   |   `-- lexguard/
|   |       |-- contract-intake.tsx Upload and text input
|   |       |-- report-panel.tsx    Loading state and report composition
|   |       |-- decision-card.tsx   Dynamic decision summary
|   |       |-- findings.tsx        Visual clause flags
|   |       |-- risk-graph.tsx      Risk axis chart and distribution
|   |       |-- coverage-map.tsx    Section coverage and linked signals
|   |       |-- trust-ledger.tsx    Evidence check dashboard
|   |       |-- playbook.tsx        Negotiation actions
|   |       `-- scenario-panel.tsx  Practical risk scenarios
|   `-- lib/
|       |-- analysis.ts          Deterministic contract intelligence
|       |-- llm.ts               LLM enhancement and schema validation
|       |-- persistence.ts       Structured report persistence
|       |-- supabase.ts          Server Supabase client
|       `-- types.ts             Shared report contracts
`-- sql/
    `-- 001_lexguard_schema.sql  Persistence schema
```

## Data Boundaries

| Boundary | Behavior |
| --- | --- |
| Browser restore | Saves the last contract text, file name, and report in localStorage for reload continuity |
| Server persistence | Stores structured intelligence, evidence snippets, and a SHA-256 text fingerprint |
| Raw text in database | Not stored by the persistence layer |
| LLM context | Receives the contract text clipped to 32k characters plus deterministic baseline |
| Validation | API input and model output are schema-checked before use |

## Deployment Shape

The app is deployed to Google Cloud Run as a Next.js production build. Static routes (`/`, `/workspace`) are pre-rendered, while extraction and analysis endpoints run on the Node.js runtime because they need server-side PDF, DOCX, OCR, crypto, and persistence capabilities.
