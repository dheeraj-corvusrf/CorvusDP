import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Loader2, Bot } from "lucide-react";
import { useActiveProjectBundle } from "@/hooks/use-project";
import { askAssistant, type AssistantProjectContext, type ChatMessage } from "@/lib/ai";
import { cn } from "@/lib/utils";

// Site-wide chat entry point, mounted once at the root (see __root.tsx) so it
// survives client-side navigation and stays open across pages. On the public
// marketing pages it answers general permitting/design/construction
// questions; once a project exists (dashboard), it's grounded with a small,
// already-loaded summary of that real project — never a fresh DB query of
// its own (see src/lib/ai.ts). A plain fixed-position element (not a portal)
// is safe here since it's a direct sibling of <main>, outside every route's
// own transformed/overflow-clip containers.
const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi — I'm the CorvusDP Assistant. Ask me about permitting, design, or construction, or about your own project once you've run an analysis.",
};

export function AskAiWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { hasProject, project, bundle } = useActiveProjectBundle();

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, sending]);

  function buildContext(): AssistantProjectContext | undefined {
    if (!hasProject || !project) return undefined;
    return {
      track: project.track as AssistantProjectContext["track"],
      address: project.address ?? undefined,
      city: project.city ?? undefined,
      county: project.county ?? undefined,
      state: project.state ?? undefined,
      zoningCode: project.zoning ?? undefined,
      feasibilityStatus: project.feasibility_status ?? undefined,
      permitCount: bundle?.permits.length,
      permitNames: bundle?.permits.map((p) => p.name).slice(0, 20),
      complexityLevel: project.complexity_level ?? undefined,
      checklistProgress: bundle
        ? `${bundle.checklist.filter((c) => c.done).length}/${bundle.checklist.length} checklist items done`
        : undefined,
    };
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setSending(true);
    try {
      const reply = await askAssistant(next, buildContext());
      setMessages((cur) => [...cur, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end sm:inset-x-auto sm:right-6 sm:bottom-6">
      {open && (
        <div className="pointer-events-auto glass mb-3 flex h-[28rem] w-full max-w-sm flex-col overflow-hidden sm:absolute sm:bottom-16 sm:right-0">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-semibold leading-tight">CorvusDP Assistant</div>
                <div className="spec-label !text-[0.6rem]">
                  {hasProject ? "Grounded in your active project" : "General guidance"}
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-accent text-accent-foreground"
                    : "mr-auto bg-secondary text-secondary-foreground",
                )}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="mr-auto flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
              </div>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-2 border-t border-border/60 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about permits, design, or your project…"
              className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-transform disabled:opacity-50 enabled:hover:-translate-y-0.5"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close CorvusDP Assistant" : "Open CorvusDP Assistant"}
        className="btn-accent pointer-events-auto h-12 w-12 rounded-full !p-0 shadow-lg sm:h-14 sm:w-auto sm:rounded-full sm:!px-5"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        <span className="hidden sm:inline">{open ? "Close" : "Ask AI"}</span>
      </button>
    </div>
  );
}
