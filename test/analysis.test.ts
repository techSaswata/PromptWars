import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeContractDeterministically, normalizeContract } from "../src/lib/analysis";

const riskyServicesAgreement = `
MASTER SERVICES AGREEMENT

Customer will indemnify and hold Provider harmless from all claims, damages, penalties, costs,
liabilities, and attorneys' fees arising from Customer data or Customer's use of the service.

Provider may suspend access immediately if Provider believes Customer's use creates a security
risk, violates law, threatens platform stability, or may expose Provider to liability.

Provider may collect, retain, and share personal data with third-party providers for analytics,
security monitoring, product improvement, and compliance purposes.

All disputes will be resolved by binding arbitration in Provider's home state. Customer waives
class actions and jury trials.
`;

describe("deterministic contract analysis", () => {
  it("normalizes contract text without changing legal content", () => {
    assert.equal(normalizeContract("Alpha\r\n\r\n\r\nBeta\t Clause"), "Alpha\n\nBeta Clause");
  });

  it("detects concrete risk findings from contract language", () => {
    const report = analyzeContractDeterministically(riskyServicesAgreement, "services-agreement.txt");
    const categories = new Set(report.findings.map((finding) => finding.category));

    assert.equal(report.source, "deterministic");
    assert.ok(report.riskScore > 0);
    assert.ok(categories.has("liability"));
    assert.ok(categories.has("privacy"));
    assert.ok(categories.has("arbitration"));
    assert.ok(report.findings.every((finding) => finding.evidence.length > 0));
  });

  it("filters rendered findings by confidence threshold", () => {
    const report = analyzeContractDeterministically("This short agreement says only that parties may cooperate.");

    assert.ok(report.findings.every((finding) => finding.confidence >= 0.64));
  });

  it("removes extraction metadata before analysis warnings are built", () => {
    const report = analyzeContractDeterministically(`
      Vendor may share personal data with third-party providers.

      [Extraction method: pdf]
      [Latency strategy: Native PDF text layer extracted first.]
      [Extraction warning: PDF appears scanned or OCR content.]
    `);

    assert.ok(
      !report.edgeWarnings.some((warning) => warning.includes("PDF appears scanned or OCR content")),
      "extraction metadata should not create scary input-quality warnings"
    );
  });

  it("builds risk axes from actual findings instead of fixed buckets", () => {
    const report = analyzeContractDeterministically(riskyServicesAgreement, "services-agreement.txt");
    const axisNames = report.riskAxes.map((axis) => axis.name);

    assert.ok(report.riskAxes.length >= 3);
    assert.ok(axisNames.some((name) => /indemnity|liability/i.test(name)));
    assert.ok(axisNames.some((name) => /data|privacy/i.test(name)));
    assert.ok(axisNames.some((name) => /forum|arbitration|dispute/i.test(name)));
    assert.ok(!axisNames.includes("Financial Exposure"));
    assert.ok(report.riskAxes.every((axis) => axis.score >= 0 && axis.score <= 100));
  });
});
