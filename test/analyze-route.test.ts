import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { POST } from "../src/app/api/analyze/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("analyze API route", () => {
  it("rejects empty contract text with a typed error", async () => {
    const response = await POST(jsonRequest({ text: "   " }));
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error, "EMPTY_CONTRACT");
  });

  it("rejects invalid payloads before analysis runs", async () => {
    const response = await POST(jsonRequest({ text: 123 }));
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error, "INVALID_INPUT");
    assert.ok(Array.isArray(payload.issues));
  });
});
