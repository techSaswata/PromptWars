import { NextResponse } from "next/server";
import { smokeTestLlm } from "@/lib/llm";

export async function GET() {
  try {
    const result = await smokeTestLlm();
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Smoke test failed."
      },
      { status: 500 }
    );
  }
}
