import { useEffect, useState, useCallback, useRef } from "react";

const STORAGE_KEY = "explyn_intro_last_shown";

interface IntroSplashProps {
  onComplete: () => void;
}

const treeLines = [
  { text: "App", indent: 0 },
  { text: "├── Modules", indent: 1 },
  { text: "├── Services", indent: 1 },
  { text: "└── Core Engine", indent: 1 },
];

const IntroSplash = ({ onComplete }: IntroSplashProps) => {
  const [phase, setPhase] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [visibleTreeLines, setVisibleTreeLines] = useState(0);
  const [taglineVisible, setTaglineVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const dismissed = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    setExiting(true);
    setTimeout(onComplete, 700);
  }, [onComplete]);

  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, new Date().toDateString());

    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = (fn: () => void, ms: number) => { timers.push(setTimeout(fn, ms)); };

    t(() => setPhase(1), 200);          // typing
    t(() => setPhase(2), 1400);         // code tree
    t(() => setPhase(3), 3000);         // logo + tagline
    t(() => setTaglineVisible(true), 3600);
    t(() => dismiss(), 5200);           // exit
    t(() => setCanSkip(true), 1000);

    return () => timers.forEach(clearTimeout);
  }, [dismiss]);

  // Typing effect
  useEffect(() => {
    if (phase < 1) return;
    const fullText = "loading explyn...";
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTypedText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, [phase]);

  // Tree reveal
  useEffect(() => {
    if (phase < 2) return;
    const id = setInterval(() => {
      setVisibleTreeLines((v) => {
        if (v >= treeLines.length) { clearInterval(id); return v; }
        return v + 1;
      });
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden transition-all duration-700 ${
        exiting ? "opacity-0 scale-110" : "opacity-100 scale-100"
      }`}
    >
      {/* Glow orb */}
      <div
        className={`absolute w-96 h-96 rounded-full transition-all duration-1000 ${
          phase >= 3 ? "opacity-15 scale-100" : "opacity-0 scale-50"
        }`}
        style={{
          background: "radial-gradient(circle, hsl(var(--ring)) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Phase 1: Terminal typing */}
        <div
          className={`font-mono text-lg sm:text-2xl transition-all duration-500 ${
            phase >= 2 ? "opacity-0 -translate-y-6 absolute pointer-events-none" : "opacity-100"
          }`}
        >
          <span className="text-muted-foreground">{typedText}</span>
          <span
            className={`inline-block w-[2px] h-6 bg-foreground ml-[2px] align-middle transition-opacity duration-100 ${
              cursorVisible ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* Phase 2: Code tree */}
        <div
          className={`font-mono text-base sm:text-xl transition-all duration-500 ${
            phase >= 2 && phase < 3
              ? "opacity-100 translate-y-0"
              : phase >= 3
              ? "opacity-0 scale-95 absolute pointer-events-none"
              : "opacity-0 translate-y-4 absolute pointer-events-none"
          }`}
        >
          <div className="min-w-[240px] sm:min-w-[320px]">
            {treeLines.map((line, i) => (
              <div
                key={i}
                className={`transition-all duration-300 py-1 ${
                  i < visibleTreeLines ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
                style={{ paddingLeft: `${line.indent * 24}px` }}
              >
                <span className={i === 0 ? "text-foreground font-semibold" : "text-muted-foreground"}>
                  {line.text}
                </span>
                {i < visibleTreeLines && (
                  <span className="inline-block w-2 h-2 rounded-full bg-foreground/30 ml-3 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Phase 3: Logo reveal */}
        <div
          className={`transition-all duration-700 ease-out ${
            phase >= 3 ? "opacity-100 scale-100" : "opacity-0 scale-90 absolute pointer-events-none"
          }`}
        >
          <span className="text-5xl sm:text-7xl font-bold tracking-tight text-foreground">
            explyn
          </span>
        </div>

        {/* Tagline */}
        <div
          className={`transition-all duration-700 ease-out ${
            taglineVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-base sm:text-xl text-muted-foreground tracking-wide">
            Understand any codebase, deeply.
          </p>
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
  return true;
}

export default IntroSplash;
