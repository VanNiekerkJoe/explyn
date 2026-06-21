import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Mode = "tutor" | "lesson" | "challenge" | "feedback";

const systemFor = (mode: Mode, level: string, language: string, topic?: string) => {
  const levelDesc =
    level === "advanced"
      ? "advanced learner — go deep, use precise terms, discuss tradeoffs"
      : level === "intermediate"
      ? "intermediate learner — technical but accessible, real examples"
      : "complete beginner — simple language, analogies, tiny steps";

  if (mode === "tutor") {
    return `You are Explyn, a patient, encouraging coding tutor for students. Teach at the ${levelDesc} level. Default language: ${language}.
Rules:
- Use markdown with fenced code blocks (\`\`\`${language.toLowerCase()}).
- Prefer short, runnable examples over long lectures.
- When the student is stuck, ask one guiding question instead of dumping the answer.
- Always end with a tiny "Try this:" challenge.`;
  }

  if (mode === "lesson") {
    return `You are Explyn, generating a structured lesson for a ${levelDesc}.
Topic: ${topic ?? "general programming"} in ${language}.
Output strictly in markdown using these sections:
## 1. What you'll learn
## 2. Core idea (with a real-world analogy)
## 3. Minimal example
\`\`\`${language.toLowerCase()}
// short, runnable
\`\`\`
## 4. Walkthrough (line-by-line)
## 5. Common mistakes
## 6. Practice (3 small tasks, increasing difficulty)
## 7. Next step (what to learn after this)
Keep total under ~600 words. No fluff.`;
  }

  if (mode === "challenge") {
    return `You are Explyn, generating ONE coding challenge for a ${levelDesc} in ${language}.
Topic: ${topic ?? "fundamentals"}.
Output strict markdown:
## Challenge: <title>
**Difficulty:** Easy | Medium | Hard
**Goal:** one sentence.
### Description
2-4 sentences.
### Starter code
\`\`\`${language.toLowerCase()}
// stub the student should complete
\`\`\`
### Examples
- Input: ... → Output: ...
### Hints
- 2-3 hints, progressively more revealing.
Do NOT give the solution.`;
  }

  // feedback
  return `You are Explyn, reviewing a student's solution at the ${levelDesc} level. Language: ${language}.
Output markdown:
## Verdict
✅ Correct / ⚠️ Partially correct / ❌ Not quite
## What works
## What to fix
## Suggested improvement
\`\`\`${language.toLowerCase()}
// improved version
\`\`\`
## Concept to revisit
Be encouraging and specific.`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { mode = "tutor", messages = [], level = "beginner", language = "Python", topic } =
      await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = systemFor(mode as Mode, level, language, topic);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429)
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (response.status === 402)
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("learn-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
