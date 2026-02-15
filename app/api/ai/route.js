import { NextResponse } from "next/server";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const ALLOWED_CONTEXTS = new Set(["planning", "marketing", "scheduling", "research"]);

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY on server." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const prompt = String(body?.prompt || "").trim();
    const model = String(body?.model || "gemini-2.5-flash").trim();
    const context = String(body?.context || "planning").trim().toLowerCase();
    const projectSnapshot = body?.projectSnapshot || {};

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const safeContext = ALLOWED_CONTEXTS.has(context) ? context : "planning";
    const endpoint = `${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const systemInstruction = buildSystemInstruction(safeContext);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "Project snapshot:",
                  JSON.stringify(projectSnapshot, null, 2),
                  "",
                  "User request:",
                  prompt,
                ].join("\n"),
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Gemini request failed." },
        { status: response.status }
      );
    }

    const text = extractText(data);
    if (!text) {
      return NextResponse.json(
        { error: "Gemini returned no text output." },
        { status: 502 }
      );
    }

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error while calling Gemini." },
      { status: 500 }
    );
  }
}

function buildSystemInstruction(context) {
  if (context === "marketing") {
    return "You are a pragmatic marketing strategist. Output concise, actionable plans with channels, messaging, sequencing, and KPIs.";
  }
  if (context === "scheduling") {
    return "You are a delivery planner. Provide realistic sequencing, timeboxing, dependencies, and explicit risk notes.";
  }
  if (context === "research") {
    return "You are a research analyst. Provide structured findings, assumptions, and confidence level for each key claim.";
  }
  return "You are a project planning copilot. Produce practical execution plans with prioritized steps, ownership suggestions, and risks.";
}

function extractText(payload) {
  const candidate = payload?.candidates?.[0];
  const parts = candidate?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part) => String(part?.text || ""))
    .join("\n")
    .trim();
}
