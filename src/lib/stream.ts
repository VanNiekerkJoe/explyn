import { streamChat, chatOnce, type ChatMessage } from "@/lib/ai";
import {
  analysisSystemPrompt,
  codeChatSystemPrompt,
  learnSystemPrompt,
  ELEMENT_SYSTEM_PROMPT,
  elementUserPrompt,
  type LearnMode,
} from "@/lib/prompts";

/** Tutor / lesson / challenge / feedback streaming used by the learning pages. */
export async function streamLearn(
  body: {
    mode: LearnMode;
    messages: ChatMessage[];
    language: string;
    level: string;
    topic?: string;
  },
  onDelta: (text: string) => void,
) {
  const system = learnSystemPrompt(body.mode, body.level, body.language, body.topic);
  await streamChat([{ role: "system", content: system }, ...body.messages], onDelta);
}

/** Full code analysis (explain / debug / learn report). */
export async function streamAnalysis(
  files: { path: string; language: string; content: string }[],
  level: string,
  mode: string,
  onDelta: (text: string) => void,
) {
  const fileContents = files
    .map(
      (f) =>
        `### File: ${f.path} (${f.language})\n\`\`\`${f.language.toLowerCase()}\n${f.content}\n\`\`\``,
    )
    .join("\n\n");

  await streamChat(
    [
      { role: "system", content: analysisSystemPrompt(level, mode) },
      { role: "user", content: `Analyse the following codebase:\n\n${fileContents}` },
    ],
    onDelta,
  );
}

/** Context-aware chat about a loaded codebase. */
export async function streamCodeChat(
  messages: ChatMessage[],
  codeContext: { path: string; content: string }[],
  level: string,
  onDelta: (text: string) => void,
) {
  const snippets = codeContext.map((f) => `File: ${f.path}\n${f.content}`).join("\n---\n");
  await streamChat(
    [{ role: "system", content: codeChatSystemPrompt(level, snippets) }, ...messages],
    onDelta,
  );
}

export interface ElementExplanation {
  whatThisIs: string;
  whatItDoesHere: string;
  whyItsUsed: string;
  example: string | null;
  proInsight: string | null;
}

/** Explains a single tapped expression, returning structured JSON. */
export async function explainElement(args: {
  selectedText: string;
  lineContent: string;
  lineNumber: number;
  fullCode: string;
  fileName?: string;
  language?: string;
  level?: string;
}): Promise<ElementExplanation> {
  const content = await chatOnce([
    { role: "system", content: ELEMENT_SYSTEM_PROMPT },
    { role: "user", content: elementUserPrompt(args) },
  ]);

  const cleaned = content
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as ElementExplanation;
  } catch {
    return {
      whatThisIs: content,
      whatItDoesHere: "",
      whyItsUsed: "",
      example: null,
      proInsight: null,
    };
  }
}
