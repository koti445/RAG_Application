import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  emptyDescription?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "No records found",
  emptyDescription = "Get started by creating your first item.",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="enterprise-panel flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-overlay">
          <span className="text-2xl text-content-muted">—</span>
        </div>
        <p className="font-medium text-content-primary">{emptyMessage}</p>
        <p className="mt-1 max-w-sm text-sm text-content-muted">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="enterprise-panel overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border bg-surface-overlay/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-content-muted",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className="border-b border-surface-border/50 transition-colors hover:bg-surface-hover/50"
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-3 text-content-secondary", col.className)}>
                  {col.render ? col.render(row) : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
