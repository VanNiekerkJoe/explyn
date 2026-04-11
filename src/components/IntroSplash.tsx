import { useEffect, useState, useCallback, useRef } from "react";

const STORAGE_KEY = "explyn_intro_last_shown";

interface IntroSplashProps {
  onComplete: () => void;
}

const IntroSplash = ({ onComplete }: IntroSplashProps) => {
  const [phase, setPhase] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
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

    t(() => setPhase(1), 200);          // start typing
    t(() => setPhase(2), 1200);         // logo reveal
    t(() => setTaglineVisible(true), 2500); // tagline
    t(() => dismiss(), 4200);           // exit
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

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden transition-all duration-700 ${
        exiting ? "opacity-0 scale-110" : "opacity-100 scale-100"
      }`}
    >
      {/* Glow orb */}
      <div
        className={`absolute w-96 h-96 rounded-full transition-all duration-1000 ${
          phase >= 2 ? "opacity-15 scale-100" : "opacity-0 scale-50"
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

        {/* Phase 2: Logo reveal */}
        <div
          className={`transition-all duration-700 ease-out ${
            phase >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-90 absolute pointer-events-none"
          }`}
        >
          <span className="text-5xl sm:text-7xl font-bold tracking-tight text-foreground">
            explyn
          </span>
        </div>

        {/* Phase 3: Tagline */}
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
