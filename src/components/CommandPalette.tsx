import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useAppStore, ResourceKind } from "../stores/appStore";

const COMMANDS = [
  { id: "pods", label: "Go to Pods", action: "navigate" as const, kind: "pods" as ResourceKind },
  { id: "deployments", label: "Go to Deployments", action: "navigate" as const, kind: "deployments" as ResourceKind },
  { id: "services", label: "Go to Services", action: "navigate" as const, kind: "services" as ResourceKind },
  { id: "configmaps", label: "Go to ConfigMaps", action: "navigate" as const, kind: "configmaps" as ResourceKind },
  { id: "secrets", label: "Go to Secrets", action: "navigate" as const, kind: "secrets" as ResourceKind },
  { id: "ingresses", label: "Go to Ingresses", action: "navigate" as const, kind: "ingresses" as ResourceKind },
  { id: "pvcs", label: "Go to PVCs", action: "navigate" as const, kind: "pvcs" as ResourceKind },
  { id: "events", label: "Go to Events", action: "navigate" as const, kind: "events" as ResourceKind },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { setActiveKind } = useAppStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const filtered = COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-[500px] bg-[var(--bg-secondary)] rounded-lg shadow-2xl border border-[var(--border)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          <Search size={16} className="text-[var(--text-secondary)]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[var(--text-primary)] text-sm outline-none"
          />
          <kbd className="text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">Esc</kbd>
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => {
                if (cmd.action === "navigate") setActiveKind(cmd.kind);
                setOpen(false);
              }}
              className="w-full px-4 py-2 text-sm text-left text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
