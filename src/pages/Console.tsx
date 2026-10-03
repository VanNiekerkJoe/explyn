import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ArrowLeft } from "lucide-react";
import { getAIConfig, saveAIConfig, streamChat, AI_PRESETS, type ChatMessage } from "@/lib/ai";
import ActivityStatus from "@/components/ActivityStatus";
import ExplynMascot from "@/components/ExplynMascot";

type Level = "beginner" | "intermediate" | "advanced";
type Line =
  | { kind: "user"; text: string }
  | { kind: "assistant"; text: string }
  | { kind: "system"; text: string };

const SKILLS: { id: string; label: string; prompt: string }[] = [
  { id: "explain", label: "Explain", prompt: "Explain code clearly, step by step, with a short summary first." },
  { id: "debug", label: "Debug", prompt: "Hunt for bugs and edge cases; show the fix as a code block." },
  { id: "teach", label: "Teach", prompt: "Act as a patient tutor: ask a quick check-question at the end." },
  { id: "review", label: "Review", prompt: "Review code like a senior engineer: readability, naming, structure." },
  { id: "refactor", label: "Refactor", prompt: "Suggest a cleaner refactor and explain why it is better." },
  { id: "tests", label: "Tests", prompt: "Write unit tests covering the main paths and edge cases." },
  { id: "security", label: "Security", prompt: "Point out security risks (injection, secrets, auth) and fixes." },
];

const COMMANDS = [
  { name: "/model", desc: "Pick or set the AI model" },
  { name: "/skills", desc: "Toggle what the assistant focuses on" },
  { name: "/level", desc: "Set explanation level" },
  { name: "/beginner", desc: "Explain like I'm new to coding" },
  { name: "/intermediate", desc: "University-level explanations" },
  { name: "/advanced", desc: "Architecture-level explanations" },
  { name: "/explain", desc: "Focus on explaining code" },
  { name: "/debug", desc: "Focus on finding bugs" },
  { name: "/teach", desc: "Focus on tutoring" },
  { name: "/review", desc: "Focus on code review" },
  { name: "/refactor", desc: "Focus on refactoring" },
  { name: "/tests", desc: "Focus on writing tests" },
  { name: "/security", desc: "Focus on security risks" },
  { name: "/status", desc: "Show current model, skills and level" },
  { name: "/clear", desc: "Clear the conversation" },
  { name: "/settings", desc: "Open AI provider settings" },
  { name: "/exit", desc: "Back to the hub" },
  { name: "/help", desc: "Show all commands" },
];

const SKILLS_KEY = "explyn:skills";
const LEVEL_KEY = "explyn:console-level";

type Picker = null | "model" | "skills" | "level";

const Console = () => {
  const navigate = useNavigate();
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(getAIConfig().model);
  const [skills, setSkills] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(SKILLS_KEY) || '["explain"]'); } catch { return ["explain"]; }
  });
  const [level, setLevel] = useState<Level>(() => (localStorage.getItem(LEVEL_KEY) as Level) || "beginner");
  const [picker, setPicker] = useState<Picker>(null);
  const [cursor, setCursor] = useState(0);
  const [models, setModels] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem(SKILLS_KEY, JSON.stringify(skills)); }, [skills]);
  useEffect(() => { localStorage.setItem(LEVEL_KEY, level); }, [level]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines, loading]);
  useEffect(() => { inputRef.current?.focus(); }, [picker]);

  const sys = (text: string) => setLines((p) => [...p, { kind: "system", text }]);

  const loadModels = async () => {
    const cfg = getAIConfig();
    const presetModels = Array.from(new Set(AI_PRESETS.map((p) => p.model).filter(Boolean)));
    if (!cfg.baseUrl) { setModels(presetModels); return; }
    try {
      const res = await fetch(`${cfg.baseUrl.replace(/\/+$/, "")}/models`, {
        headers: cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {},
      });
      const data = await res.json();
      const ids: string[] = (data?.data || data?.models || []).map((m: any) => m.id || m.name).filter(Boolean);
      setModels(ids.length ? ids.slice(0, 200) : presetModels);
    } catch {
      setModels(presetModels);
    }
  };

  const setActiveModel = (m: string) => {
    saveAIConfig({ ...getAIConfig(), model: m });
    setModel(m);
    setPicker(null);
    sys(`Model set to ${m}`);
  };

  // Slash suggestions while typing
  const slashMatches = useMemo(() => {
    if (picker || !input.startsWith("/") || input.includes(" ")) return [];
    return COMMANDS.filter((c) => c.name.startsWith(input.toLowerCase()));
  }, [input, picker]);

  const pickerItems: { id: string; label: string; hint?: string; active?: boolean }[] = useMemo(() => {
    const q = input.toLowerCase();
    if (picker === "model")
      return models.filter((m) => m.toLowerCase().includes(q)).map((m) => ({ id: m, label: m, active: m === model }));
    if (picker === "skills")
      return SKILLS.filter((s) => s.label.toLowerCase().includes(q)).map((s) => ({ id: s.id, label: s.label, hint: s.prompt, active: skills.includes(s.id) }));
    if (picker === "level")
      return (["beginner", "intermediate", "advanced"] as Level[]).map((l) => ({ id: l, label: l, active: l === level }));
    return [];
  }, [picker, models, input, model, skills, level]);

  const listLen = picker ? pickerItems.length : slashMatches.length;
  useEffect(() => { setCursor(0); }, [listLen, picker]);

  const openPicker = (p: Picker) => {
    setPicker(p);
    setInput("");
    if (p === "model") loadModels();
  };

  const choosePickerItem = (id: string) => {
    if (picker === "model") setActiveModel(id);
    else if (picker === "skills") setSkills((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    else if (picker === "level") { setLevel(id as Level); setPicker(null); sys(`Level set to ${id}`); }
  };

  const setOnlySkill = (id: string) => {
    setSkills([id]);
    sys(`Skill set to ${SKILLS.find((s) => s.id === id)?.label ?? id} (others off)`);
  };

  const runCommand = (raw: string) => {
    const [cmd, ...rest] = raw.trim().split(/\s+/);
    const arg = rest.join(" ");
    const c = cmd.toLowerCase();
    if (c === "/beginner" || c === "/intermediate" || c === "/advanced") {
      setLevel(c.slice(1) as Level);
      sys(`Level set to ${c.slice(1)}`);
      setInput("");
      return;
    }
    const skillCmd = SKILLS.find((s) => c === `/${s.id}`);
    if (skillCmd) {
      setOnlySkill(skillCmd.id);
      setInput("");
      return;
    }
    switch (c) {
      case "/model": arg ? setActiveModel(arg) : openPicker("model"); break;
      case "/skills": openPicker("skills"); break;
      case "/level":
        if (["beginner", "intermediate", "advanced"].includes(arg)) { setLevel(arg as Level); sys(`Level set to ${arg}`); }
        else openPicker("level");
        break;
      case "/status":
        sys(`model:   ${model || "none"}\nlevel:   ${level}\nskills:  ${skills.length ? skills.join(", ") : "none"}`);
        break;
      case "/clear": setLines([]); break;
      case "/settings": navigate("/settings"); break;
      case "/exit": navigate("/"); break;
      case "/help": sys(COMMANDS.map((cm) => `${cm.name.padEnd(14)} ${cm.desc}`).join("\n")); break;
      default: sys(`Unknown command ${cmd}. Type /help`);
    }
    setInput("");
  };

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || loading) return;
    if (value.startsWith("/")) return runCommand(value);
    const history: ChatMessage[] = lines
      .filter((l) => l.kind !== "system")
      .map((l) => ({ role: l.kind as "user" | "assistant", content: l.text }));
    const activeSkills = SKILLS.filter((s) => skills.includes(s.id));
    const system = `You are Explyn., a coding assistant for students. Explain at a ${level} level.\nActive skills:\n${activeSkills.map((s) => `- ${s.label}: ${s.prompt}`).join("\n") || "- General help"}\nUse markdown and fenced code blocks.`;
    setLines((p) => [...p, { kind: "user", text: value }]);
    setInput("");
    setLoading(true);
    let acc = "";
    try {
      await streamChat([{ role: "system", content: system }, ...history, { role: "user", content: value }], (chunk) => {
        acc += chunk;
        setLines((prev) => {
          const last = prev[prev.length - 1];
          if (last?.kind === "assistant") return [...prev.slice(0, -1), { kind: "assistant", text: acc }];
          return [...prev, { kind: "assistant", text: acc }];
        });
      });
    } catch (e) {
      sys(`Error: ${e instanceof Error ? e.message : "request failed"}`);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (listLen > 0 && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setCursor((c) => (c + (e.key === "ArrowDown" ? 1 : -1) + listLen) % listLen);
      return;
    }
    if (e.key === "Escape") { setPicker(null); setInput(""); return; }
    if (e.key === "Tab" && slashMatches.length) {
      e.preventDefault();
      setInput(slashMatches[cursor].name + " ");
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (picker) {
        const item = pickerItems[cursor];
        if (item) choosePickerItem(item.id);
        else if (picker === "model" && input.trim()) setActiveModel(input.trim());
        return;
      }
      if (slashMatches.length && input !== slashMatches[cursor].name) return runCommand(slashMatches[cursor].name);
      send(input);
    }
  };

  const md = {
    code({ className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      return match ? (
        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ borderRadius: "0.5rem", fontSize: "0.78rem", background: "hsl(0 0% 6%)" }}>
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-muted px-1 py-0.5 rounded text-xs" {...props}>{children}</code>
      );
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <nav className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4" /> Hub
          </button>
          <span className="text-sm font-bold tracking-tight">explyn<span className="text-muted-foreground">.</span>console</span>
          <span className="text-[11px] text-muted-foreground hidden sm:block">/help</span>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-5 text-sm">
        {lines.length === 0 && (
          <div className="grid py-10 gap-8 sm:grid-cols-[1fr_180px] sm:items-start">
            <div className="space-y-4">
              <pre className="text-foreground text-xs sm:text-sm leading-tight">{`  ___ __  __ ___ _  __   __ _  _
 | __|\\ \\/ /| _ \\ | \\ \\ / /| \\| |
 | _|  >  < |  _/ |__\\ V / | .\` |
 |___|/_/\\_\\|_| |____||_|  |_|\\_|.`}</pre>
              <div className="text-muted-foreground space-y-1 text-xs">
                {COMMANDS.map((c) => (
                  <div key={c.name}><span className="text-foreground">{c.name.padEnd(14)}</span> {c.desc}</div>
                ))}
              </div>
            </div>
            <ExplynMascot className="mx-auto hidden h-44 w-44 sm:block" />
          </div>
        )}
        {lines.map((l, i) =>
          l.kind === "user" ? (
            <div key={i} className="border-l-2 border-foreground pl-3 text-foreground whitespace-pre-wrap">{l.text}</div>
          ) : l.kind === "system" ? (
            <pre key={i} className="text-xs text-muted-foreground whitespace-pre-wrap">› {l.text}</pre>
          ) : (
            <div key={i} className="pl-3 border-l-2 border-border prose prose-invert prose-sm max-w-none font-sans prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>{l.text}</ReactMarkdown>
            </div>
          ),
        )}
        {loading && lines[lines.length - 1]?.kind === "user" && (
          <ActivityStatus showMascot compact className="pl-3" />
        )}
        <div ref={endRef} />
      </main>

      <div className="sticky bottom-0 bg-background/90 backdrop-blur-xl pb-3 pt-2">
        <div className="max-w-4xl mx-auto px-4">
          {(listLen > 0 || picker) && (
            <div className="mb-2 rounded-lg border border-border bg-card max-h-64 overflow-y-auto text-xs">
              {picker && (
                <div className="px-3 py-2 border-b border-border text-muted-foreground flex justify-between">
                  <span>{picker === "model" ? "Select model (or type a name + Enter)" : picker === "skills" ? "Toggle skills — Enter to toggle" : "Select level"}</span>
                  <span>esc</span>
                </div>
              )}
              {picker
                ? pickerItems.map((it, i) => (
                    <button key={it.id} onMouseDown={(e) => { e.preventDefault(); choosePickerItem(it.id); }}
                      className={`w-full text-left px-3 py-1.5 flex gap-3 ${i === cursor ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
                      <span className="w-3">{it.active ? "●" : "○"}</span>
                      <span className="text-foreground">{it.label}</span>
                      {it.hint && <span className="truncate hidden sm:inline">{it.hint}</span>}
                    </button>
                  ))
                : slashMatches.map((c, i) => (
                    <button key={c.name} onMouseDown={(e) => { e.preventDefault(); runCommand(c.name); }}
                      className={`w-full text-left px-3 py-1.5 flex gap-3 ${i === cursor ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
                      <span className="text-foreground w-20">{c.name}</span><span>{c.desc}</span>
                    </button>
                  ))}
              {picker === "model" && pickerItems.length === 0 && <div className="px-3 py-2 text-muted-foreground">Loading models…</div>}
            </div>
          )}

          <div className="rounded-lg border border-border bg-card focus-within:border-foreground/40 transition-colors">
            <div className="flex items-start gap-2 px-3 pt-3">
              <span className="text-foreground select-none">›</span>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={Math.min(6, Math.max(1, input.split("\n").length))}
                placeholder={picker ? "filter…" : "Ask anything, or type / for commands"}
                className="flex-1 bg-transparent resize-none text-sm focus:outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-[11px] text-muted-foreground overflow-x-auto whitespace-nowrap">
              <button onClick={() => openPicker("model")} className="hover:text-foreground"><span className="text-foreground">{model || "no model"}</span></button>
              <span>·</span>
              <button onClick={() => openPicker("skills")} className="hover:text-foreground">skills: {skills.length ? skills.join(", ") : "none"}</button>
              <span>·</span>
              <button onClick={() => openPicker("level")} className="hover:text-foreground">{level}</button>
              <span className="ml-auto hidden sm:inline">enter send · shift+enter newline · tab complete</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Console;
