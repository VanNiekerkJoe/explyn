import { useState, useCallback } from "react";

interface OptionButtonProps {
  label: string;
  description?: string;
  onClick: () => void;
  icon?: string;
  selected?: boolean;
}

export const OptionButton = ({ label, description, onClick, icon, selected }: OptionButtonProps) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 group ${
      selected
        ? "border-foreground/30 bg-foreground/10"
        : "border-border hover:border-foreground/20 hover:bg-foreground/5"
    }`}
  >
    <div className="flex items-center gap-3">
      {icon && <span className="text-lg">{icon}</span>}
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  </button>
);

interface TypingTextProps {
  text: string;
  onComplete?: () => void;
  speed?: number;
}

export const TypingText = ({ text, onComplete, speed = 25 }: TypingTextProps) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useState(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(id);
  });

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-[2px] h-4 bg-foreground/60 ml-0.5 animate-pulse align-middle" />}
    </span>
  );
};

export const BubbleAvatar = () => (
  <div className="flex items-center gap-2 mb-3">
    <div className="w-6 h-6 rounded-full bg-foreground/10 border border-border flex items-center justify-center">
      <span className="text-xs font-bold text-foreground/70">E</span>
    </div>
    <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Explyn</span>
  </div>
);

export const ContinueButton = ({ onClick, label = "Continue" }: { onClick: () => void; label?: string }) => (
  <button
    onClick={onClick}
    className="mt-4 w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-medium transition-all duration-200 hover:bg-foreground/90 active:scale-[0.98]"
  >
    {label} →
  </button>
);
