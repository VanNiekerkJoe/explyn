import { useState, useRef, useCallback } from "react";
import { X, Loader2, ChevronRight, Lightbulb, Zap, HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExplainPopupData {
  whatThisIs: string;
  whatItDoesHere: string;
  whyItsUsed: string;
  example: string | null;
  proInsight: string | null;
}

interface InteractiveCodeViewerProps {
  code: string;
  language: string;
  fileName?: string;
  level: string;
  onAskFollowUp?: (question: string) => void;
}

const InteractiveCodeViewer = ({ code, language, fileName, level, onAskFollowUp }: InteractiveCodeViewerProps) => {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [explanation, setExplanation] = useState<ExplainPopupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const lines = code.split("\n");

  const handleTokenClick = useCallback(async (token: string, lineIndex: number, event: React.MouseEvent) => {
    const trimmed = token.trim();
    if (!trimmed || trimmed.length < 2) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setPopupPosition({
        top: rect.top - containerRect.top - 8,
        left: rect.left - containerRect.left + rect.width / 2,
      });
    }

    setSelectedLine(lineIndex);
    setSelectedToken(trimmed);
    setExplanation(null);
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/explain-element`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            selectedText: trimmed,
            lineContent: lines[lineIndex],
            lineNumber: lineIndex + 1,
            fullCode: code,
            fileName,
            language,
            level,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to explain");
      const data = await response.json();
      setExplanation(data);
    } catch {
      setExplanation({
        whatThisIs: "Could not generate explanation. Try again.",
        whatItDoesHere: "",
        whyItsUsed: "",
        example: null,
        proInsight: null,
      });
    } finally {
      setLoading(false);
    }
  }, [code, fileName, language, level, lines]);

  const closePopup = () => {
    setSelectedLine(null);
    setSelectedToken("");
    setExplanation(null);
    setPopupPosition(null);
  };

  const tokenize = (line: string): string[] => {
    // Split line into meaningful tokens while preserving whitespace
    return line.split(/(\s+|[{}()[\];,.<>:=+\-*/&|!?@#$%^~`"'\\])/g).filter(Boolean);
  };

  const isClickableToken = (token: string): boolean => {
    const trimmed = token.trim();
    if (trimmed.length < 2) return false;
    // Skip pure whitespace and single punctuation
    if (/^[\s{}()[\];,.<>:=+\-*/&|!?@#$%^~`"'\\]+$/.test(trimmed)) return false;
    return true;
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Explanation popup */}
      {(loading || explanation) && popupPosition && (
        <div
          className="absolute z-50 w-80 max-w-[90vw]"
          style={{
            top: `${popupPosition.top}px`,
            left: `${Math.min(popupPosition.left, 200)}px`,
            transform: "translateY(-100%)",
          }}
        >
          <div className="glass-panel rounded-xl border border-border/60 shadow-2xl overflow-hidden mb-2 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-foreground/[0.03]">
              <div className="flex items-center gap-2 min-w-0">
                <Lightbulb className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <code className="text-xs font-mono text-foreground truncate">{selectedToken}</code>
              </div>
              <button onClick={closePopup} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 px-4 py-6 justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Explaining…</span>
              </div>
            ) : explanation ? (
              <ScrollArea className="max-h-72">
                <div className="p-4 space-y-3">
                  {/* What This Is */}
                  {explanation.whatThisIs && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">What this is</span>
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed">{explanation.whatThisIs}</p>
                    </div>
                  )}

                  {/* What It Does Here */}
                  {explanation.whatItDoesHere && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Zap className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">In this code</span>
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed">{explanation.whatItDoesHere}</p>
                    </div>
                  )}

                  {/* Why It's Used */}
                  {explanation.whyItsUsed && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Why it's used</span>
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed">{explanation.whyItsUsed}</p>
                    </div>
                  )}

                  {/* Example */}
                  {explanation.example && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Example</span>
                      <pre className="mt-1 p-2 rounded-lg bg-muted/50 text-[11px] font-mono text-foreground/80 overflow-x-auto whitespace-pre">
                        {explanation.example}
                      </pre>
                    </div>
                  )}

                  {/* Pro Insight */}
                  {explanation.proInsight && (
                    <div className="pt-2 border-t border-border/40">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">💡 Pro insight</span>
                      <p className="text-xs text-foreground/80 leading-relaxed mt-1">{explanation.proInsight}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {onAskFollowUp && (
                    <div className="pt-2 border-t border-border/40 flex gap-2">
                      <button
                        onClick={() => {
                          onAskFollowUp(`Explain "${selectedToken}" in more depth`);
                          closePopup();
                        }}
                        className="text-[10px] px-2.5 py-1.5 rounded-full border border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Explain deeper
                      </button>
                      <button
                        onClick={() => {
                          onAskFollowUp(`What are alternatives to "${selectedToken}"?`);
                          closePopup();
                        }}
                        className="text-[10px] px-2.5 py-1.5 rounded-full border border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Alternatives?
                      </button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : null}
          </div>
          {/* Arrow pointer */}
          <div className="w-3 h-3 rotate-45 bg-card border-r border-b border-border/60 mx-auto -mt-3.5" />
        </div>
      )}

      {/* Code block */}
      <div className="rounded-xl overflow-hidden bg-[hsl(0,0%,8%)] border border-border/30">
        {fileName && (
          <div className="px-4 py-2 border-b border-border/20 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono">{fileName}</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] text-muted-foreground border border-border/40">{language}</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <pre className="p-4 text-sm leading-6 font-mono">
            {lines.map((line, lineIndex) => {
              const tokens = tokenize(line);
              return (
                <div
                  key={lineIndex}
                  className={`flex hover:bg-foreground/[0.04] transition-colors ${
                    selectedLine === lineIndex ? "bg-foreground/[0.08]" : ""
                  }`}
                >
                  <span className="select-none w-10 shrink-0 text-right pr-4 text-muted-foreground/40 text-xs leading-6">
                    {lineIndex + 1}
                  </span>
                  <span className="flex-1">
                    {tokens.map((token, tokenIndex) => {
                      if (isClickableToken(token)) {
                        return (
                          <span
                            key={tokenIndex}
                            onClick={(e) => handleTokenClick(token, lineIndex, e)}
                            className="cursor-pointer hover:bg-foreground/10 hover:text-foreground rounded px-0.5 transition-colors text-foreground/80"
                            title="Click to explain"
                          >
                            {token}
                          </span>
                        );
                      }
                      return <span key={tokenIndex} className="text-foreground/50">{token}</span>;
                    })}
                  </span>
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCodeViewer;
