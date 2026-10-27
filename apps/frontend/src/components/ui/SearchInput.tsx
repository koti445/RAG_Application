"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function SearchInput({
  placeholder = "Search...",
  className,
  value: controlledValue,
  onChange,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState("");
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          if (!isControlled) setInternalValue(next);
          onChange?.(next);
        }}
        className="enterprise-input pl-9"
      />
    </div>
  );
}
