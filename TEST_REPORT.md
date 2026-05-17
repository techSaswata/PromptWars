# LEXGUARD Test Report

## Summary

LEXGUARD was tested across automated unit/API tests, static validation, production build generation, and runtime endpoint self-tests. The focus was on the core contract intelligence path: file extraction, text normalization, deterministic analysis, dynamic risk-axis generation, API validation, and route availability.

| Area | Status | Evidence |
| --- | --- | --- |
| Automated tests | Passed | `7/7` tests passing |
| Lint | Passed | `npm run lint` completed without errors |
| TypeScript | Passed | `npm run typecheck` completed without errors |
| Production build | Passed | `npm run build` generated app routes successfully |
| Local routes | Passed | `/` and `/workspace` returned `200` |
| PDF extraction | Passed | 3-page PDF extracted through `/api/extract` |
| Analysis API | Passed | Extracted PDF text returned findings and risk axes |
| Error handling | Passed | Empty analysis input returned `EMPTY_CONTRACT` |

## Test Commands Executed

| Command | Purpose | Result |
| --- | --- | --- |
| `npm test` | Runs the Node test suite for analyzer and API validation | Passed |
| `npm run lint` | Runs ESLint and Next/React static checks | Passed |
| `npm run typecheck` | Runs TypeScript validation across app, API, and tests | Passed |
| `npm run build` | Builds the production Next.js app | Passed |

Latest automated test summary:

```text
tests 7
suites 2
pass 7
fail 0
cancelled 0
skipped 0
todo 0
```

## Automated Test Coverage

### `test/analysis.test.ts`

This suite validates deterministic contract intelligence behavior without requiring an external model call.

| Test | What It Proves |
| --- | --- |
| Normalizes contract text without changing legal content | Whitespace and line-ending cleanup is stable before analysis |
| Detects concrete risk findings from contract language | Liability, privacy, and arbitration signals are found from realistic terms |
| Filters rendered findings by confidence threshold | Low-confidence/noisy findings do not leak into the visible report |
| Removes extraction metadata before analysis warnings are built | Internal extraction notes do not create false scary OCR/PDF warnings |
| Builds risk axes from actual findings instead of fixed buckets | Risk chart axes are content-derived, not static canned categories |

Core assertions include:

| Assertion Type | Example |
| --- | --- |
| Source validation | Report source is deterministic in pure analyzer tests |
| Finding validation | Findings contain categories like `liability`, `privacy`, and `arbitration` |
| Evidence grounding | Every finding includes non-empty evidence |
| Confidence gate | Visible findings are `>= 0.64` confidence |
| Dynamic axis check | Fixed bucket label `Financial Exposure` is not used |

### `test/analyze-route.test.ts`

This suite validates API input handling before expensive analysis work runs.

| Test | Expected Response |
| --- | --- |
| Empty contract text | HTTP `400`, error `EMPTY_CONTRACT` |
| Invalid payload type | HTTP `400`, error `INVALID_INPUT`, includes `issues` array |

These tests protect the API boundary from bad client input and ensure typed errors are returned to the UI.

## Runtime Endpoint Self-Test

The app was also exercised against a running local server to verify behavior across actual HTTP boundaries.

| Runtime Check | Endpoint / Route | Result |
| --- | --- | --- |
| Landing route loads | `/` | `200` |
| Workspace route loads | `/workspace` | `200` |
| PDF upload extracts text | `POST /api/extract` | Returned `method: "pdf"` and readable text |
| Extracted PDF text analyzes | `POST /api/analyze` | Returned findings and risk axes |
| Empty analysis rejects cleanly | `POST /api/analyze` | Returned `EMPTY_CONTRACT` |

Runtime sample output:

```text
route /: 200
route /workspace: 200
extract method: pdf
extract chars: 3046
analysis source: deterministic
findings: 7
risk axes: Intellectual Property Ownership Transfer, Indemnity Exposure, Payment Pressure, Forum Leverage
empty analyze error: EMPTY_CONTRACT
```

## Test Document Used

| File | Purpose |
| --- | --- |
| `test_docs/lexguard-three-page-services-agreement.pdf` | Multi-page PDF fixture for extraction and end-to-end analysis |

The fixture includes realistic service-agreement language around data handling, suspension, termination, fees, indemnity, liability caps, intellectual property, and arbitration. This creates enough risk variety to test extraction, findings, scoring, coverage, and dynamic chart labels.

## Endpoint Response Validation

| Endpoint | Success Behavior Tested | Error Behavior Tested |
| --- | --- | --- |
| `POST /api/extract` | PDF text layer extraction returns text, method, strategy, and warning fields | Unsupported/no-file shapes are documented in README |
| `POST /api/analyze` | Returns report with findings, dynamic risk axes, coverage, and metadata | Empty text and invalid payload return typed `400` responses |
| `GET /api/smoke` | Response shape documented for model connectivity | Missing model configuration response documented |

## Production Build Verification

The production build completed and generated these routes:

| Route | Build Mode |
| --- | --- |
| `/` | Static |
| `/workspace` | Static |
| `/api/analyze` | Dynamic |
| `/api/extract` | Dynamic |
| `/api/smoke` | Dynamic |

This confirms the app compiles for deployment and keeps server-side API routes available for PDF, DOCX, OCR, model, crypto, and persistence work.

## Risk Areas Covered

| Risk Area | Coverage |
| --- | --- |
| Contract normalization | Unit-tested |
| False OCR/extraction warnings | Unit-tested |
| Risk finding detection | Unit-tested |
| Confidence filtering | Unit-tested |
| Dynamic risk-axis generation | Unit-tested and runtime-tested |
| API input validation | Unit-tested and runtime-tested |
| PDF extraction | Runtime-tested |
| Route availability | Runtime-tested |
| Type contracts | Typecheck-tested |
| Production readiness | Build-tested |

## Known Limits

| Limit | Reason |
| --- | --- |
| LLM output quality is not unit-tested with a live model | Model output is non-deterministic; schema validation and deterministic fallback protect the app |
| Full OCR for long scanned PDFs is not exhaustively tested | OCR is intentionally latency-bounded and capped |
| Browser-local restore is not covered by automated browser tests | It is implemented through `localStorage`; future Playwright coverage would test reload behavior directly |
| Supabase persistence is not integration-tested here | Persistence is non-blocking and gracefully reports save failures |

## Conclusion

The core LEXGUARD flow has been tested from both code-level and runtime perspectives:

1. Static checks confirm code quality and type safety.
2. Automated tests validate deterministic analysis and API error behavior.
3. Runtime self-tests validate route availability, PDF extraction, analysis response shape, dynamic axes, and typed errors.
4. Production build confirms the app is deployable with the expected static and dynamic routes.
