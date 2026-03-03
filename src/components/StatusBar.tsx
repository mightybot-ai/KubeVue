import { useAppStore } from "../stores/appStore";

export function StatusBar() {
  const { activeContext, activeNamespace, resources, isLoading, error } = useAppStore();

  return (
    <div className="h-7 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex items-center px-3 text-xs text-[var(--text-secondary)] gap-4">
      <span className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${error ? "bg-[var(--error)]" : "bg-[var(--success)]"}`} />
        {activeContext || "No cluster"}
      </span>
      <span>{activeNamespace}</span>
      <span className="ml-auto">{isLoading ? "Loading..." : `${resources.length} resources`}</span>
    </div>
  );
}
