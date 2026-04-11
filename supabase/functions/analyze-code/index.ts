import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LEVEL_PROMPTS: Record<string, string> = {
  beginner: `You explain code for absolute beginners. Use simple analogies, everyday language, zero jargon. When you mention a technical term, immediately explain it. Use "imagine..." and "think of it like..." frequently. Be encouraging.`,
  intermediate: `You explain code for developers with some experience. Be technical but accessible. Explain design patterns, best practices, and architectural decisions. Assume familiarity with basics.`,
  advanced: `You explain code for senior developers. Go deep into internals, performance implications, memory management, edge cases, security concerns, and optimization opportunities. Discuss trade-offs.`,
};

const MODE_PROMPTS: Record<string, string> = {
  explain: `You are Explyn, an AI code analyst. Generate a structured, thorough report covering:

## Project Overview
What this project does, tech stack detected, overall architecture.

## Architecture & File Relationships
How files relate. Show dependency graph as text diagram.

For EACH file:
## [filename]
### Purpose
### Imports (each import explained)
### Data Structures (classes, interfaces, types, enums)
### Functions & Methods (what each does, params, returns, side effects)
### Views / UI Components (if applicable)
### Design Patterns`,

  debug: `You are Explyn in Debug Mode. Scan the code for bugs, errors, and issues. Generate:

## Bug Summary
Overview of all issues found, severity ratings (🔴 Critical, 🟡 Warning, 🟢 Info).

## Detailed Bug Report
For each bug found:
### Bug #N — [Short title]
- **File**: path
- **Line(s)**: approximate location
- **Severity**: Critical/Warning/Info
- **What's wrong**: Clear explanation of the bug
- **Why it happens**: Root cause analysis
- **Fix**: Corrected code with explanation
- **Prevention**: How to avoid this in future

## Code Quality Issues
Style, naming, complexity, missing error handling, etc.

## Security Concerns
Any security vulnerabilities detected.

## Suggested Improvements
Refactoring and optimization opportunities.`,

  learn: `You are Explyn in Learning Mode. Convert the code into an interactive mini-lesson. Generate:

## Lesson Overview
What the student will learn from this code, prerequisites.

## Concepts Covered
List each programming concept used (e.g. loops, OOP, recursion, closures) with a badge.

## Step-by-Step Walkthrough
Walk through the code in logical order, explaining each concept as it appears. Use:
- 🔑 Key Concept callouts
- 💡 Real-world analogies
- ⚡ "Did you know?" tips

## Code Deep Dive
The actual code with inline annotations explaining WHY each part exists.

## Knowledge Check
3-5 quiz questions about the code:
- **Q1**: [Question]
  - A) ...
  - B) ...
  - C) ...
  - **Answer**: [Letter] — [Explanation]

## Real-World Applications
Where these concepts are used in industry.

## Next Steps
What to learn next based on these concepts.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { files, level, mode = "explain" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(JSON.stringify({ error: "No files provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const levelPrompt = LEVEL_PROMPTS[level] || LEVEL_PROMPTS.beginner;
    const modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.explain;
    const systemPrompt = `${levelPrompt}\n\n${modePrompt}`;

    const fileContents = files
      .map((f: { path: string; language: string; content: string }) =>
        `### File: ${f.path} (${f.language})\n\`\`\`${f.language.toLowerCase()}\n${f.content}\n\`\`\``)
      .join("\n\n");

    const userPrompt = `Analyse the following codebase:\n\n${fileContents}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI analysis failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
