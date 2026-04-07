import { NextRequest, NextResponse } from "next/server";
import { runBatchExtraction } from "@/lib/ai/batch-processor";
import { recalculateTrustScores } from "@/lib/ai/trust-calculator";
import { checkFreshness } from "@/lib/ai/freshness-checker";
import { purgeInactiveThreads } from "@/lib/ai/inactivity-purge";
import { checkExtractionThresholds } from "@/lib/ai/threshold-extractor";
import { generateAllPendingSummaries } from "@/lib/ai/topic-summary-generator";
import { updateTalkRoomThemes, seedMegaWikis } from "@/app/actions/seed";

/**
 * Vercel Cron calls GET /api/batch?type=all
 * Manual calls use POST /api/batch with JSON body
 */

export const maxDuration = 300; // AI batch processing requires max Vercel timeout (5 minutes)
export const dynamic = "force-dynamic"; // Prevent aggressive static caching of GET endpoint

function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("Authorization");
  const batchSecret = process.env.BATCH_SECRET || "dev-secret";

  // Vercel Cron sends the CRON_SECRET automatically
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  // Manual API calls
  if (authHeader === `Bearer ${batchSecret}`) return true;

  return false;
}

async function handleBatch(type: string) {
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
    case "seed-themes":
      result = await updateTalkRoomThemes();
      break;
    case "seed-mega-wikis":
      result = await seedMegaWikis();
      break;
    case "inactivity-purge":
      result = await purgeInactiveThreads();
      break;
    case "threshold":
      result = await checkExtractionThresholds();
      break;
    case "topic-summaries":
      result = await generateAllPendingSummaries();
      break;
    case "all": {
      const extraction = await runBatchExtraction();
      const trust = await recalculateTrustScores();
      const freshness = await checkFreshness();
      const purge = await purgeInactiveThreads();
      const topicSummaries = await generateAllPendingSummaries();
      result = { extraction, trust, freshness, purge, topicSummaries };
      break;
    }
    default:
      return NextResponse.json({ error: "Invalid batch type" }, { status: 400 });
  }

  return NextResponse.json({ success: true, result });
}

// GET handler for Vercel Cron
export async function GET(request: NextRequest) {
  try {
    if (!verifyAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get("type") || "all";
    return handleBatch(type);
  } catch (err) {
    console.error("[Batch API GET] Error:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}

// POST handler for manual calls
export async function POST(request: NextRequest) {
  try {
    if (!verifyAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;
    return handleBatch(type || "all");
  } catch (err) {
    console.error("[Batch API POST] Error:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
