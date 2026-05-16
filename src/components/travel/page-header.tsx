import { Badge } from "@/components/ui/badge";

export function PageHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {badge ? <Badge variant="blue">{badge}</Badge> : null}
        <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-[0.95] tracking-[-0.04em] text-[var(--foreground)] md:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)] md:text-lg">{description}</p>
      </div>
    </div>
  );
}
