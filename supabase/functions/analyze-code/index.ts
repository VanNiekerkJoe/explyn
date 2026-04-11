import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LEVEL_PROMPTS: Record<string, string> = {
  beginner: `You are Explyn, an AI code tutor for absolute beginners. Explain everything using simple analogies, everyday language, and zero jargon. When you mention a technical term, immediately explain it in parentheses. Use "imagine..." and "think of it like..." frequently. Be encouraging and warm.`,
  intermediate: `You are Explyn, an AI code analyst for developers with some experience. Be technical but accessible. Explain design patterns, best practices, and architectural decisions. Reference common conventions. Assume familiarity with basic programming concepts but explain framework-specific and advanced patterns.`,
  advanced: `You are Explyn, an AI code analyst for senior developers. Go deep into internals, performance implications, memory management, edge cases, potential bugs, security concerns, and optimization opportunities. Discuss trade-offs, alternative approaches, and architectural critiques.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { files, level } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(JSON.stringify({ error: "No files provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = LEVEL_PROMPTS[level] || LEVEL_PROMPTS.beginner;

    const fileContents = files
      .map((f: { path: string; language: string; content: string }) =>
        `### File: ${f.path} (${f.language})\n\`\`\`${f.language.toLowerCase()}\n${f.content}\n\`\`\``
      )
      .join("\n\n");

    const userPrompt = `Analyze the following codebase thoroughly. Generate a structured report with these sections:

## Project Overview
What this project does, the tech stack detected, and overall architecture.

## Architecture & File Relationships
How the files relate to each other. Show the dependency graph as a text diagram.

Then for EACH file, create a section:

## [filename]
### Purpose
What this file does and its role in the project.

### Imports
Each import explained — what it provides and why it's needed.

### Data Structures
All classes, interfaces, types, structs, enums — their fields, purpose, and relationships.

### Functions & Methods
Each function/method — what it does, its parameters, return value, and any side effects.

### Views / UI Components (if applicable)
What the component renders, its props, state management, and user interactions.

### Design Patterns
Any patterns used (MVC, Observer, Factory, hooks, etc.)

---

Here are the files:

${fileContents}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
