import { useEffect, useState, useCallback, useRef } from "react";

const STORAGE_KEY = "explyn_intro_last_shown";

interface IntroSplashProps {
  onComplete: () => void;
}

// Node graph data
const nodes = [
  { id: "app", label: "App.tsx", x: 200, y: 150, layer: 0 },
  { id: "auth", label: "auth/", x: 120, y: 70, layer: 1 },
  { id: "api", label: "api/", x: 300, y: 90, layer: 1 },
  { id: "utils", label: "utils/", x: 110, y: 230, layer: 1 },
  { id: "db", label: "Database", x: 370, y: 170, layer: 2 },
  { id: "router", label: "Router", x: 220, y: 260, layer: 2 },
  { id: "service", label: "UserService", x: 330, y: 260, layer: 2 },
  { id: "config", label: "config/", x: 60, y: 150, layer: 1 },
  { id: "hooks", label: "hooks/", x: 280, y: 30, layer: 2 },
  { id: "types", label: "types.ts", x: 50, y: 50, layer: 2 },
];

const edges = [
  { from: "app", to: "auth" },
  { from: "app", to: "api" },
  { from: "app", to: "utils" },
  { from: "app", to: "config" },
  { from: "api", to: "db" },
  { from: "api", to: "hooks" },
  { from: "utils", to: "router" },
  { from: "router", to: "service" },
  { from: "auth", to: "types" },
];

const glowLabels: Record<string, string> = {
  app: "structure",
  api: "logic",
  router: "flow",
  db: "dependencies",
};

// Shifted positions for the "knowledge map" reorganization
const shiftedPositions: Record<string, { x: number; y: number }> = {
  app: { x: 200, y: 140 },
  auth: { x: 100, y: 60 },
  api: { x: 310, y: 80 },
  utils: { x: 90, y: 220 },
  db: { x: 360, y: 180 },
  router: { x: 200, y: 270 },
  service: { x: 340, y: 270 },
  config: { x: 50, y: 140 },
  hooks: { x: 300, y: 20 },
  types: { x: 40, y: 40 },
};

const IntroSplash = ({ onComplete }: IntroSplashProps) => {
  const [phase, setPhase] = useState(0);
  const [visibleNodes, setVisibleNodes] = useState(0);
  const [linesDrawn, setLinesDrawn] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [shifted, setShifted] = useState(false);
  const [showWordmark, setShowWordmark] = useState(false);
  const [showTagline, setShowTagline] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const dismissed = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    setExiting(true);
    setTimeout(onComplete, 700);
  }, [onComplete]);

  // Master timeline
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, new Date().toDateString());
    recordIntroShow();
    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };

    // Phase 0: pulse (already showing)
    t(() => setPhase(1), 800);           // start assembling
    t(() => setCanSkip(true), 1000);

    // Phase 1: reveal nodes staggered
    nodes.forEach((_, i) => {
      t(() => setVisibleNodes(i + 1), 900 + i * 120);
    });
    t(() => setLinesDrawn(true), 900 + nodes.length * 120 + 100);

    // Phase 2: intelligence
    t(() => {
      setPhase(2);
      setShowGlow(true);
    }, 2200);
    t(() => setShowLabels(true), 2500);
    t(() => setShifted(true), 2800);

    // Phase 3: morph into wordmark
    t(() => {
      setPhase(3);
      setShowWordmark(true);
    }, 3500);
    t(() => setShowTagline(true), 3900);
    t(() => dismiss(), 4500);

    return () => timers.forEach(clearTimeout);
  }, [dismiss]);

  const getNodePos = (id: string) => {
    const node = nodes.find((n) => n.id === id)!;
    if (shifted && shiftedPositions[id]) {
      return shiftedPositions[id];
    }
    return { x: node.x, y: node.y };
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden transition-all duration-700 ${
        exiting ? "opacity-0 scale-110" : "opacity-100 scale-100"
      }`}
    >
      {/* Phase 0: Breathing pulse */}
      <div
        className={`absolute transition-all duration-1000 ${
          phase === 0
            ? "opacity-100 scale-100"
            : "opacity-0 scale-150"
        }`}
      >
        <div className="intro-pulse-dot" />
      </div>

      {/* SVG Graph - Phases 1 & 2 */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
          phase >= 1 && phase < 3
            ? "opacity-100 scale-100"
            : phase >= 3
            ? "opacity-0 scale-50"
            : "opacity-0 scale-90"
        }`}
      >
        <svg
          viewBox="0 0 400 300"
          className="w-[95vw] max-w-[700px] h-auto"
          fill="none"
        >
          {/* Edges */}
          {edges.map((edge, i) => {
            const from = getNodePos(edge.from);
            const to = getNodePos(edge.to);
            return (
              <line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="0.8"
                strokeOpacity={linesDrawn ? 0.4 : 0}
                className={`transition-all duration-700 ${
                  shifted ? "intro-edge-shifted" : ""
                }`}
                style={{
                  strokeDasharray: 200,
                  strokeDashoffset: linesDrawn ? 0 : 200,
                  transition:
                    "stroke-dashoffset 0.8s ease-out, stroke-opacity 0.5s ease, x1 0.6s ease, y1 0.6s ease, x2 0.6s ease, y2 0.6s ease",
                }}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const pos = getNodePos(node.id);
            const hasGlow = showGlow && glowLabels[node.id];
            return (
              <g
                key={node.id}
                className={`transition-all duration-500 ${
                  i < visibleNodes ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px) scale(${
                    i < visibleNodes ? 1 : 0.5
                  })`,
                  transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease",
                }}
              >
                {/* Glow ring */}
                {hasGlow && (
                  <circle
                    cx={0}
                    cy={0}
                    r={18}
                    fill="none"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="0.5"
                    strokeOpacity={0.3}
                    className="intro-glow-ring"
                  />
                )}
                {/* Node dot */}
                <circle
                  cx={0}
                  cy={0}
                  r={node.id === "app" ? 7 : 5}
                  fill={
                    hasGlow
                      ? "hsl(var(--foreground))"
                      : "hsl(var(--muted-foreground))"
                  }
                  fillOpacity={hasGlow ? 0.9 : 0.6}
                  className="transition-all duration-500"
                />
                {/* Node label */}
                <text
                  x={0}
                  y={node.id === "app" ? -15 : -11}
                  textAnchor="middle"
                  fill="hsl(var(--foreground))"
                  fillOpacity={0.7}
                  fontSize={node.id === "app" ? 11 : 9}
                  fontFamily="monospace"
                  className="transition-all duration-300"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Intelligence labels */}
        {showLabels && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-[95vw] max-w-[700px]" style={{ aspectRatio: "400/300" }}>
              {Object.entries(glowLabels).map(([nodeId, label], i) => {
                const pos = getNodePos(nodeId);
                const xPct = (pos.x / 400) * 100;
                const yPct = ((pos.y + 18) / 300) * 100;
                return (
                  <span
                    key={nodeId}
                    className="absolute text-xs sm:text-sm tracking-widest uppercase text-muted-foreground intro-label-appear"
                    style={{
                      left: `${xPct}%`,
                      top: `${yPct}%`,
                      transform: "translateX(-50%)",
                      animationDelay: `${i * 150}ms`,
                    }}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Phase 3: Wordmark + tagline */}
      <div
        className={`relative z-10 flex flex-col items-center gap-4 transition-all duration-700 ease-out ${
          showWordmark ? "opacity-100 scale-100" : "opacity-0 scale-90"
        }`}
      >
        {/* Glow orb behind wordmark */}
        <div
          className="absolute w-96 h-96 rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--ring)) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <span className="text-5xl sm:text-7xl font-bold tracking-tight text-foreground">
          explyn
        </span>
        <p
          className={`text-base sm:text-xl text-muted-foreground tracking-wide transition-all duration-700 ease-out ${
            showTagline
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          Understand any codebase, deeply.
        </p>
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

const INTRO_SHOWS_KEY = "explyn_intro_shows";

export function shouldShowIntro(): boolean {
  try {
    const today = new Date().toDateString();
    const raw = localStorage.getItem(INTRO_SHOWS_KEY);
    if (!raw) return true;
    const data = JSON.parse(raw);
    if (data.date !== today) return true;
    return (data.count || 0) < 4;
  } catch {
    return true;
  }
}

export function recordIntroShow(): void {
  try {
    const today = new Date().toDateString();
    const raw = localStorage.getItem(INTRO_SHOWS_KEY);
    let count = 1;
    if (raw) {
      const data = JSON.parse(raw);
      if (data.date === today) count = (data.count || 0) + 1;
    }
    localStorage.setItem(INTRO_SHOWS_KEY, JSON.stringify({ date: today, count }));
  } catch {}
}

export default IntroSplash;
