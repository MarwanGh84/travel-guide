import { LoaderCircle, MapPinned, Sparkles } from "lucide-react";

export default function DiscoverLoading() {
  return (
    <div className="grid h-full place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-surface-2 text-foreground">
          <MapPinned size={24} />
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Preparing discovery</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-foreground">Building destination ideas and places</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          We are gathering recommendations, live places, and trip context for your next planning step.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest text-muted">
          <LoaderCircle size={16} className="animate-spin" />
          <span>Preparing your explorer</span>
          <Sparkles size={14} />
        </div>
      </div>
    </div>
  );
}
