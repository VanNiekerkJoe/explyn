import { ReactNode } from "react";

interface SpeechBubbleProps {
  children: ReactNode;
  arrow?: "none" | "top" | "bottom" | "left" | "right";
  animate?: boolean;
  className?: string;
}

const SpeechBubble = ({
  children,
  arrow = "none",
  animate = true,
  className = "",
}: SpeechBubbleProps) => {
  return (
    <div
      className={`relative max-w-[380px] w-[90vw] ${
        animate ? "animate-fade-in-up" : ""
      } ${className}`}
    >
      {arrow === "top" && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-card border-l border-t border-border" />
      )}
      {arrow === "bottom" && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-card border-r border-b border-border" />
      )}

      <div className="relative rounded-2xl border border-border bg-card p-5 shadow-xl shadow-background/50 max-h-[85vh] overflow-y-auto">
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
