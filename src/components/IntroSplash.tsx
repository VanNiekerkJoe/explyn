import { useEffect, useState, useCallback, useRef } from "react";

const STORAGE_KEY = "explyn_intro_last_shown";

interface IntroSplashProps {
  onComplete: () => void;
}

const codeSnippets = [
  "class App {",
  "  import modules",
  "  async analyze()",
  "  render() {}",
  "}",
];

const treeLines = [
  { text: "App", indent: 0, delay: 0 },
  { text: "├── Modules", indent: 1, delay: 120 },
  { text: "├── Services", indent: 1, delay: 240 },
  { text: "└── Core Engine", indent: 1, delay: 360 },
];

const phrases = ["Understanding code…", "Explaining systems…", "Welcome back."];

const IntroSplash = ({ onComplete }: IntroSplashProps) => {
  const [phase, setPhase] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [visibleTreeLines, setVisibleTreeLines] = useState(0);
  const [activePhrase, setActivePhrase] = useState(0);
  const [phraseOpacity, setPhraseOpacity] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const dismissed = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    setExiting(true);
    setTimeout(onComplete, 700);
  }, [onComplete]);

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Phase timeline
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, new Date().toDateString());

    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = (fn: () => void, ms: number) => { timers.push(setTimeout(fn, ms)); };

    // Phase 1: typing
    t(() => setPhase(1), 300);

    // Phase 2: tree
    t(() => setPhase(2), 1800);

    // Phase 3: intelligence
    t(() => setPhase(3), 3200);

    // Phase 4: exit
    t(() => dismiss(), 5400);

    // Allow skip after 1.5s
    t(() => setCanSkip(true), 1500);

    return () => timers.forEach(clearTimeout);
  }, [dismiss]);

  // Typing effect for phase 1
  useEffect(() => {
    if (phase < 1) return;
    const fullText = "loading Explyn...";
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTypedText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [phase]);

  // Tree reveal for phase 2
  useEffect(() => {
    if (phase < 2) return;
    const id = setInterval(() => {
      setVisibleTreeLines((v) => {
        if (v >= treeLines.length) { clearInterval(id); return v; }
        return v + 1;
      });
    }, 180);
    return () => clearInterval(id);
  }, [phase]);

  // Phrase cycle for phase 3
  useEffect(() => {
    if (phase < 3) return;
    setPhraseOpacity(1);
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => { setPhraseOpacity(0); }, 600));
    timers.push(setTimeout(() => { setActivePhrase(1); setPhraseOpacity(1); }, 900));
    timers.push(setTimeout(() => { setPhraseOpacity(0); }, 1500));
    timers.push(setTimeout(() => { setActivePhrase(2); setPhraseOpacity(1); }, 1800));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden transition-all duration-700 ${
        exiting ? "opacity-0 scale-105" : "opacity-100 scale-100"
      }`}
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--muted-foreground)) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orb */}
      <div
        className={`absolute w-64 h-64 rounded-full transition-all duration-1000 ${
          phase >= 3 ? "opacity-20 scale-100" : "opacity-0 scale-50"
        }`}
        style={{
          background: "radial-gradient(circle, hsl(var(--ring)) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Phase 1: Terminal typing */}
        <div
          className={`font-mono text-sm transition-all duration-500 ${
            phase >= 2 ? "opacity-0 -translate-y-4 absolute" : "opacity-100"
          }`}
        >
          <span className="text-muted-foreground">{typedText}</span>
          <span
            className={`inline-block w-[2px] h-4 bg-foreground ml-[1px] align-middle transition-opacity duration-100 ${
              cursorVisible ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* Phase 2: Code tree */}
        <div
          className={`font-mono text-xs sm:text-sm transition-all duration-500 ${
            phase >= 2 && phase < 3 ? "opacity-100 translate-y-0" : phase >= 3 ? "opacity-0 scale-95 absolute" : "opacity-0 translate-y-4 absolute"
          }`}
        >
          <div className="glass-panel rounded-lg p-4 sm:p-6 min-w-[220px]">
            {treeLines.map((line, i) => (
              <div
                key={i}
                className={`transition-all duration-300 ${
                  i < visibleTreeLines ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"
                }`}
                style={{ paddingLeft: `${line.indent * 16}px` }}
              >
                <span className={i === 0 ? "text-foreground font-semibold" : "text-muted-foreground"}>
                  {line.text}
                </span>
                {i < visibleTreeLines && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground/40 ml-2 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Phase 3: Intelligence phrases */}
        <div
          className={`transition-all duration-500 text-center ${
            phase >= 3 ? "opacity-100" : "opacity-0 absolute"
          }`}
        >
          {/* Neural dots */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="relative">
                <div
                  className="w-2 h-2 rounded-full bg-foreground/60 animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
                {i < 4 && (
                  <div className="absolute top-1/2 left-full w-3 h-[1px] bg-foreground/20 -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>

          <p
            className="text-sm sm:text-base text-muted-foreground transition-opacity duration-300"
            style={{ opacity: phraseOpacity }}
          >
            {phrases[activePhrase]}
          </p>
        </div>

        {/* Logo reveal at exit */}
        <div
          className={`absolute transition-all duration-700 ${
            exiting ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
        >
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">explyn</span>
        </div>
      </div>

      {/* Skip */}
      {canSkip && !exiting && (
        <button
          onClick={dismiss}
          className="absolute bottom-6 right-6 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors duration-200"
        >
          Skip →
        </button>
      )}
    </div>
  );
};

export function shouldShowIntro(): boolean {
  const last = localStorage.getItem(STORAGE_KEY);
  if (!last) return true;
  return last !== new Date().toDateString();
}

export default IntroSplash;
