import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Cpu, Download, Loader2, Trash2, Upload as UploadIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AI_PRESETS,
  clearAIConfig,
  getAIConfig,
  saveAIConfig,
  testAIConnection,
  type AIConfig,
} from "@/lib/ai";
import { clearAllData, exportData, importData } from "@/lib/localdb";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState<AIConfig>({ baseUrl: "", apiKey: "", model: "" });
  const [presetId, setPresetId] = useState("openai");
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);

  useEffect(() => {
    const existing = getAIConfig();
    setConfig(existing);
    const match = AI_PRESETS.find((p) => p.baseUrl && p.baseUrl === existing.baseUrl);
    if (match) setPresetId(match.id);
    else if (existing.baseUrl) setPresetId("custom");
  }, []);

  const preset = AI_PRESETS.find((p) => p.id === presetId)!;

  const applyPreset = (id: string) => {
    setPresetId(id);
    setTested(false);
    const next = AI_PRESETS.find((p) => p.id === id)!;
    if (next.id !== "custom") {
      setConfig((prev) => ({ ...prev, baseUrl: next.baseUrl, model: next.model }));
    }
  };

  const update = (patch: Partial<AIConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    setTested(false);
  };

  const save = () => {
    if (!config.baseUrl.trim() || !config.model.trim()) {
      toast({ title: "Add an address and a model name", variant: "destructive" });
      return;
    }
    saveAIConfig(config);
    toast({ title: "AI connected", description: "Explyn will now use your own AI." });
  };

  const test = async () => {
    setTesting(true);
    setTested(false);
    try {
      const reply = await testAIConnection(config);
      setTested(true);
      saveAIConfig(config);
      toast({ title: "It works", description: `Your AI replied: "${reply.slice(0, 60)}"` });
    } catch (e) {
      toast({
        title: "Could not reach your AI",
        description: e instanceof Error ? e.message : "Check the address, key and model name.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const disconnect = () => {
    clearAIConfig();
    setConfig({ baseUrl: "", apiKey: "", model: "" });
    setTested(false);
    toast({ title: "AI disconnected" });
  };

  const doExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `explyn-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (file: File) => {
    try {
      importData(await file.text());
      toast({ title: "Data restored", description: "Reload to see everything." });
    } catch {
      toast({ title: "That file could not be read", variant: "destructive" });
    }
  };

  const wipe = () => {
    if (!confirm("Delete every account, snippet and project stored in this browser?")) return;
    clearAllData();
    localStorage.removeItem("explyn:session");
    toast({ title: "Everything cleared" });
    navigate("/");
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="noise" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Hub</span>
            </button>
            <span className="text-sm font-bold tracking-tight">Settings</span>
            <div className="w-12" />
          </div>
        </nav>

        <div className="pt-20 pb-20 px-4 sm:px-6 max-w-3xl mx-auto space-y-6">
          <div>
            <p className="eyebrow mb-2">Your AI</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Plug in your own AI</h1>
            <p className="text-sm text-muted-foreground">
              Explyn works with any OpenAI-compatible service, including models running on your own
              machine. Your key stays in this browser and is sent only to the service you pick.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5">
            <div>
              <p className="eyebrow mb-3">Provider</p>
              <div className="flex flex-wrap gap-1.5">
                {AI_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                      presetId === p.id
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2.5">{preset.hint}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">Address</label>
                <Input
                  value={config.baseUrl}
                  onChange={(e) => update({ baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="bg-card border-border rounded-lg font-mono text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">Model</label>
                <Input
                  value={config.model}
                  onChange={(e) => update({ model: e.target.value })}
                  placeholder="gpt-4o-mini"
                  className="bg-card border-border rounded-lg font-mono text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">
                  Key {preset.needsKey ? "" : "(not needed for local models)"}
                </label>
                <Input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => update({ apiKey: e.target.value })}
                  placeholder="sk-…"
                  className="bg-card border-border rounded-lg font-mono text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={test} disabled={testing || !config.baseUrl || !config.model} className="btn-primary text-sm disabled:opacity-40 gap-2">
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : tested ? <Check className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
                {testing ? "Testing…" : tested ? "Connected" : "Test & save"}
              </button>
              <button onClick={save} className="btn-ghost text-sm">Save without testing</button>
              {(config.baseUrl || config.apiKey) && (
                <button onClick={disconnect} className="btn-ghost text-sm text-muted-foreground">Disconnect</button>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 sm:p-6">
            <p className="eyebrow mb-2">Your work</p>
            <p className="text-sm text-muted-foreground mb-4">
              Accounts, snippets, projects and notes are saved in this browser only. Back them up or
              move them to another machine with a file.
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={doExport} className="btn-ghost text-sm gap-2">
                <Download className="h-4 w-4" /> Export backup
              </button>
              <label className="btn-ghost text-sm gap-2 cursor-pointer">
                <UploadIcon className="h-4 w-4" /> Restore backup
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); }}
                />
              </label>
              <button onClick={wipe} className="btn-ghost text-sm gap-2 text-muted-foreground">
                <Trash2 className="h-4 w-4" /> Clear everything
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
