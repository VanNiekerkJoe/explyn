import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LEVEL_PROMPTS: Record<string, string> = {
  beginner: `🟢 SKILL LEVEL: Beginner
- Use very simple language, no jargon
- Use analogies and real-world examples
- Explain WHAT it is before HOW it works
- Assume zero programming knowledge
- Be warm and encouraging`,

  intermediate: `🟡 SKILL LEVEL: Intermediate
- Use proper technical terms but explain them briefly
- Explain both concept and implementation
- Keep clarity high, balance depth`,

  advanced: `🔴 SKILL LEVEL: Pro
- Be concise and technical
- Focus on usage, patterns, and implications
- Skip basic definitions entirely
- Include performance and architecture insights`,
};

const systemPrompt = `You are Explyn, a context-aware code explanation assistant.

A user has tapped on a specific element in their code. Generate a focused, contextual explanation.

OUTPUT FORMAT (strict JSON):

{
  "whatThisIs": "Brief explanation of the concept itself",
  "whatItDoesHere": "What this specific element does in THIS code context",
  "whyItsUsed": "Why the developer used this here, what problem it solves",
  "example": "A small illustrative code example (optional, can be null)",
  "proInsight": "Best practices, common mistakes, performance notes (only for intermediate/pro, null for beginner)"
}

RULES:
- Keep each field concise (2-4 sentences max)
- whatItDoesHere MUST reference the surrounding code — never be generic
- example should be a tiny snippet (3-5 lines max) or null
- proInsight is null for beginner level
- Return ONLY valid JSON, no markdown wrapping`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { selectedText, lineContent, lineNumber, fullCode, fileName, language, level = "beginner" } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!selectedText || !fullCode) {
      return new Response(JSON.stringify({ error: "Missing selectedText or fullCode" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const levelPrompt = LEVEL_PROMPTS[level] || LEVEL_PROMPTS.beginner;

    const userPrompt = `${levelPrompt}

FILE: ${fileName || "unknown"} (${language || "unknown"})
LINE ${lineNumber || "?"}: ${lineContent || selectedText}

SELECTED ELEMENT: "${selectedText}"

SURROUNDING CODE (for context):
\`\`\`${(language || "").toLowerCase()}
${fullCode.slice(0, 6000)}
\`\`\`

Generate the explanation JSON for the selected element.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI request failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from the AI response
    let parsed;
    try {
      // Strip markdown code fences if present
      const cleaned = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { whatThisIs: content, whatItDoesHere: "", whyItsUsed: "", example: null, proInsight: null };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("explain-element error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
