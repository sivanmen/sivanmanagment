import * as React from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileJson, FileText } from 'lucide-react';
import { cn } from '../../utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ExportColumn<T = Record<string, unknown>> {
  /** Header label shown in CSV / PDF */
  header: string;
  /** Key or accessor to pull the value from each row */
  accessor: keyof T | ((row: T) => string | number | boolean | null | undefined);
}

type ExportFormat = 'csv' | 'json' | 'pdf';

interface DataExportButtonProps<T = Record<string, unknown>> {
  /** Array of data objects to export */
  data: T[];
  /** Column definitions (header + accessor) */
  columns: ExportColumn<T>[];
  /** Base filename without extension */
  filename?: string;
  /** Restrict available formats (default: all) */
  formats?: ExportFormat[];
  /** Called when PDF is requested (implement your own generator) */
  onPdfExport?: (data: T[], columns: ExportColumn<T>[]) => void;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function resolveValue<T>(row: T, accessor: ExportColumn<T>['accessor']): string {
  const raw = typeof accessor === 'function' ? accessor(row) : (row as Record<string, unknown>)[accessor as string];
  if (raw === null || raw === undefined) return '';
  return String(raw);
}

function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Format metadata                                                    */
/* ------------------------------------------------------------------ */

const formatMeta: Record<ExportFormat, { label: string; icon: React.ElementType }> = {
  csv: { label: 'CSV', icon: FileSpreadsheet },
  json: { label: 'JSON', icon: FileJson },
  pdf: { label: 'PDF', icon: FileText },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DataExportButton<T = Record<string, unknown>>({
  data,
  columns,
  filename = 'export',
  formats = ['csv', 'json', 'pdf'],
  onPdfExport,
  className,
}: DataExportButtonProps<T>) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleExport = React.useCallback(
    (format: ExportFormat) => {
      setOpen(false);

      const timestamp = new Date().toISOString().slice(0, 10);
      const baseName = `${filename}_${timestamp}`;

      switch (format) {
        case 'csv': {
          const header = columns.map((c) => escapeCSVField(c.header)).join(',');
          const rows = data.map((row) =>
            columns.map((col) => escapeCSVField(resolveValue(row, col.accessor))).join(','),
          );
          triggerDownload([header, ...rows].join('\n'), `${baseName}.csv`, 'text/csv');
          break;
        }

        case 'json': {
          const jsonData = data.map((row) => {
            const obj: Record<string, string> = {};
            columns.forEach((col) => {
              obj[col.header] = resolveValue(row, col.accessor);
            });
            return obj;
          });
          triggerDownload(
            JSON.stringify(jsonData, null, 2),
            `${baseName}.json`,
            'application/json',
          );
          break;
        }

        case 'pdf': {
          if (onPdfExport) {
            onPdfExport(data, columns);
          } else {
            console.warn(
              '[DataExportButton] PDF export requires an onPdfExport handler. Provide one to generate PDFs.',
            );
          }
          break;
        }
      }
    },
    [data, columns, filename, onPdfExport],
  );

  // If only one format, render a simple button
  if (formats.length === 1) {
    const fmt = formats[0];
    const { label, icon: Icon } = formatMeta[fmt];
    return (
      <button
        onClick={() => handleExport(fmt)}
        disabled={data.length === 0}
        className={cn(
          'inline-flex items-center gap-2 rounded-[8px] border border-[#c7c5cd]/20 bg-white px-4 py-2 text-sm font-medium text-[#191c1d] transition-all duration-200 hover:bg-[#f3f4f5] disabled:opacity-50 disabled:pointer-events-none',
          className,
        )}
      >
        <Icon className="h-4 w-4 text-[#46464c]" />
        Export {label}
      </button>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        disabled={data.length === 0}
        className="inline-flex items-center gap-2 rounded-[8px] border border-[#c7c5cd]/20 bg-white px-4 py-2 text-sm font-medium text-[#191c1d] transition-all duration-200 hover:bg-[#f3f4f5] disabled:opacity-50 disabled:pointer-events-none"
      >
        <Download className="h-4 w-4 text-[#46464c]" />
        Export
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-[#46464c] transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-[12px] bg-white shadow-lg ring-1 ring-[#c7c5cd]/20">
          {formats.map((fmt) => {
            const { label, icon: Icon } = formatMeta[fmt];
            return (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#191c1d] transition-colors hover:bg-[#f3f4f5]"
              >
                <Icon className="h-4 w-4 text-[#46464c]" />
                Export as {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
