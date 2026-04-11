import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "explyn_intro_last_shown";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface IntroSplashProps {
  onComplete: () => void;
}

const IntroSplash = ({ onComplete }: IntroSplashProps) => {
  const [phase, setPhase] = useState(0);
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setTimeout(onComplete, 600);
  }, [exiting, onComplete]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());

    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 1100);
    const t3 = setTimeout(() => setPhase(3), 2200);
    const t4 = setTimeout(dismiss, 3400);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [dismiss]);

  const letters = "explyn".split("");

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-all duration-600 ${
        exiting ? "intro-exit" : ""
      }`}
    >
      {/* Line */}
      <div className="relative h-[1px] w-full max-w-md overflow-hidden">
        <div
          className={`absolute inset-y-0 left-1/2 h-full bg-foreground/60 transition-all duration-700 ease-out ${
            phase >= 1 ? "intro-line-active" : "w-0 -translate-x-1/2"
          }`}
        />
      </div>

      {/* Logo */}
      <div
        className={`mt-8 flex gap-[2px] overflow-hidden transition-opacity duration-500 ${
          phase >= 2 ? "opacity-100" : "opacity-0"
        }`}
      >
        {letters.map((l, i) => (
          <span
            key={i}
            className="intro-letter text-4xl sm:text-5xl font-bold tracking-tight text-foreground"
            style={{ animationDelay: phase >= 2 ? `${i * 70}ms` : "0ms" }}
          >
            {l}
          </span>
        ))}
      </div>

      {/* Tagline */}
      <p
        className={`mt-4 text-sm text-muted-foreground transition-all duration-700 ${
          phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        Understand any codebase, deeply.
      </p>

      {/* Skip */}
      <button
        onClick={dismiss}
        className="absolute bottom-8 right-8 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        Skip
      </button>
    </div>
  );
};

export function shouldShowIntro(): boolean {
  const last = localStorage.getItem(STORAGE_KEY);
  if (!last) return true;
  return Date.now() - parseInt(last, 10) > ONE_DAY_MS;
}

export default IntroSplash;
