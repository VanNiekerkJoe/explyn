import { uid } from "@/lib/localdb";

export type ConsoleLevel = "beginner" | "intermediate" | "advanced";
export type ConsoleRole = "user" | "assistant" | "system";

export interface ConsoleMessage {
  id: string;
  role: ConsoleRole;
  parts: { type: "text"; text: string }[];
  createdAt: string;
}

export interface ConsoleSkill {
  id: string;
  name: string;
  instructions: string;
  builtIn: boolean;
}

export interface ConsoleSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ConsoleMessage[];
  skillIds: string[];
  level: ConsoleLevel;
  model: string;
}

const SESSIONS_KEY = "explyn:console-sessions:v1";
const CUSTOM_SKILLS_KEY = "explyn:custom-skills:v1";
const LEGACY_SKILLS_KEY = "explyn:skills";
const LEGACY_LEVEL_KEY = "explyn:console-level";

export const BUILT_IN_SKILLS: ConsoleSkill[] = [
  { id: "explain", name: "Explain", instructions: "Explain code clearly, step by step, with a short summary first.", builtIn: true },
  { id: "debug", name: "Debug", instructions: "Hunt for bugs and edge cases; show the fix as a code block.", builtIn: true },
  { id: "teach", name: "Teach", instructions: "Act as a patient tutor and end with one quick check question.", builtIn: true },
  { id: "review", name: "Review", instructions: "Review code like a senior engineer, focusing on readability, naming, and structure.", builtIn: true },
  { id: "refactor", name: "Refactor", instructions: "Suggest a cleaner refactor and explain why it is better.", builtIn: true },
  { id: "tests", name: "Tests", instructions: "Write unit tests covering main paths and edge cases.", builtIn: true },
  { id: "security", name: "Security", instructions: "Identify security risks involving injection, secrets, authentication, and data handling.", builtIn: true },
];

const validLevel = (value: unknown): value is ConsoleLevel =>
  value === "beginner" || value === "intermediate" || value === "advanced";

const defaultPreferences = () => {
  let skillIds = ["explain"];
  let level: ConsoleLevel = "beginner";
  if (typeof window !== "undefined") {
    try {
      const parsed = JSON.parse(localStorage.getItem(LEGACY_SKILLS_KEY) || "[]");
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string") && parsed.length) skillIds = parsed;
    } catch { /* keep defaults */ }
    const savedLevel = localStorage.getItem(LEGACY_LEVEL_KEY);
    if (validLevel(savedLevel)) level = savedLevel;
  }
  return { skillIds, level };
};

export function createConsoleSession(model: string, title = "New session"): ConsoleSession {
  const now = new Date().toISOString();
  const preferences = defaultPreferences();
  return { id: uid(), title, createdAt: now, updatedAt: now, messages: [], model, ...preferences };
}

function isSession(value: unknown): value is ConsoleSession {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ConsoleSession>;
  return typeof item.id === "string" && typeof item.title === "string" && Array.isArray(item.messages);
}

export function loadConsoleSessions(model: string): ConsoleSession[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
    if (Array.isArray(parsed)) {
      const sessions = parsed.filter(isSession).map((session) => ({
        ...session,
        model: session.model || model,
        level: validLevel(session.level) ? session.level : "beginner" as ConsoleLevel,
        skillIds: Array.isArray(session.skillIds) ? session.skillIds : ["explain"],
      }));
      if (sessions.length) return sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
  } catch { /* create a clean first session */ }
  const initial = createConsoleSession(model);
  saveConsoleSessions([initial]);
  return [initial];
}

export function saveConsoleSessions(sessions: ConsoleSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function loadCustomSkills(): ConsoleSkill[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_SKILLS_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((skill) => skill && typeof skill.id === "string" && typeof skill.name === "string" && typeof skill.instructions === "string")
      : [];
  } catch {
    return [];
  }
}

export function saveCustomSkills(skills: ConsoleSkill[]) {
  localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(skills.filter((skill) => !skill.builtIn)));
}

export function createCustomSkill(name: string, instructions: string): ConsoleSkill {
  return { id: `custom-${uid()}`, name: name.trim(), instructions: instructions.trim(), builtIn: false };
}

export function messageText(message: ConsoleMessage) {
  return message.parts.filter((part) => part.type === "text").map((part) => part.text).join("");
}

export function createConsoleMessage(role: ConsoleRole, text: string): ConsoleMessage {
  return { id: uid(), role, parts: [{ type: "text", text }], createdAt: new Date().toISOString() };
}