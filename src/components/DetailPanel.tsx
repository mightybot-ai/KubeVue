import { useEffect, useState } from "react";
import { X, FileText, ScrollText, AlertTriangle, Trash2, RefreshCw, Copy } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { api, events } from "../lib/tauri";

export function DetailPanel() {
  const { selectedResource, activeContext, detailTab, setDetailTab, setSelectedResource } = useAppStore();
  const [yaml, setYaml] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedResource || !activeContext) return;
    if (detailTab === "yaml") {
      setLoading(true);
      const ns = selectedResource.namespace || "default";
      api.getResourceYaml(activeContext, selectedResource.kind.toLowerCase() + "s", selectedResource.name, ns)
        .then(setYaml)
        .catch((e) => setYaml(`Error: ${e}`))
        .finally(() => setLoading(false));
    }
  }, [selectedResource, detailTab, activeContext]);

  useEffect(() => {
    if (!selectedResource || detailTab !== "logs" || selectedResource.kind !== "Pod" || !activeContext) return;
    setLogs([]);
    const ns = selectedResource.namespace || "default";
    api.streamLogs(activeContext, selectedResource.name, null, ns, true, 100);
    const unlisten = events.onLogLine((data) => {
      if (data.pod === selectedResource.name) {
        setLogs((prev) => [...prev.slice(-9999), data.line]);
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [selectedResource, detailTab, activeContext]);

  if (!selectedResource) return null;

  return (
    <div className="w-96 h-full bg-[var(--bg-secondary)] border-l border-[var(--border)] flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{selectedResource.name}</div>
          <div className="text-xs text-[var(--text-secondary)]">{selectedResource.kind} &middot; {selectedResource.namespace}</div>
        </div>
        <button onClick={() => setSelectedResource(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        {[
          { id: "yaml" as const, label: "YAML", icon: <FileText size={14} /> },
          { id: "logs" as const, label: "Logs", icon: <ScrollText size={14} /> },
          { id: "events" as const, label: "Events", icon: <AlertTriangle size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDetailTab(tab.id)}
            className={`flex items-center gap-1 px-3 py-2 text-xs transition-colors ${
              detailTab === tab.id
                ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {detailTab === "yaml" && (
          <pre className="text-xs font-mono text-[var(--text-secondary)] whitespace-pre-wrap">{loading ? "Loading..." : yaml}</pre>
        )}
        {detailTab === "logs" && (
          selectedResource.kind === "Pod" ? (
            <div className="text-xs font-mono space-y-0.5">
              {logs.length === 0 && <span className="text-[var(--text-secondary)]">Waiting for logs...</span>}
              {logs.map((line, i) => (
                <div key={i} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{line}</div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-[var(--text-secondary)]">Logs only available for Pods</div>
          )
        )}
        {detailTab === "events" && (
          <div className="text-sm text-[var(--text-secondary)]">Events view — coming soon</div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-[var(--border)] flex gap-2">
        <button className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--bg-tertiary)] rounded hover:bg-[var(--border)] transition-colors">
          <Copy size={12} /> Copy YAML
        </button>
        {selectedResource.kind === "Deployment" && (
          <button
            onClick={() => {
              if (activeContext && selectedResource.namespace) {
                api.restartDeployment(activeContext, selectedResource.name, selectedResource.namespace);
              }
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--bg-tertiary)] rounded hover:bg-[var(--border)] transition-colors"
          >
            <RefreshCw size={12} /> Restart
          </button>
        )}
        <button
          onClick={() => {
            if (activeContext && selectedResource.namespace) {
              const kind = selectedResource.kind.toLowerCase() + "s";
              api.deleteResource(activeContext, kind, selectedResource.name, selectedResource.namespace || "default");
              setSelectedResource(null);
            }
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--error)] bg-[var(--bg-tertiary)] rounded hover:bg-[var(--border)] transition-colors ml-auto"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}
