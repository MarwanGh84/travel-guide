import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-7 items-center gap-1 rounded-[8px] px-2.5 py-1 text-xs font-bold tracking-[-0.01em]",
  {
    variants: {
      variant: {
        default: "border border-[var(--line)] bg-white/[0.055] text-[var(--muted-2)]",
        secondary: "border border-[var(--line)] bg-white/[0.055] text-[var(--muted-2)]",
        live: "border border-emerald-300/25 bg-emerald-400/14 text-emerald-200",
        mock: "border border-amber-300/25 bg-amber-300/14 text-amber-200",
        blue: "border border-[rgba(132,215,208,0.28)] bg-[rgba(132,215,208,0.11)] text-[var(--cyan-2)]",
        warm: "border border-[rgba(216,183,106,0.32)] bg-[rgba(216,183,106,0.12)] text-[var(--amber-2)]",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
