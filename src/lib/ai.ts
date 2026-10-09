/**
 * Bring-your-own-AI client.
 *
 * Explyn talks to ANY OpenAI-compatible chat-completions endpoint.
 * The endpoint, key and model are configured by the person running the app
 * (Settings page) and stored in their own browser — nothing is sent anywhere
 * except directly to the provider they chose.
 */

export interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AIPreset {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
  needsKey: boolean;
  hint: string;
}

const STORAGE_KEY = "explyn:ai-config";

export const AI_PRESETS: AIPreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    needsKey: true,
    hint: "Get a key at platform.openai.com",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "anthropic/claude-3.5-sonnet",
    needsKey: true,
    hint: "One key, hundreds of models — openrouter.ai",
  },
  {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    needsKey: true,
    hint: "Very fast open models — console.groq.com",
  },
  {
    id: "together",
    label: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    needsKey: true,
    hint: "Open models — api.together.xyz",
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.1",
    needsKey: false,
    hint: "Runs fully offline on your machine. Start with: ollama serve",
  },
  {
    id: "lmstudio",
    label: "LM Studio (local)",
    baseUrl: "http://localhost:1234/v1",
    model: "local-model",
    needsKey: false,
    hint: "Start the local server inside LM Studio",
  },
  {
    id: "custom",
    label: "Custom / self-hosted",
    baseUrl: "",
    model: "",
    needsKey: false,
    hint: "Any OpenAI-compatible /chat/completions endpoint",
  },
];

export const EMPTY_CONFIG: AIConfig = { baseUrl: "", apiKey: "", model: "" };

export class AINotConfiguredError extends Error {
  constructor() {
    super("No AI provider configured yet. Open Settings and add your own AI.");
    this.name = "AINotConfiguredError";
  }
}

export function getAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CONFIG;
    const parsed = JSON.parse(raw) as Partial<AIConfig>;
    return {
      baseUrl: parsed.baseUrl?.trim() || "",
      apiKey: parsed.apiKey?.trim() || "",
      model: parsed.model?.trim() || "",
    };
  } catch {
    return EMPTY_CONFIG;
  }
}

export function saveAIConfig(config: AIConfig) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      baseUrl: config.baseUrl.trim().replace(/\/+$/, ""),
      apiKey: config.apiKey.trim(),
      model: config.model.trim(),
    }),
  );
  window.dispatchEvent(new Event("explyn:ai-config-changed"));
}

export function clearAIConfig() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("explyn:ai-config-changed"));
}

export function isAIConfigured(): boolean {
  const c = getAIConfig();
  return Boolean(c.baseUrl && c.model);
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function endpoint(config: AIConfig) {
  const base = config.baseUrl.replace(/\/+$/, "");
  return base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
}

function headers(config: AIConfig): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) h.Authorization = `Bearer ${config.apiKey}`;
  return h;
}

async function readError(response: Response) {
  const text = await response.text().catch(() => "");
  try {
    const parsed = JSON.parse(text);
    return parsed?.error?.message || parsed?.error || parsed?.message || text;
  } catch {
    return text || `Request failed (${response.status})`;
  }
}

/** Streams an OpenAI-compatible chat completion, calling onDelta with each text chunk. */
export async function streamChat(
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  options: { temperature?: number; signal?: AbortSignal } = {},
) {
  const config = getAIConfig();
  if (!config.baseUrl || !config.model) throw new AINotConfiguredError();

  const response = await fetch(endpoint(config), {
    method: "POST",
    headers: headers(config),
    signal: options.signal,
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    }),
  });

  if (!response.ok) throw new Error(await readError(response));
  if (!response.body) throw new Error("No response body from the AI provider");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let ni: number;
    while ((ni = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, ni);
      buffer = buffer.slice(ni + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") {
        if (payload === "[DONE]") return;
        continue;
      }
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) onDelta(delta);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
}

/** Non-streaming completion — returns the full assistant text. */
export async function chatOnce(
  messages: ChatMessage[],
  options: { temperature?: number } = {},
): Promise<string> {
  const config = getAIConfig();
  if (!config.baseUrl || !config.model) throw new AINotConfiguredError();

  const response = await fetch(endpoint(config), {
    method: "POST",
    headers: headers(config),
    body: JSON.stringify({
      model: config.model,
      messages,
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    }),
  });

  if (!response.ok) throw new Error(await readError(response));
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/** Quick round-trip used by the Settings page to verify a configuration. */
export async function testAIConnection(config: AIConfig): Promise<string> {
  const response = await fetch(endpoint(config), {
    method: "POST",
    headers: headers(config),
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: "Reply with the single word: ready" }],
      max_tokens: 16,
    }),
  });
  if (!response.ok) throw new Error(await readError(response));
  const data = await response.json();
  return (data.choices?.[0]?.message?.content ?? "").trim() || "ok";
}

/** Lists the models installed in a local Ollama instance. */
export async function listOllamaModels(config: AIConfig): Promise<string[]> {
  const base = config.baseUrl.trim().replace(/\/+$/, "").replace(/\/v1$/i, "");
  if (!base) throw new Error("Add the Ollama server address first.");

  const response = await fetch(`${base}/api/tags`);
  if (!response.ok) throw new Error(await readError(response));

  const data = (await response.json()) as {
    models?: { name?: string; model?: string }[];
  };
  return Array.from(
    new Set(
      (data.models ?? [])
        .map((model) => model.name || model.model)
        .filter((model): model is string => Boolean(model)),
    ),
  );
}

/** Downloads a model through Ollama and reports its current pull status. */
export async function pullOllamaModel(
  config: AIConfig,
  model: string,
  onProgress: (status: string, completed?: number, total?: number) => void,
): Promise<void> {
  const base = config.baseUrl.trim().replace(/\/+$/, "").replace(/\/v1$/i, "");
  if (!base) throw new Error("Add the Ollama server address first.");

  const response = await fetch(`${base}/api/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, stream: true }),
  });
  if (!response.ok) throw new Error(await readError(response));
  if (!response.body) throw new Error("Ollama did not return download progress.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const reportLine = (line: string) => {
    if (!line.trim()) return;
    const progress = JSON.parse(line) as {
      status?: string;
      completed?: number;
      total?: number;
      error?: string;
    };
    if (progress.error) throw new Error(progress.error);
    onProgress(progress.status ?? "Downloading model", progress.completed, progress.total);
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    let newline = buffer.indexOf("\n");
    while (newline !== -1) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      reportLine(line);
      newline = buffer.indexOf("\n");
    }
    if (done) break;
  }
  if (buffer.trim()) reportLine(buffer);
}
