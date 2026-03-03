import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { ResourceSummary } from "../lib/tauri";
import { useAppStore } from "../stores/appStore";

const columnHelper = createColumnHelper<ResourceSummary>();

function StatusBadge({ status }: { status: string }) {
  let color = "var(--text-secondary)";
  const lower = status.toLowerCase();
  if (lower === "running" || lower.includes("active") || lower === "bound") color = "var(--success)";
  else if (lower.includes("error") || lower.includes("crash") || lower === "failed") color = "var(--error)";
  else if (lower === "pending" || lower === "terminating") color = "var(--warning)";

  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
}

export function ResourceTable() {
  const { resources, isLoading, error, selectedResource, setSelectedResource, activeKind } = useAppStore();
  const [globalFilter, setGlobalFilter] = useState("");
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(() => [
    columnHelper.accessor("name", { header: "Name", size: 300 }),
    columnHelper.accessor("namespace", { header: "Namespace", size: 150 }),
    columnHelper.accessor("status", {
      header: "Status",
      size: 150,
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor("age", { header: "Age", size: 80 }),
  ], []);

  const table = useReactTable({
    data: resources,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 36,
    overscan: 20,
  });

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--error)]">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Search bar */}
      <div className="p-2 border-b border-[var(--border)] flex items-center gap-2">
        <Search size={16} className="text-[var(--text-secondary)]" />
        <input
          type="text"
          placeholder={`Search ${activeKind}... (/ to focus)`}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="flex-1 bg-transparent text-[var(--text-primary)] text-sm outline-none placeholder:text-[var(--text-secondary)]"
        />
        <span className="text-xs text-[var(--text-secondary)]">{rows.length} items</span>
      </div>

      {/* Table header */}
      <div className="flex border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        {table.getHeaderGroups().map((headerGroup) =>
          headerGroup.headers.map((header) => (
            <div
              key={header.id}
              className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider"
              style={{ width: header.getSize() }}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
            </div>
          ))
        )}
      </div>

      {/* Virtualized rows */}
      <div ref={tableContainerRef} className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-[var(--text-secondary)]">Loading...</div>
        ) : (
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              const isSelected = selectedResource?.name === row.original.name;
              return (
                <div
                  key={row.id}
                  className={`absolute w-full flex items-center cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[var(--accent)] bg-opacity-15"
                      : "hover:bg-[var(--bg-secondary)]"
                  }`}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => setSelectedResource(isSelected ? null : row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      className="px-3 py-2 text-sm truncate"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
