import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-[8px] border border-[var(--line)] bg-[#151818] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--cyan)] focus:ring-2 focus:ring-[rgba(132,215,208,0.18)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
