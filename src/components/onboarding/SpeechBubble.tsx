import { ReactNode } from "react";

interface SpeechBubbleProps {
  children: ReactNode;
  position?: "center" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  arrow?: "none" | "top" | "bottom" | "left" | "right";
  animate?: boolean;
  className?: string;
}

const positionClasses: Record<string, string> = {
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  top: "top-24 left-1/2 -translate-x-1/2",
  bottom: "bottom-24 left-1/2 -translate-x-1/2",
  "top-left": "top-24 left-6",
  "top-right": "top-24 right-6",
  "bottom-left": "bottom-24 left-6",
  "bottom-right": "bottom-24 right-6",
};

const SpeechBubble = ({
  children,
  position = "center",
  arrow = "none",
  animate = true,
  className = "",
}: SpeechBubbleProps) => {
  return (
    <div
      className={`absolute z-[60] max-w-[340px] w-[90vw] ${positionClasses[position]} ${
        animate ? "animate-fade-in-up" : ""
      } ${className}`}
    >
      {/* Arrow */}
      {arrow === "top" && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-card border-l border-t border-border" />
      )}
      {arrow === "bottom" && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-card border-r border-b border-border" />
      )}

      {/* Bubble body */}
      <div className="relative rounded-2xl border border-border bg-card p-5 shadow-xl shadow-background/50">
        {/* Subtle gradient shine */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-[0.04]"
          style={{
            background: "linear-gradient(135deg, hsl(var(--foreground)) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
};

export default SpeechBubble;
