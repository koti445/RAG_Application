"use client";

import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  maxSizeMb?: number;
  allowedExtensions?: string[];
}

export function FileUploadZone({
  files,
  onChange,
  accept = ".pdf,.docx,.txt,.csv",
  maxSizeMb = 50,
  allowedExtensions = ["pdf", "docx", "txt", "csv"],
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  function validateAndAdd(incoming: FileList | File[]) {
    setError("");
    const next = [...files];
    const maxBytes = maxSizeMb * 1024 * 1024;

    for (const file of Array.from(incoming)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!allowedExtensions.map((e) => e.toLowerCase()).includes(ext)) {
        setError(`File type .${ext} not allowed. Allowed: ${allowedExtensions.join(", ")}`);
        continue;
      }
      if (file.size > maxBytes) {
        setError(`${file.name} exceeds ${maxSizeMb} MB limit`);
        continue;
      }
      if (!next.some((f) => f.name === file.name && f.size === file.size)) {
        next.push(file);
      }
    }
    onChange(next);
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-content-muted">
        Upload documents <span className="text-accent">*</span>
      </label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) validateAndAdd(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 transition-colors",
          dragOver
            ? "border-accent bg-accent/10"
            : "border-surface-border bg-surface-overlay hover:border-accent/40 hover:bg-surface-hover"
        )}
      >
        <Upload className="mb-2 h-8 w-8 text-content-muted" />
        <p className="text-sm font-medium text-content-primary">Drop files here or click to browse</p>
        <p className="mt-1 text-xs text-content-muted">
          {allowedExtensions.join(", ").toUpperCase()} — max {maxSizeMb} MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) validateAndAdd(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {files.length > 0 && (
        <ul className="space-y-1 rounded-md border border-surface-border bg-surface-overlay p-2">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2 text-content-secondary">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="text-content-muted">({(file.size / 1024).toFixed(1)} KB)</span>
              </span>
              <button type="button" onClick={() => removeFile(i)} className="text-content-muted hover:text-red-400">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
