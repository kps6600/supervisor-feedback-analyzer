import { NextResponse } from "next/server";
import { buildPrompt } from "@/lib/prompt";

/* ================= PROMPT ================= */

// function buildPrompt(transcript: string) {
//   return `
// You are a STRICT evaluator of a Fellow.

// ================ NON-NEGOTIABLE RULES =================

// 1. Execution ≠ Systems
// - Execution = Fellow does work personally
// - Systems = work continues WITHOUT the Fellow

// 2. SURVIVABILITY TEST (MANDATORY)
// Ask:
// "If the Fellow leaves tomorrow, will the work continue?"

// - If NO → FINAL SCORE MUST BE ≤ 6
// - If YES → systems exist → can score >6

// 3. DO NOT TRUST SUPERVISOR PRAISE
// Ignore:
// - "very helpful"
// - "takes work off my plate"
// - "my right hand"

// → These indicate task absorption (score 5–6)

// 4. SYSTEMS BUILDING (STRICT)
// Mark as systems_building ONLY IF:
// - Used by others
// - Runs without Fellow
// - Adopted by team

// Else → execution

// 5. CRITICAL BOUNDARY
// - 6 = executes tasks given
// - 7 = identifies problems independently

// 6. DO NOT HALLUCINATE
// - Use ONLY exact transcript quotes
// - NO empty quotes
// - NO fake KPIs

// ================ OUTPUT =================

// Return ONLY JSON:

// {
//   "score": {
//     "value": number,
//     "label": "",
//     "justification": ""
//   },
//   "evidence": [
//     {
//       "quote": "",
//       "signal": "positive|negative|neutral",
//       "dimension": "execution|systems_building",
//       "reason": ""
//     }
//   ],
//   "kpis": [
//     {
//       "name": "",
//       "reason": ""
//     }
//   ],
//   "gaps": [
//     {
//       "dimension": "",
//       "detail": ""
//     }
//   ],
//   "questions": [
//     {
//       "question": "",
//       "purpose": ""
//     }
//   ]
// }

// ================ TRANSCRIPT =================

// ${transcript}
// `;
// }

/* ================= API ================= */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transcript = body.transcript;

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript required" },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(transcript);

    /* ===== CALL OLLAMA ===== */
    const ollamaRes = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: prompt,
        stream: false,
      }),
    });

    const data = await ollamaRes.json();

    console.log("FULL RESPONSE:", data);

    /* ===== SAFE RAW EXTRACTION ===== */
    const raw =
      data.response ||
      data.message?.content ||
      "";

    if (!raw) {
      return NextResponse.json({
        error: "Empty response from model",
        full: data,
      });
    }

    console.log("RAW TEXT:", raw);

    /* ===== EXTRACT JSON ===== */
    let parsed;

    try {
      const match = raw.match(/{[\s\S]*}/);

      if (!match) throw new Error("No JSON found");

      parsed = JSON.parse(match[0]);
    } catch (err) {
      return NextResponse.json({
        error: "JSON parse failed",
        raw: raw,
      });
    }

    /* ===== 🚨 SURVIVABILITY GUARD ===== */
    if (parsed.score?.value > 6) {
      const hasRealSystem = parsed.evidence?.some(
        (e: any) =>
          e.dimension === "systems_building" &&
          !e.reason?.toLowerCase().includes("personally") &&
          !e.reason?.toLowerCase().includes("fellow")
      );

      if (!hasRealSystem) {
        parsed.score.value = 6;
        parsed.score.justification +=
          " Adjusted: No survivable system detected.";
      }
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("SERVER ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}