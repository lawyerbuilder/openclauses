"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  label?: string;
  size?: "sm" | "md";
  variant?: "ghost" | "outline";
  className?: string;
};

export function CopyButton({
  text,
  label,
  size = "sm",
  variant = "ghost",
  className,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — silently no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? "Copied" : `Copy ${label ?? "to clipboard"}`}
      title={copied ? "Copied" : `Copy ${label ?? "to clipboard"}`}
      className={cn(
        "shrink-0 inline-flex items-center justify-center gap-1.5 rounded-md transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        variant === "outline" && "border border-border hover:border-foreground/30",
        variant === "ghost" && "hover:bg-secondary",
        size === "sm" && "h-7 px-2 text-xs",
        size === "md" && "h-9 px-3 text-sm",
        copied ? "text-emerald-600" : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {copied ? (
        <Check className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      ) : (
        <Copy className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      )}
      {label && <span className="font-medium">{copied ? "Copied" : label}</span>}
    </button>
  );
}
