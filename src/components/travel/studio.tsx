import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import { ArrowRight, CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "default" | "warm" | "cyan" | "emerald" | "rose" | "muted" | "selected" | "live" | "blue" | "amber";

const toneStyles: Record<Tone, string> = {
  default: "border-[var(--line)] bg-white/[0.045] text-[var(--muted-2)]",
  warm: "border-[rgba(216,183,106,0.34)] bg-[rgba(216,183,106,0.12)] text-[var(--amber-2)]",
  cyan: "border-[rgba(132,215,208,0.32)] bg-[rgba(132,215,208,0.10)] text-[var(--cyan-2)]",
  emerald: "border-[rgba(117,201,152,0.32)] bg-[rgba(117,201,152,0.10)] text-emerald-100",
  rose: "border-[rgba(239,141,141,0.34)] bg-[rgba(239,141,141,0.10)] text-rose-100",
  muted: "border-[var(--line)] bg-white/[0.035] text-[var(--muted)]",
  selected: "border-[rgba(216,183,106,0.52)] bg-[linear-gradient(135deg,rgba(216,183,106,0.16),rgba(132,215,208,0.08))] text-[var(--foreground)] shadow-[0_0_0_1px_rgba(216,183,106,0.12),0_20px_60px_rgba(0,0,0,0.28)]",
  live: "border-[rgba(117,201,152,0.32)] bg-[rgba(117,201,152,0.10)] text-emerald-100",
  blue: "border-[rgba(132,215,208,0.32)] bg-[rgba(132,215,208,0.10)] text-[var(--cyan-2)]",
  amber: "border-[rgba(216,183,106,0.34)] bg-[rgba(216,183,106,0.12)] text-[var(--amber-2)]",
};

export function TravelPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-5", className)}>{children}</div>;
}

export function PageHero({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("travel-surface overflow-hidden p-5 sm:p-7 lg:p-8", className)}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,380px)] lg:items-end">
        <div>
          <h1 className="max-w-5xl text-[clamp(2rem,4vw,4.6rem)] font-black leading-[0.95] tracking-[-0.055em] text-[var(--foreground)]">
            {title}
          </h1>
          {description ? <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--muted-2)]">{description}</p> : null}
        </div>
        {children ? <div>{children}</div> : null}
      </div>
    </section>
  );
}

export function PageSection({
  id,
  title,
  description,
  action,
  children,
  className,
}: {
  id?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("travel-surface scroll-mt-24 p-4 sm:p-5", className)}>
      {(title || description || action) ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-xl font-black tracking-[-0.035em] text-[var(--foreground)]">{title}</h2> : null}
            {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function ProductCard({
  title,
  subtitle,
  media,
  action,
  selected,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  media?: ReactNode;
  action?: ReactNode;
  selected?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("travel-card group grid gap-4 p-4", selected && "travel-selected", className)}>
      {media ? <div className="overflow-hidden rounded-[8px] bg-white/[0.045]">{media}</div> : null}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black leading-tight tracking-[-0.035em] text-[var(--foreground)]">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </article>
  );
}

export function DetailPanel({ title, children, action, className }: { title: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <aside className={cn("travel-surface p-4", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black tracking-[-0.03em] text-[var(--foreground)]">{title}</h2>
        {action}
      </div>
      {children}
    </aside>
  );
}

export function ActionPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("travel-surface border-[var(--line-strong)] p-4", className)}>{children}</div>;
}

export function StatusBadge({ children, tone = "default", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-[8px] border px-2.5 text-xs font-black", toneStyles[tone], className)}>{children}</span>;
}

export function SourceBadge({ provider, live = false }: { provider: string; live?: boolean }) {
  return <StatusBadge tone={live ? "emerald" : "muted"}>{provider}</StatusBadge>;
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-5 xl:grid-cols-1">
      {steps.map((step, index) => {
        const active = index === current;
        const done = index < current;
        return (
          <li key={step} className={cn("rounded-[8px] border p-3 transition", done || active ? "border-[rgba(216,183,106,0.38)] bg-[rgba(216,183,106,0.10)]" : "border-[var(--line)] bg-white/[0.035]")}>
            <span className="flex items-center gap-2 text-xs font-black text-[var(--muted)]">
              <span className={cn("flex size-6 items-center justify-center rounded-[8px] border", done ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100" : active ? "border-[var(--amber)] bg-[var(--amber)] text-[#151411]" : "border-[var(--line)]")}>
                {done ? <CheckCircle2 size={14} /> : index + 1}
              </span>
              Step {index + 1}
            </span>
            <p className={cn("mt-2 text-sm font-bold", active ? "text-[var(--foreground)]" : "text-[var(--muted)]")}>{step}</p>
          </li>
        );
      })}
    </ol>
  );
}

export function DrawerPanel({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="travel-card p-0" open={open}>
      <summary className="flex min-h-14 list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black text-[var(--foreground)]">
        {title}
        <ArrowRight size={16} className="transition group-open:rotate-90" />
      </summary>
      <div className="border-t border-[var(--line)] p-4">{children}</div>
    </details>
  );
}

export function Timeline({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("relative grid gap-4 before:absolute before:bottom-4 before:left-[20px] before:top-4 before:w-px before:bg-[var(--line)]", className)}>{children}</div>;
}

export function TimelineSlot({ label, time, children, action }: { label: string; time?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="relative grid gap-3 pl-12">
      <div className="absolute left-0 top-1 flex size-10 items-center justify-center rounded-[8px] border border-[rgba(132,215,208,0.28)] bg-[rgba(132,215,208,0.10)] text-xs font-black text-[var(--cyan-2)]">
        {time ?? label.slice(0, 1)}
      </div>
      <div className="travel-card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="premium-label">{label}</p>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormSection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("grid gap-4 rounded-[8px] border border-[var(--line)] bg-white/[0.035] p-4", className)}>
      <h3 className="text-lg font-black tracking-[-0.03em] text-[var(--foreground)]">{title}</h3>
      {children}
    </section>
  );
}

export function FormField({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("grid gap-2 text-sm font-bold text-[var(--muted-2)]", className)}>
      <span className="flex items-center justify-between gap-3">
        {label}
        {hint ? <span className="text-xs font-semibold text-[var(--muted)]">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export function FloatingActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[var(--line-strong)] bg-[#090b0b]/92 p-3 shadow-[0_20px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl", className)}>{children}</div>;
}

export function SelectionBasket({ title, count, children, action, className }: { title: string; count: number; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <DetailPanel title={title} action={<StatusBadge tone={count ? "warm" : "muted"}>{count} selected</StatusBadge>} className={className}>
      <div className="grid gap-3">{children}</div>
      {action ? <div className="mt-4">{action}</div> : null}
    </DetailPanel>
  );
}

export function MobileTabBar({ children }: { children: ReactNode }) {
  return <div className="fixed inset-x-3 bottom-[72px] z-30 rounded-[8px] border border-[var(--line-strong)] bg-[#090b0b]/94 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:hidden">{children}</div>;
}

export function EmptyState({ title, text, action, icon: Icon }: { title: string; text: string; action?: ReactNode; icon?: ElementType }) {
  return (
    <div className="travel-surface grid min-h-52 place-items-center p-8 text-center">
      <div className="max-w-md">
        {Icon ? <span className="mx-auto mb-4 grid size-12 place-items-center rounded-[8px] border border-[rgba(216,183,106,0.30)] bg-[rgba(216,183,106,0.12)] text-[var(--amber-2)]"><Icon /></span> : null}
        <h3 className="text-2xl font-black tracking-[-0.04em] text-[var(--foreground)]">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{text}</p>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}

export function LoadingState({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="travel-card flex min-h-28 items-center gap-3 p-4 text-sm font-bold text-[var(--muted-2)]">
      <Loader2 className="animate-spin text-[var(--cyan)]" />
      {text}
    </div>
  );
}

export function ErrorState({ title = "Something needs attention", text }: { title?: string; text: string }) {
  return (
    <div className="rounded-[8px] border border-rose-300/30 bg-rose-400/10 p-4 text-sm text-rose-100">
      <p className="flex items-center gap-2 font-black"><CircleAlert size={16} /> {title}</p>
      <p className="mt-2 leading-6">{text}</p>
    </div>
  );
}

export function SuccessState({ text }: { text: string }) {
  return <div className="rounded-[8px] border border-emerald-300/30 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-100">{text}</div>;
}

export function ProductGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-3", className)}>{children}</div>;
}

export function Workspace({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]", className)}>{children}</div>;
}

export function ActionLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-[var(--line)] bg-white/[0.055] px-4 text-sm font-black text-[var(--foreground)] transition hover:border-[var(--line-strong)] hover:bg-white/[0.08]">{children}</Link>;
}

// Compatibility wrappers while pages are migrated to the strict system.
export function StudioHero({ label, title, description, children, className }: { label?: string; title: string; description?: string; children?: ReactNode; className?: string }) {
  return (
    <PageHero title={title} description={description} className={className}>
      {children}
      {label ? <span className="sr-only">{label}</span> : null}
    </PageHero>
  );
}

export function StudioPanel({ title, eyebrow, description, action, children, className }: { title?: string; eyebrow?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <PageSection title={title} description={description ?? eyebrow} action={action} className={className}>{children}</PageSection>;
}

export const StudioGrid = Workspace;
export function StudioRail({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  if (title) return <DetailPanel title={title} action={action} className={className}>{children}</DetailPanel>;
  return <aside className={cn("space-y-5", className)}>{children}</aside>;
}
export const StudioChip = StatusBadge;
export function PremiumListCard({ title, eyebrow, action, children, className }: { title: string; eyebrow?: string; action?: ReactNode; children?: ReactNode; className?: string }) {
  return <ProductCard title={title} subtitle={eyebrow} action={action} className={className}>{children}</ProductCard>;
}
export const PageSectionAlias = PageSection;
export function StudioAction({ href, icon: Icon, title, text, active }: { href: string; icon?: ElementType; title: string; text: string; active?: boolean }) {
  return (
    <Link href={href} className={cn("travel-card grid min-h-44 content-between p-4", active && "travel-selected")}>
      <span className="flex size-11 items-center justify-center rounded-[8px] border border-[rgba(132,215,208,0.22)] bg-[rgba(132,215,208,0.10)] text-[var(--cyan-2)]">
        {Icon ? <Icon /> : <ArrowRight />}
      </span>
      <span>
        <span className="block text-lg font-black tracking-[-0.03em] text-[var(--foreground)]">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">{text}</span>
      </span>
      <ArrowRight className="justify-self-end text-[var(--muted)]" />
    </Link>
  );
}
export const StudioStat = ({ label, value, tone = "default" }: { label: string; value: string; tone?: Tone; icon?: ElementType }) => (
  <div className={cn("rounded-[8px] border p-4", toneStyles[tone])}>
    <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
    <p className="mt-2 text-2xl font-black tracking-[-0.04em]">{value}</p>
  </div>
);
export const StudioListItem = ({ title, text, meta }: { title: string; text: string; meta?: ReactNode }) => (
  <div className="rounded-[8px] border border-[var(--line)] bg-white/[0.035] p-4">
    <p className="font-black text-[var(--foreground)]">{title}</p>
    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{text}</p>
    {meta}
  </div>
);

export function TimelineItem({ label, text, tone = "cyan" }: { label: string; text: string; tone?: Tone }) {
  return (
    <TimelineSlot label={label} time={label.slice(0, 2).toUpperCase()}>
      <div className={cn("rounded-[8px] border p-3 text-sm leading-6", toneStyles[tone])}>{text}</div>
    </TimelineSlot>
  );
}
