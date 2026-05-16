import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default: "border border-[var(--amber)] bg-[var(--amber)] text-[#fffaf4] hover:bg-[var(--amber-2)]",
        secondary: "border border-[var(--line)] bg-[var(--surface-3)] text-[var(--foreground)] hover:border-[var(--line-strong)]",
        outline: "border border-[var(--line)] bg-transparent text-[var(--foreground)] hover:border-[var(--line-strong)] hover:bg-[rgba(107,67,41,0.04)]",
        ghost: "text-[var(--muted-2)] hover:bg-[rgba(107,67,41,0.06)] hover:text-[var(--foreground)]",
        warm: "border border-[var(--amber)] bg-[var(--amber)] text-[#fffaf4] hover:bg-[var(--amber-2)]",
        danger: "border border-[rgba(157,90,75,0.35)] bg-[rgba(157,90,75,0.08)] text-[var(--rose)] hover:bg-[rgba(157,90,75,0.14)]",
      },
      size: {
        sm: "min-h-9 px-3",
        md: "min-h-10 px-4",
        lg: "min-h-11 px-5 text-base",
        icon: "size-10 min-h-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
