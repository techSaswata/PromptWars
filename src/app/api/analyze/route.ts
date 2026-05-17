import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeWithOptionalLlm } from "@/lib/llm";
import { persistAnalysisReport } from "@/lib/persistence";

const analyzeSchema = z.object({
  text: z.string().max(250000),
  fileName: z.string().max(180).optional()
});

export async function POST(request: Request) {
  try {
    const payload = analyzeSchema.parse(await request.json());

    if (!payload.text.trim()) {
      return NextResponse.json(
        {
          error: "EMPTY_CONTRACT",
          message: "Paste or upload readable contract text before analysis."
        },
        { status: 400 }
      );
    }

    const report = await analyzeWithOptionalLlm(payload.text, payload.fileName);
    const persistence = await persistAnalysisReport({
      report,
      text: payload.text,
      fileName: payload.fileName
    });

    return NextResponse.json({
      ...report,
      persistence
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "Input is invalid or too large for this prototype.",
          issues: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "ANALYSIS_FAILED",
        message: error instanceof Error ? error.message : "Unexpected analysis failure."
      },
      { status: 500 }
    );
  }
}
