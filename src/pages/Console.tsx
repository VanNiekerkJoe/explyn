import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { ChatStatus } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { getAIConfig, saveAIConfig, streamChat, AI_PRESETS, type ChatMessage } from "@/lib/ai";
import ActivityStatus from "@/components/ActivityStatus";
import ExplynMascot from "@/components/ExplynMascot";
import {
  BUILT_IN_SKILLS,
  createConsoleMessage,
  createConsoleSession,
  createCustomSkill,
  loadConsoleSessions,
  loadCustomSkills,
  messageText,
  saveConsoleSessions,
  saveCustomSkills,
  type ConsoleLevel,
  type ConsoleSession,
  type ConsoleSkill,
} from "@/lib/console-memory";

const COMMANDS = [
  ["/model", "Pick or set the AI model"], ["/skills", "Toggle or create skills"],
  ["/level", "Set explanation level"], ["/beginner", "Explain for a new coder"],
  ["/intermediate", "Use university-level detail"], ["/advanced", "Use architecture-level detail"],
  ["/explain", "Focus on explanations"], ["/debug", "Focus on bugs"],
  ["/teach", "Focus on tutoring"], ["/review", "Focus on code review"],
  ["/refactor", "Focus on refactoring"], ["/tests", "Focus on tests"],
  ["/security", "Focus on security"], ["/new", "Start a new session"],
  ["/sessions", "Open session memory"], ["/rename", "Rename this session"],
  ["/duplicate", "Duplicate this session"], ["/export", "Export this session"],
  ["/status", "Show model, skills and level"], ["/clear", "Clear this session"],
  ["/settings", "Open AI settings"], ["/exit", "Back to the hub"], ["/help", "Show all commands"],
] as const;

type Picker = null | "model" | "skills" | "level";

const Console = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [sessions, setSessions] = useState<ConsoleSession[]>(() => loadConsoleSessions(getAIConfig().model));
  const [customSkills, setCustomSkills] = useState<ConsoleSkill[]>(loadCustomSkills);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [picker, setPicker] = useState<Picker>(null);
  const [models, setModels] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [skillInstructions, setSkillInstructions] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const active = sessions.find((session) => session.id === sessionId) ?? null;
  const allSkills = useMemo(() => [...BUILT_IN_SKILLS, ...customSkills], [customSkills]);

  useEffect(() => {
    if (!sessionId) navigate(`/console/${sessions[0].id}`, { replace: true });
    else if (!active) {
      const created = createConsoleSession(getAIConfig().model);
      setSessions((previous) => {
        const next = [created, ...previous];
        saveConsoleSessions(next);
        return next;
      });
      navigate(`/console/${created.id}`, { replace: true });
    }
  }, [active, navigate, sessionId, sessions]);

  useEffect(() => { inputRef.current?.focus(); }, [sessionId, picker, status]);

  const commit = useCallback((change: (session: ConsoleSession) => ConsoleSession) => {
    if (!sessionId) return;
    setSessions((previous) => {
      const next = previous.map((session) => session.id === sessionId ? change(session) : session)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      saveConsoleSessions(next);
      return next;
    });
  }, [sessionId]);

  const updateActive = useCallback((patch: Partial<ConsoleSession>) => {
    commit((session) => ({ ...session, ...patch, updatedAt: new Date().toISOString() }));
  }, [commit]);

  const addMessage = useCallback((role: "user" | "assistant" | "system", text: string) => {
    commit((session) => ({
      ...session,
      messages: [...session.messages, createConsoleMessage(role, text)],
      updatedAt: new Date().toISOString(),
    }));
  }, [commit]);

  const newSession = useCallback((source?: ConsoleSession) => {
    const created = source
      ? { ...source, id: crypto.randomUUID(), title: `${source.title} copy`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: source.messages.map((message) => ({ ...message, id: crypto.randomUUID() })) }
      : createConsoleSession(getAIConfig().model);
    setSessions((previous) => {
      const next = [created, ...previous];
      saveConsoleSessions(next);
      return next;
    });
    setSidebarOpen(false);
    navigate(`/console/${created.id}`);
  }, [navigate]);

  const renameSession = (session: ConsoleSession) => {
    const title = window.prompt("Name this session", session.title)?.trim();
    if (!title) return;
    setSessions((previous) => {
      const next = previous.map((item) => item.id === session.id ? { ...item, title, updatedAt: new Date().toISOString() } : item);
      saveConsoleSessions(next);
      return next;
    });
  };

  const deleteSession = (session: ConsoleSession) => {
    if (!window.confirm(`Delete “${session.title}”? This cannot be undone.`)) return;
    let next = sessions.filter((item) => item.id !== session.id);
    if (!next.length) next = [createConsoleSession(getAIConfig().model)];
    saveConsoleSessions(next);
    setSessions(next);
    if (session.id === sessionId) navigate(`/console/${next[0].id}`, { replace: true });
  };

  const exportSession = (session: ConsoleSession) => {
    const body = session.messages.map((message) => `## ${message.role === "assistant" ? "Explyn." : message.role === "user" ? "You" : "System"}\n\n${messageText(message)}`).join("\n\n");
    const blob = new Blob([`# ${session.title}\n\n${body}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${session.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "explyn-session"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveSkill = () => {
    if (!skillName.trim() || !skillInstructions.trim()) return;
    const skill = createCustomSkill(skillName, skillInstructions);
    const next = [...customSkills, skill];
    setCustomSkills(next);
    saveCustomSkills(next);
    updateActive({ skillIds: [...(active?.skillIds ?? []), skill.id] });
    setSkillName(""); setSkillInstructions(""); setSkillDialogOpen(false);
  };

  const removeCustomSkill = (skill: ConsoleSkill) => {
    const next = customSkills.filter((item) => item.id !== skill.id);
    setCustomSkills(next); saveCustomSkills(next);
    setSessions((previous) => {
      const updated = previous.map((session) => ({ ...session, skillIds: session.skillIds.filter((id) => id !== skill.id) }));
      saveConsoleSessions(updated); return updated;
    });
  };

  const loadModels = async () => {
    const config = getAIConfig();
    const fallback = Array.from(new Set(AI_PRESETS.map((preset) => preset.model).filter(Boolean)));
    if (!config.baseUrl) return setModels(fallback);
    try {
      const response = await fetch(`${config.baseUrl.replace(/\/+$/, "")}/models`, { headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {} });
      const data = await response.json();
      const found = (data?.data || data?.models || []).map((item: { id?: string; name?: string }) => item.id || item.name).filter(Boolean);
      setModels(found.length ? found.slice(0, 200) : fallback);
    } catch { setModels(fallback); }
  };

  const openPicker = (next: Picker) => {
    setPicker(next); setInput("");
    if (next === "model") void loadModels();
  };

  const pickerItems = useMemo(() => {
    if (!active) return [];
    const query = input.toLowerCase();
    if (picker === "model") return models.filter((item) => item.toLowerCase().includes(query)).map((item) => ({ id: item, label: item, hint: "", active: item === active.model }));
    if (picker === "skills") return allSkills.filter((skill) => skill.name.toLowerCase().includes(query)).map((skill) => ({ id: skill.id, label: skill.name, hint: skill.instructions, active: active.skillIds.includes(skill.id) }));
    if (picker === "level") return (["beginner", "intermediate", "advanced"] as ConsoleLevel[]).map((item) => ({ id: item, label: item, hint: "", active: item === active.level }));
    return [];
  }, [active, allSkills, input, models, picker]);

  const slashMatches = useMemo(() => picker || !input.startsWith("/") || input.includes(" ") ? [] : COMMANDS.filter(([name]) => name.startsWith(input.toLowerCase())), [input, picker]);
  const listLength = picker ? pickerItems.length : slashMatches.length;
  useEffect(() => setCursor(0), [listLength, picker]);

  const choosePickerItem = (id: string) => {
    if (!active) return;
    if (picker === "model") {
      saveAIConfig({ ...getAIConfig(), model: id }); updateActive({ model: id }); setPicker(null); addMessage("system", `Model set to ${id}`);
    } else if (picker === "skills") {
      updateActive({ skillIds: active.skillIds.includes(id) ? active.skillIds.filter((item) => item !== id) : [...active.skillIds, id] });
    } else if (picker === "level") {
      updateActive({ level: id as ConsoleLevel }); setPicker(null); addMessage("system", `Level set to ${id}`);
    }
  };

  const runCommand = (raw: string) => {
    if (!active) return;
    const [command, ...rest] = raw.trim().split(/\s+/); const arg = rest.join(" "); const normalized = command.toLowerCase();
    if (["/beginner", "/intermediate", "/advanced"].includes(normalized)) {
      updateActive({ level: normalized.slice(1) as ConsoleLevel }); addMessage("system", `Level set to ${normalized.slice(1)}`);
    } else {
      const builtIn = BUILT_IN_SKILLS.find((skill) => normalized === `/${skill.id}`);
      if (builtIn) { updateActive({ skillIds: [builtIn.id] }); addMessage("system", `Skill set to ${builtIn.name}`); }
      else switch (normalized) {
        case "/model": if (arg) choosePickerItem(arg); else openPicker("model"); break;
        case "/skills": openPicker("skills"); break;
        case "/level": if (["beginner", "intermediate", "advanced"].includes(arg)) { updateActive({ level: arg as ConsoleLevel }); addMessage("system", `Level set to ${arg}`); } else openPicker("level"); break;
        case "/new": newSession(); break;
        case "/sessions": setSidebarOpen(true); break;
        case "/rename": renameSession(active); break;
        case "/duplicate": newSession(active); break;
        case "/export": exportSession(active); break;
        case "/status": addMessage("system", `model: ${active.model || "none"}\nlevel: ${active.level}\nskills: ${active.skillIds.length ? active.skillIds.map((id) => allSkills.find((skill) => skill.id === id)?.name ?? id).join(", ") : "none"}`); break;
        case "/clear": updateActive({ messages: [], title: "New session" }); break;
        case "/settings": navigate("/settings"); break;
        case "/exit": navigate("/"); break;
        case "/help": addMessage("system", COMMANDS.map(([name, description]) => `${name.padEnd(14)} ${description}`).join("\n")); break;
        default: addMessage("system", `Unknown command ${command}. Type /help`);
      }
    }
    setInput("");
  };

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || !active || status !== "ready") return;
    if (value.startsWith("/")) return runCommand(value);
    const history: ChatMessage[] = active.messages.filter((message) => message.role !== "system").map((message) => ({ role: message.role as "user" | "assistant", content: messageText(message) }));
    const selected = allSkills.filter((skill) => active.skillIds.includes(skill.id));
    const system = `You are Explyn., a coding assistant for students. Explain at a ${active.level} level.\nActive skills:\n${selected.map((skill) => `- ${skill.name}: ${skill.instructions}`).join("\n") || "- General help"}\nUse markdown and fenced code blocks.`;
    const userMessage = createConsoleMessage("user", value);
    const assistantMessage = createConsoleMessage("assistant", "");
    const shouldTitle = active.messages.filter((message) => message.role === "user").length === 0;
    commit((session) => ({ ...session, title: shouldTitle ? value.slice(0, 42) : session.title, messages: [...session.messages, userMessage], updatedAt: new Date().toISOString() }));
    setInput(""); setStatus("submitted");
    let accumulated = "";
    try {
      await streamChat([{ role: "system", content: system }, ...history, { role: "user", content: value }], (chunk) => {
        accumulated += chunk; setStatus("streaming");
        commit((session) => {
          const exists = session.messages.some((message) => message.id === assistantMessage.id);
          const updatedAssistant = { ...assistantMessage, parts: [{ type: "text" as const, text: accumulated }] };
          return { ...session, messages: exists ? session.messages.map((message) => message.id === assistantMessage.id ? updatedAssistant : message) : [...session.messages, updatedAssistant], updatedAt: new Date().toISOString() };
        });
      });
    } catch (error) {
      addMessage("system", `Error: ${error instanceof Error ? error.message : "request failed"}`); setStatus("error");
    } finally { setStatus("ready"); }
  };

  const onComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (listLength && (event.key === "ArrowDown" || event.key === "ArrowUp")) { event.preventDefault(); setCursor((value) => (value + (event.key === "ArrowDown" ? 1 : -1) + listLength) % listLength); }
    if (event.key === "Escape") { event.preventDefault(); setPicker(null); setInput(""); }
    if (event.key === "Tab" && slashMatches.length) { event.preventDefault(); setInput(`${slashMatches[cursor][0]} `); }
    if (event.key === "Enter" && !event.shiftKey && listLength) {
      event.preventDefault();
      if (picker) { const item = pickerItems[cursor]; if (item) choosePickerItem(item.id); }
      else runCommand(slashMatches[cursor][0]);
    }
  };

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter((session) => session.title.toLowerCase().includes(query) || session.messages.some((message) => messageText(message).toLowerCase().includes(query)));
  }, [search, sessions]);

  if (!active) return null;

  const sessionRail = (
    <aside className="flex h-full w-[286px] flex-col border-r border-border bg-background">
      <div className="flex h-14 items-center gap-2 border-b border-border px-3">
        <Button variant="outline" className="flex-1 justify-start" onClick={() => newSession()}><Plus /> New session</Button>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sessions"><X /></Button>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 border border-border bg-card px-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search memory" className="h-9 border-0 bg-transparent px-0 font-mono text-xs focus-visible:ring-0" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        <p className="px-2 pb-2 font-mono text-[10px] uppercase text-muted-foreground">Memory / {filteredSessions.length}</p>
        {filteredSessions.map((session) => (
          <div key={session.id} className={`group mb-1 flex items-center border ${session.id === active.id ? "border-foreground/30 bg-accent" : "border-transparent"}`}>
            <Button variant="ghost" className="h-auto min-w-0 flex-1 justify-start rounded-none px-2 py-2 text-left" onClick={() => { navigate(`/console/${session.id}`); setSidebarOpen(false); }}>
              <span className="min-w-0">
                <span className="block truncate font-mono text-xs">{session.title}</span>
                <span className="mt-1 block text-[10px] text-muted-foreground">{session.messages.filter((message) => message.role !== "system").length} messages</span>
              </span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`Actions for ${session.title}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => renameSession(session)}><Pencil className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
                <DropdownMenuItem onClick={() => newSession(session)}><Copy className="mr-2 h-4 w-4" />Duplicate</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportSession(session)}><Download className="mr-2 h-4 w-4" />Export Markdown</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteSession(session)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
        {!filteredSessions.length && <p className="px-2 py-8 text-center text-xs text-muted-foreground">No matching sessions.</p>}
      </div>
      <div className="border-t border-border p-3">
        <Button variant="ghost" className="w-full justify-start" onClick={() => setSkillDialogOpen(true)}>Skills <span className="ml-auto text-xs text-muted-foreground">{allSkills.length}</span></Button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background font-mono text-foreground">
      <div className="hidden md:block">{sessionRail}</div>
      {sidebarOpen && <div className="fixed inset-0 z-40 md:hidden"><button className="absolute inset-0 bg-background/80" aria-label="Close sessions" onClick={() => setSidebarOpen(false)} /><div className="relative h-full animate-slide-in-right">{sessionRail}</div></div>}

      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-1">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open sessions"><Menu /></Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} aria-label="Back to hub"><ArrowLeft /></Button>
            <div className="ml-1 min-w-0"><p className="truncate text-xs font-bold">{active.title}</p><p className="text-[9px] uppercase text-muted-foreground">saved in this browser</p></div>
          </div>
          <Button variant="ghost" className="h-8 text-xs" onClick={() => setSkillDialogOpen(true)}>Skills <span className="text-muted-foreground">{active.skillIds.length}</span></Button>
        </nav>

        <Conversation className="min-h-0">
          <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6">
            {active.messages.length === 0 && (
              <ConversationEmptyState className="min-h-[55vh] py-10" icon={<ExplynMascot className="h-36 w-36" />} title="Fresh session" description="Ask about code, paste an error, or use / for commands.">
                <ExplynMascot className="mx-auto h-36 w-36" />
                <div className="space-y-2 text-center"><h1 className="text-base font-bold">Fresh session</h1><p className="text-xs text-muted-foreground">Ask about code, paste an error, or use / for commands.</p></div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {["Explain a closure", "Help me debug", "Teach me recursion"].map((prompt) => <Button key={prompt} variant="outline" size="sm" onClick={() => void send(prompt)}>{prompt}</Button>)}
                </div>
              </ConversationEmptyState>
            )}
            {active.messages.map((message) => message.role === "system" ? (
              <pre key={message.id} className="whitespace-pre-wrap border-l border-border pl-3 text-xs text-muted-foreground">› {messageText(message)}</pre>
            ) : (
              <Message key={message.id} from={message.role}>
                <MessageContent className={message.role === "assistant" ? "font-sans" : "font-mono"}>
                  {message.parts.map((part, index) => <MessageResponse key={`${message.id}-${index}`} isAnimating={status === "streaming" && message.id === active.messages.at(-1)?.id}>{part.text}</MessageResponse>)}
                </MessageContent>
              </Message>
            ))}
            {status === "submitted" && <ActivityStatus showMascot compact />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="shrink-0 border-t border-border bg-background/95 px-3 pb-3 pt-2 backdrop-blur-xl sm:px-4">
          <div className="relative mx-auto max-w-3xl">
            {(listLength > 0 || picker) && (
              <div className="absolute inset-x-0 bottom-[calc(100%+8px)] z-20 max-h-64 overflow-y-auto border border-border bg-popover p-1 text-xs shadow-2xl">
                {picker && <div className="flex justify-between border-b border-border px-2 py-2 text-muted-foreground"><span>{picker === "model" ? "Select model" : picker === "skills" ? "Toggle skills" : "Select level"}</span><span>esc</span></div>}
                {(picker ? pickerItems : slashMatches.map(([id, hint]) => ({ id, label: id, hint, active: false }))).map((item, index) => (
                  <Button key={item.id} variant="ghost" className={`h-auto w-full justify-start rounded-none px-2 py-2 text-left ${index === cursor ? "bg-accent" : ""}`} onMouseDown={(event) => { event.preventDefault(); picker ? choosePickerItem(item.id) : runCommand(item.id); }}>
                    {picker && <span className="w-4">{item.active ? <Check className="h-3 w-3" /> : "○"}</span>}<span className="w-24 shrink-0 truncate text-foreground">{item.label}</span><span className="hidden truncate text-muted-foreground sm:block">{item.hint}</span>
                  </Button>
                ))}
                {picker === "skills" && <Button variant="ghost" className="h-9 w-full justify-start border-t border-border" onClick={() => setSkillDialogOpen(true)}><Plus /> Create custom skill</Button>}
              </div>
            )}
            <PromptInput onSubmit={({ text }) => send(text)} className="[&_[data-slot=input-group]]:rounded-sm [&_[data-slot=input-group]]:bg-card">
              <PromptInputTextarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={onComposerKeyDown} placeholder={picker ? "Filter…" : "Ask anything, or type / for commands"} className="min-h-14 font-mono text-sm" />
              <PromptInputFooter>
                <PromptInputTools className="min-w-0 overflow-x-auto whitespace-nowrap text-[10px] text-muted-foreground">
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => openPicker("model")}>{active.model || "no model"}</Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => openPicker("skills")}>{active.skillIds.length} skills</Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => openPicker("level")}>{active.level}</Button>
                </PromptInputTools>
                <PromptInputSubmit status={status} disabled={!input.trim() || status !== "ready"} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </div>

      <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-mono">Skills</DialogTitle><DialogDescription>Skills are reusable instructions. Toggle them for this session or make your own.</DialogDescription></DialogHeader>
          <div className="grid gap-2 sm:grid-cols-2">
            {allSkills.map((skill) => {
              const enabled = active.skillIds.includes(skill.id);
              return <div key={skill.id} className={`flex gap-3 border p-3 ${enabled ? "border-foreground/40 bg-accent" : "border-border"}`}>
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => choosePickerItemForSkill(skill.id)}>
                  <span className="flex items-center gap-2 text-sm font-bold">{enabled ? <Check className="h-4 w-4" /> : <span className="h-4 w-4 border border-muted-foreground" />}{skill.name}</span>
                  <span className="mt-2 block font-sans text-xs leading-relaxed text-muted-foreground">{skill.instructions}</span>
                </button>
                {!skill.builtIn && <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeCustomSkill(skill)} aria-label={`Delete ${skill.name}`}><Trash2 /></Button>}
              </div>;
            })}
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-bold uppercase text-muted-foreground">Create a skill</p>
            <Input value={skillName} onChange={(event) => setSkillName(event.target.value)} placeholder="Skill name" />
            <textarea value={skillInstructions} onChange={(event) => setSkillInstructions(event.target.value)} placeholder="Tell Explyn. how to respond when this skill is active…" className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-sans text-sm outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <DialogFooter><Button onClick={saveSkill} disabled={!skillName.trim() || !skillInstructions.trim()}><Plus /> Create and activate</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function choosePickerItemForSkill(id: string) {
    updateActive({ skillIds: active.skillIds.includes(id) ? active.skillIds.filter((item) => item !== id) : [...active.skillIds, id] });
  }
};

export default Console;