import { NextResponse } from "next/server";
import { runBatchExtraction } from "@/lib/ai/batch-processor";
import { recalculateTrustScores } from "@/lib/ai/trust-calculator";
import { checkFreshness } from "@/lib/ai/freshness-checker";

export async function POST(request: Request) {
  try {
    // Verify batch secret
    const authHeader = request.headers.get("Authorization");
    const batchSecret = process.env.BATCH_SECRET || "dev-secret";

    if (authHeader !== `Bearer ${batchSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    let result;

    switch (type) {
      case "extraction":
        result = await runBatchExtraction();
        break;
      case "trust":
        result = await recalculateTrustScores();
        break;
      case "freshness":
        result = await checkFreshness();
        break;
      case "all":
        const extraction = await runBatchExtraction();
        const trust = await recalculateTrustScores();
        const freshness = await checkFreshness();
        result = { extraction, trust, freshness };
        break;
      default:
        return NextResponse.json({ error: "Invalid batch type" }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("[Batch API] Error:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
