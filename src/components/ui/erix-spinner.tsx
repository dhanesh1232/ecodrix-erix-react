// src/components/ui/erix-spinner.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function ErixSpinner({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const s = { sm: "erix-size-4", md: "erix-size-6", lg: "erix-size-8" }[size];
  return (
    <svg
      className={cn("erix-animate-spin erix-text-muted-foreground", s, className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="erix-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="erix-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function ErixLoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="erix-absolute erix-inset-0 erix-flex erix-flex-col erix-items-center erix-justify-center erix-gap-3 erix-rounded-xl erix-bg-background/80 backdrop-blur-sm erix-z-10">
      <ErixSpinner size="lg" className="erix-text-primary" />
      {message && <p className="erix-text-sm erix-text-muted-foreground">{message}</p>}
    </div>
  );
}
