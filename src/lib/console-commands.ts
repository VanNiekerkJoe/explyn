export type CommandCategory = "AI" | "Learn" | "Code" | "Git" | "Session" | "Navigate" | "Utility";

export interface ConsoleCommand {
  name: string;
  description: string;
  category: CommandCategory;
  aliases?: string[];
  args?: string;
  /** Prompt template commands send an AI request. `ctx` is the previous assistant answer. */
  prompt?: (arg: string, ctx: string) => string;
  /** When true and no argument given, the command needs one (falls back to previous answer when `useContext`). */
  needsArg?: boolean;
  useContext?: boolean;
}

const withCtx = (arg: string, ctx: string) => arg || (ctx ? `the following from earlier:\n\n${ctx}` : "");

export const CONSOLE_COMMANDS: ConsoleCommand[] = [
  // AI configuration
  { name: "/model", category: "AI", args: "[name]", description: "Pick or set the AI model", aliases: ["/m"] },
  { name: "/skills", category: "AI", description: "Toggle or create skills", aliases: ["/skill"] },
  { name: "/level", category: "AI", args: "[beginner|intermediate|advanced]", description: "Set explanation level" },
  { name: "/beginner", category: "AI", description: "Explain for a new coder", aliases: ["/easy", "/eli5mode"] },
  { name: "/intermediate", category: "AI", description: "Use university-level detail", aliases: ["/normal"] },
  { name: "/advanced", category: "AI", description: "Use architecture-level detail", aliases: ["/pro", "/expert"] },
  { name: "/explain", category: "AI", description: "Focus on explanations" },
  { name: "/debug", category: "AI", description: "Focus on bugs" },
  { name: "/teach", category: "AI", description: "Focus on tutoring" },
  { name: "/review", category: "AI", description: "Focus on code review" },
  { name: "/refactor", category: "AI", description: "Focus on refactoring" },
  { name: "/tests", category: "AI", description: "Focus on tests" },
  { name: "/security", category: "AI", description: "Focus on security" },
  { name: "/provider", category: "AI", description: "Show the connected AI provider", aliases: ["/whoami"] },

  // Learning prompts
  { name: "/eli5", category: "Learn", args: "<topic>", needsArg: true, useContext: true, description: "Explain like I'm five", prompt: (a, c) => `Explain ${withCtx(a, c)} like I'm five years old. Use one everyday analogy and a tiny code example.` },
  { name: "/quiz", category: "Learn", args: "<topic>", needsArg: true, useContext: true, description: "Quiz me with 5 questions", prompt: (a, c) => `Create a 5-question multiple-choice quiz about ${withCtx(a, c)}. Put the answers with short explanations at the end under a "Answers" heading.` },
  { name: "/challenge", category: "Learn", args: "<topic>", needsArg: true, description: "Give me a coding exercise", aliases: ["/exercise", "/kata"], prompt: (a) => `Give me one hands-on coding challenge about ${a}. Include: goal, starter code, 3 test cases and a hint. Do NOT show the solution.` },
  { name: "/hint", category: "Learn", description: "A nudge without the answer", prompt: (_a, c) => `Give me a small hint (not the solution) for the last challenge or problem we discussed.${c ? `\n\nContext:\n${c}` : ""}` },
  { name: "/solution", category: "Learn", description: "Reveal the full solution", prompt: (_a, c) => `Show the full, commented solution for the last challenge we discussed and explain each step.${c ? `\n\nContext:\n${c}` : ""}` },
  { name: "/roadmap", category: "Learn", args: "<goal>", needsArg: true, description: "Step-by-step learning plan", aliases: ["/plan"], prompt: (a) => `Build a week-by-week learning roadmap for: ${a}. Include milestones, mini projects and free resources.` },
  { name: "/compare", category: "Learn", args: "<a> vs <b>", needsArg: true, description: "Compare two concepts or tools", aliases: ["/vs"], prompt: (a) => `Compare ${a}. Use a markdown table (purpose, syntax, pros, cons, when to use) and a short verdict.` },
  { name: "/define", category: "Learn", args: "<term>", needsArg: true, description: "Quick definition of a term", aliases: ["/whatis"], prompt: (a) => `Define "${a}" in programming in 2-3 sentences, then show one minimal example.` },
  { name: "/flashcards", category: "Learn", args: "<topic>", needsArg: true, useContext: true, description: "Make study flashcards", prompt: (a, c) => `Create 8 flashcards (Q / A) for ${withCtx(a, c)}.` },
  { name: "/interview", category: "Learn", args: "<topic>", needsArg: true, description: "Mock interview questions", prompt: (a) => `Act as a technical interviewer. Ask me 3 interview questions about ${a}, one at a time, starting with the first only.` },
  { name: "/summarize", category: "Learn", description: "Summarize this conversation", aliases: ["/tldr", "/recap"], prompt: () => `Summarize everything we covered in this conversation as concise bullet points, then list 3 things I should practise next.` },

  // Code actions (paste code after the command, or they act on the last answer)
  { name: "/fix", category: "Code", args: "<code>", needsArg: true, useContext: true, description: "Find and fix bugs", prompt: (a, c) => `Find the bugs in ${withCtx(a, c)}\n\nList each bug, why it happens, and give the corrected code.` },
  { name: "/optimize", category: "Code", args: "<code>", needsArg: true, useContext: true, description: "Make code faster/cleaner", aliases: ["/perf"], prompt: (a, c) => `Optimize ${withCtx(a, c)}\n\nExplain the time/space complexity before and after.` },
  { name: "/document", category: "Code", args: "<code>", needsArg: true, useContext: true, description: "Add comments and docs", aliases: ["/docs", "/comment"], prompt: (a, c) => `Add clear doc comments and inline comments to ${withCtx(a, c)}` },
  { name: "/testgen", category: "Code", args: "<code>", needsArg: true, useContext: true, description: "Write unit tests", prompt: (a, c) => `Write thorough unit tests (happy path + edge cases) for ${withCtx(a, c)}` },
  { name: "/translate", category: "Code", args: "<language> [code]", needsArg: true, description: "Convert code to another language", aliases: ["/convert", "/port"], prompt: (a, c) => { const [lang, ...rest] = a.split(/\s+/); return `Translate this code to ${lang}, keeping it idiomatic:\n\n${rest.join(" ") || c}`; } },
  { name: "/regex", category: "Code", args: "<description>", needsArg: true, description: "Build or explain a regex", prompt: (a) => `Write (or explain, if one is given) a regular expression for: ${a}. Break it down piece by piece and give matching / non-matching examples.` },
  { name: "/complexity", category: "Code", args: "<code>", needsArg: true, useContext: true, description: "Big-O analysis", aliases: ["/bigo"], prompt: (a, c) => `Analyze the Big-O time and space complexity of ${withCtx(a, c)}` },
  { name: "/diagram", category: "Code", args: "<code|topic>", needsArg: true, useContext: true, description: "Draw a flow diagram", aliases: ["/flow"], prompt: (a, c) => `Draw a mermaid flowchart (in a \`\`\`mermaid block) that explains ${withCtx(a, c)}, then describe it in words.` },
  { name: "/name", category: "Code", args: "<what it does>", needsArg: true, description: "Suggest good names", prompt: (a) => `Suggest 8 clear variable/function names for: ${a}. Explain the naming convention used.` },
  { name: "/sql", category: "Code", args: "<question>", needsArg: true, description: "Write a SQL query", prompt: (a) => `Write a SQL query for: ${a}. Explain each clause.` },
  { name: "/commit", category: "Code", args: "<changes>", needsArg: true, description: "Write a commit message", prompt: (a) => `Write a conventional commit message for these changes: ${a}` },

  // Git / repos
  { name: "/clone", category: "Git", args: "<github url | owner/repo>", needsArg: true, description: "Import a public GitHub repo", aliases: ["/git", "/import", "/repo"] },
  { name: "/projects", category: "Git", description: "List your saved projects", aliases: ["/ls"] },
  { name: "/open", category: "Git", args: "<project name>", needsArg: true, description: "Open a saved project", aliases: ["/cd"] },
  { name: "/repo-explain", category: "Git", args: "<github url>", needsArg: true, description: "Clone and get an AI tour", aliases: ["/tour"] },

  // Sessions
  { name: "/new", category: "Session", description: "Start a new session", aliases: ["/n"] },
  { name: "/sessions", category: "Session", description: "Open session memory", aliases: ["/history"] },
  { name: "/rename", category: "Session", args: "[title]", description: "Rename this session" },
  { name: "/duplicate", category: "Session", description: "Duplicate this session", aliases: ["/fork"] },
  { name: "/export", category: "Session", description: "Download this session", aliases: ["/save"] },
  { name: "/retry", category: "Session", description: "Ask the last question again", aliases: ["/again", "/regen"] },
  { name: "/undo", category: "Session", description: "Remove the last exchange" },
  { name: "/copy", category: "Session", description: "Copy the last answer" },
  { name: "/continue", category: "Session", description: "Keep going from the last answer", aliases: ["/more", "/go"], prompt: () => "Continue from where you left off." },
  { name: "/clear", category: "Session", description: "Clear this session", aliases: ["/reset", "/cls"] },
  { name: "/status", category: "Session", description: "Show model, skills and level", aliases: ["/info"] },

  // Navigation
  { name: "/home", category: "Navigate", description: "Back to the hub", aliases: ["/exit", "/quit", "/q"] },
  { name: "/upload", category: "Navigate", description: "Upload files to analyse", aliases: ["/analyse", "/analyze"] },
  { name: "/dashboard", category: "Navigate", description: "Your saved work", aliases: ["/library"] },
  { name: "/courses", category: "Navigate", description: "Browse courses" },
  { name: "/learn", category: "Navigate", description: "Open lessons" },
  { name: "/practice", category: "Navigate", description: "Open practice challenges" },
  { name: "/tutor", category: "Navigate", description: "Open the tutor" },
  { name: "/settings", category: "Navigate", description: "Open AI settings", aliases: ["/config", "/setup"] },

  // Utility
  { name: "/help", category: "Utility", args: "[command]", description: "Show commands or help for one", aliases: ["/?", "/commands"] },
  { name: "/shortcuts", category: "Utility", description: "Keyboard shortcuts", aliases: ["/keys"] },
  { name: "/examples", category: "Utility", description: "Example things to try", aliases: ["/ideas", "/tips"] },
  { name: "/about", category: "Utility", description: "About Explyn." },
];

export function findCommand(raw: string) {
  const key = raw.toLowerCase();
  return CONSOLE_COMMANDS.find((c) => c.name === key || c.aliases?.includes(key)) ?? null;
}

/** Ranked fuzzy match on name, aliases and description. */
export function matchCommands(query: string) {
  const q = query.toLowerCase().replace(/^\//, "");
  if (!q) return CONSOLE_COMMANDS;
  const scored = CONSOLE_COMMANDS.map((c) => {
    const names = [c.name, ...(c.aliases ?? [])].map((n) => n.slice(1));
    let score = 0;
    if (names.some((n) => n === q)) score = 100;
    else if (names.some((n) => n.startsWith(q))) score = 80;
    else if (names.some((n) => n.includes(q))) score = 50;
    else if (c.description.toLowerCase().includes(q)) score = 30;
    else if (isSubsequence(q, c.name.slice(1))) score = 15;
    return { c, score };
  }).filter((x) => x.score > 0);
  return scored.sort((a, b) => b.score - a.score).map((x) => x.c);
}

function isSubsequence(q: string, s: string) {
  let i = 0;
  for (const ch of s) if (ch === q[i]) i++;
  return i === q.length;
}

export function helpText(filter?: string) {
  if (filter) {
    const c = findCommand(filter.startsWith("/") ? filter : `/${filter}`);
    if (!c) return `No command named ${filter}.`;
    return `${c.name} ${c.args ?? ""}\n${c.description}${c.aliases?.length ? `\naliases: ${c.aliases.join(", ")}` : ""}${c.useContext ? "\nTip: run without text to use the last answer." : ""}`;
  }
  const groups = new Map<CommandCategory, ConsoleCommand[]>();
  CONSOLE_COMMANDS.forEach((c) => groups.set(c.category, [...(groups.get(c.category) ?? []), c]));
  return [...groups.entries()]
    .map(([cat, list]) => `## ${cat}\n${list.map((c) => `${`${c.name} ${c.args ?? ""}`.padEnd(30)} ${c.description}`).join("\n")}`)
    .join("\n\n") + "\n\nTip: /help <command> for details. Commands are fuzzy — try /cl, /fx or /quiz.";
}

export function suggestCommand(raw: string) {
  return matchCommands(raw)[0]?.name ?? null;
}
