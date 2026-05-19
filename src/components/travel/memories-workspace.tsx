"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  PlusCircle,
  Bookmark,
  MessageSquare,
  RefreshCw,
  FolderOpen,
  Unlink,
  ExternalLink,
  ImageIcon,
  Video,
  FileText,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { connectMemoryFolder, disconnectMemoryFolder, syncMemoryFolder } from "@/app/actions";

type MemoryShape = {
  id: string;
  title: string;
  rating: number | null;
  favoriteMoments: string | null;
  notes: string | null;
  photosPlaceholder: string | null;
};

type MemoriesWorkspaceProps = {
  memories: MemoryShape[];
  tripName: string;
  memorySources: {
    id: string;
    folderId: string;
    folderName: string | null;
    folderUrl: string;
    lastSyncedAt: Date | null;
  }[];
  memoryAssets: {
    id: string;
    name: string;
    mimeType: string;
    sourceFolderId: string;
    thumbnailLink: string | null;
    webViewLink: string | null;
    createdTime: Date | null;
    modifiedTime?: Date | null;
  }[];
  driveState: {
    connected: boolean;
    configured: boolean;
    hasDriveScope: boolean;
    status?: string;
    errorMessage?: string;
  };
};

export function MemoriesWorkspace({ memories, tripName, memorySources, memoryAssets, driveState }: MemoriesWorkspaceProps) {
  const [selectedId, setSelectedId] = useState(memories[0]?.id ?? "");
  const [showFolderForm, setShowFolderForm] = useState(memorySources.length === 0);
  const [selectedFolderId, setSelectedFolderId] = useState(memorySources[0]?.id ?? "");
  const [assetFilter, setAssetFilter] = useState<DriveAssetFilter>("all");
  const [previewAssetId, setPreviewAssetId] = useState<string | null>(null);
  const [failedThumbnailIds, setFailedThumbnailIds] = useState<string[]>([]);
  const resolvedSelectedId = memories.some((memory) => memory.id === selectedId) ? selectedId : memories[0]?.id ?? "";
  const active = memories.find((memory) => memory.id === resolvedSelectedId);
  const memorySource = memorySources.find((source) => source.id === selectedFolderId) ?? memorySources[0] ?? null;
  const folderAssets = useMemo(
    () => memorySource ? memoryAssets.filter((asset) => asset.sourceFolderId === memorySource.folderId) : [],
    [memoryAssets, memorySource],
  );
  const assetCounts = useMemo(
    () => ({
      all: folderAssets.length,
      photos: folderAssets.filter((asset) => classifyDriveAsset(asset.mimeType) === "photo").length,
      videos: folderAssets.filter((asset) => classifyDriveAsset(asset.mimeType) === "video").length,
      documents: folderAssets.filter((asset) => classifyDriveAsset(asset.mimeType) === "document").length,
    }),
    [folderAssets],
  );
  const filteredAssets = useMemo(
    () => folderAssets.filter((asset) => assetFilter === "all" || classifyDriveAsset(asset.mimeType) === assetFilter.slice(0, -1)),
    [assetFilter, folderAssets],
  );
  const previewAsset = folderAssets.find((asset) => asset.id === previewAssetId) ?? null;

  useEffect(() => {
    if (!previewAsset) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPreviewAssetId(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewAsset]);

  return (
    <div className="flex min-h-full w-full flex-col bg-background lg:h-full lg:flex-row lg:overflow-hidden">
      {/* 1. Sidebar - Timeline of Memories */}
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface lg:w-[320px] lg:border-b-0 lg:border-r overflow-y-auto lg:overflow-hidden lg:h-full">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
           <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Archive</span>
           <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-muted">{memories.length}</span>
        </div>

        <div className="flex gap-4 overflow-x-auto lg:flex-col lg:overflow-x-visible divide-x lg:divide-x-0 lg:divide-y divide-border/50 lg:flex-1 lg:overflow-y-auto no-scrollbar">
           {memorySources.length > 0 && (
             <div className="shrink-0 w-[280px] lg:w-full space-y-3 p-4">
               <div className="flex items-center justify-between gap-3">
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted">Google Drive</span>
                 <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-bold text-muted">{memoryAssets.length}</span>
               </div>
               <div className="space-y-2">
                 {memorySources.map((source) => {
                   const sourceAssetCount = memoryAssets.filter((asset) => asset.sourceFolderId === source.folderId).length;
                   const selected = source.id === memorySource?.id;
                   return (
                     <button
                       key={source.id}
                       type="button"
                       onClick={() => {
                         setSelectedFolderId(source.id);
                         setShowFolderForm(false);
                       }}
                       className={cn(
                         "block w-full rounded-xl border p-3 text-left transition-colors",
                         selected ? "border-foreground bg-background shadow-sm" : "border-border bg-background hover:bg-surface-2",
                       )}
                     >
                       <p className="truncate text-xs font-black uppercase tracking-tight text-foreground">
                         {source.folderName ?? "Linked folder"}
                       </p>
                       <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-muted">
                         {sourceAssetCount} assets
                       </p>
                     </button>
                   );
                 })}
               </div>
             </div>
           )}
           {memories.map((m) => (
             <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={cn(
                  "shrink-0 w-[240px] lg:w-full flex flex-col gap-1 p-4 text-left transition-all",
                  resolvedSelectedId === m.id ? "bg-background ring-1 ring-inset ring-border" : "hover:bg-background/50"
                )}
             >
                <div className="flex items-center justify-between">
                   <h4 className={cn("truncate text-xs font-bold uppercase tracking-tight", resolvedSelectedId === m.id ? "text-foreground" : "text-muted-2")}>
                      {m.title}
                   </h4>
                   <span className="text-[10px] font-bold text-black">{m.rating}/5</span>
                </div>
                <p className="truncate text-[9px] font-bold uppercase tracking-widest text-muted">{tripName}</p>
             </button>
           ))}
           {memories.length === 0 && memorySources.length === 0 && (
             <div className="p-12 text-center opacity-40 w-full lg:w-full">
                <Bookmark size={32} className="mx-auto mb-4" strokeWidth={1} />
                <p className="text-[10px] font-bold uppercase tracking-widest">No entries</p>
             </div>
           )}
        </div>

        <div className="border-t border-border bg-background p-4 mt-auto lg:mt-0">
           <button
             onClick={() => {
               setShowFolderForm(true);
             }}
             className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-black text-[10px] font-black uppercase tracking-widest text-white hover:bg-zinc-800 transition-all"
           >
              <PlusCircle size={14} /> Add Drive
           </button>
        </div>
      </aside>

      {/* 2. Main Detail Stage */}
      <main className="relative flex-1 overflow-y-auto bg-background p-4 pb-20 sm:p-6 lg:p-10 scrollbar-hide">
        <section className="mx-auto mb-10 max-w-6xl rounded-2xl border border-border bg-surface p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Drive Intel</p>
              <h2 className="mt-2 text-lg font-black uppercase tracking-tight text-foreground truncate">
                {memorySource?.folderName ?? "No Drive folder linked"}
              </h2>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Previews are fetched on demand.
              </p>
            </div>
            {memorySource && (
              <a
                href={memorySource.folderUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-4 text-[10px] font-black uppercase tracking-widest w-full sm:w-auto"
              >
                <FolderOpen size={13} /> Open in Drive
              </a>
            )}
          </div>

          {driveState.status && (
            <div className="mt-4 rounded-md border border-border bg-background px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted">
              {driveStatusMessage(driveState.status, driveState.errorMessage)}
            </div>
          )}
          {!driveState.connected && (
            <div className="mt-5 rounded-lg border border-border bg-background p-4 text-sm text-muted-2">
              Connect Google from Imports before linking a Drive folder.
            </div>
          )}

          {driveState.connected && !driveState.hasDriveScope && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-4 text-sm text-muted-2">
              <span>Reconnect Google to enable Drive previews.</span>
              <a
                href="/api/gmail/connect"
                className="inline-flex h-9 items-center rounded-md bg-black px-3 text-[10px] font-black uppercase tracking-widest text-white"
              >
                Reconnect Google
              </a>
            </div>
          )}

          {driveState.connected && driveState.hasDriveScope && (showFolderForm || !memorySource) && (
            <form action={connectMemoryFolder} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                name="folderUrlOrId"
                required
                placeholder="Paste Google Drive folder URL or folder ID"
                className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm"
              />
              <button className="h-10 rounded-md bg-black px-4 text-[10px] font-black uppercase tracking-widest text-white">
                Link Folder
              </button>
            </form>
          )}

          {memorySource && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <form action={syncMemoryFolder}>
                <input type="hidden" name="sourceId" value={memorySource.id} />
                <button className="inline-flex h-9 items-center gap-2 rounded-md bg-black px-3 text-[10px] font-black uppercase tracking-widest text-white">
                  <RefreshCw size={13} /> Refresh folder
                </button>
              </form>
              <form action={disconnectMemoryFolder}>
                <input type="hidden" name="sourceId" value={memorySource.id} />
                <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-[10px] font-black uppercase tracking-widest">
                  <Unlink size={13} /> Disconnect
                </button>
              </form>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                Last synced {memorySource.lastSyncedAt ? memorySource.lastSyncedAt.toISOString().slice(0, 16).replace("T", " ") : "never"}
              </span>
            </div>
          )}

          {memorySource && (
            <div className="mt-6">
              {folderAssets.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted">
                  This folder is linked, but no supported files were found yet.
                </div>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {DRIVE_ASSET_FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setAssetFilter(filter.id)}
                        className={cn(
                          "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[10px] font-black uppercase tracking-widest transition-colors",
                          assetFilter === filter.id
                            ? "border-black bg-black text-white"
                            : "border-border bg-background text-muted hover:text-foreground",
                        )}
                      >
                        {filter.label}
                        <span className={cn("rounded-full px-1.5 py-0.5", assetFilter === filter.id ? "bg-white/15" : "bg-surface-2")}>
                          {assetCounts[filter.id]}
                        </span>
                      </button>
                    ))}
                  </div>

                  {filteredAssets.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted">
                      No {assetFilter === "all" ? "supported files" : assetFilter} found in this folder.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredAssets.map((asset) => (
                    <article key={asset.id} className="rounded-xl border border-border bg-background p-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (classifyDriveAsset(asset.mimeType) === "photo" && driveState.hasDriveScope) setPreviewAssetId(asset.id);
                        }}
                        className={cn(
                          "mb-3 flex h-32 w-full items-center justify-center overflow-hidden rounded-lg bg-surface-2 text-left",
                          classifyDriveAsset(asset.mimeType) === "photo" && driveState.hasDriveScope ? "cursor-zoom-in" : "cursor-default",
                        )}
                      >
                        {driveState.hasDriveScope && asset.thumbnailLink && !failedThumbnailIds.includes(asset.id) ? (
                          <Image
                            src={`/api/memories/assets/${asset.id}/thumbnail`}
                            alt=""
                            width={320}
                            height={180}
                            className="h-full w-full object-cover"
                            onError={() => setFailedThumbnailIds((ids) => ids.includes(asset.id) ? ids : [...ids, asset.id])}
                          />
                        ) : (
                          <DriveAssetPreview mimeType={asset.mimeType} />
                        )}
                      </button>
                      <p className="truncate text-sm font-bold text-foreground">{asset.name}</p>
                      <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-muted">
                        Google Drive · {asset.mimeType}
                      </p>
                      {asset.createdTime && (
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                          Created {formatDriveDate(asset.createdTime)}
                        </p>
                      )}
                      {asset.modifiedTime && (
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                          Modified {formatDriveDate(asset.modifiedTime)}
                        </p>
                      )}
                      {asset.webViewLink && (
                        <a
                          href={asset.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-foreground"
                        >
                          Open in Drive <ExternalLink size={11} />
                        </a>
                      )}
                    </article>
                  ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-2xl"
            >
               <header className="mb-8 sm:mb-12 border-b border-border pb-8 sm:pb-12">
                  <div className="flex items-center gap-4 mb-4 sm:mb-6">
                     <div className="flex gap-0.5 text-black">
                        {[...Array(5)].map((_, i) => (
                          <Heart key={i} size={10} fill={(active.rating ?? 0) > i ? "currentColor" : "none"} className={(active.rating ?? 0) > i ? "" : "text-muted"} />
                        ))}
                     </div>
                     <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{tripName} Perspective</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">{active.title}</h1>
               </header>

               <div className="space-y-12 sm:space-y-16">
                  {/* Photo Section */}
                  {active.photosPlaceholder && (
                    <section className="relative aspect-video overflow-hidden rounded-2xl border border-border shadow-sm">
                       <img src={active.photosPlaceholder} alt="" className="h-full w-full object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </section>
                  )}

                  {/* Highlights */}
                  <section className="space-y-6">
                     <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                        <MessageSquare size={12} className="text-black" />
                        <span>Core Reflections</span>
                     </div>
                     <div className="space-y-8">
                        <div>
                           <h3 className="text-[10px] font-bold uppercase text-muted mb-2">Favorite Moments</h3>
                           <p className="text-lg font-medium leading-relaxed text-foreground">{active.favoriteMoments}</p>
                        </div>
                        <div>
                           <h3 className="text-[10px] font-bold uppercase text-muted mb-2 text-rose-600">Internal Memo</h3>
                           <p className="text-base leading-relaxed text-muted-2 italic">{active.notes}</p>
                        </div>
                     </div>
                  </section>
               </div>

               <footer className="mt-12 border-t border-border pt-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                     Journal entries are currently append-only.
                  </p>
               </footer>
            </motion.div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
               <Bookmark size={48} strokeWidth={1} />
               <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em]">Select an entry to view the archive</p>
            </div>
          )}
        </AnimatePresence>

        {previewAsset && classifyDriveAsset(previewAsset.mimeType) === "photo" && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={previewAsset.name}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-2 sm:p-4"
            onClick={() => setPreviewAssetId(null)}
          >
            <div className="relative flex max-h-[95vh] w-full max-w-5xl flex-col gap-3" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between gap-3 text-white px-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold uppercase tracking-tight">{previewAsset.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Google Drive Photo</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewAssetId(null)}
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white backdrop-blur-md transition-colors hover:bg-white/10"
                  aria-label="Close preview"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="relative min-h-[200px] flex-1 overflow-hidden rounded-xl bg-zinc-950 flex items-center justify-center">
                <Image
                  src={`/api/memories/assets/${previewAsset.id}/content`}
                  alt={previewAsset.name}
                  width={1600}
                  height={1200}
                  className="max-h-[80vh] w-full object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* Global Footer rail */}
        <footer className="mt-10 flex min-h-12 flex-wrap items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted sm:px-6">
           <div className="flex items-center gap-6">
              <span className="flex items-center gap-2"><Heart size={12} /> Local Storage Valid</span>
              <span className="text-foreground">USER: @marwanghostine</span>
           </div>
           <span>Design Intelligence: v2.0.4</span>
        </footer>
      </main>
    </div>
  );
}

type DriveAssetFilter = "all" | "photos" | "videos" | "documents";
type DriveAssetKind = "photo" | "video" | "document";

const DRIVE_ASSET_FILTERS: { id: DriveAssetFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "photos", label: "Photos" },
  { id: "videos", label: "Videos" },
  { id: "documents", label: "Documents" },
];

function classifyDriveAsset(mimeType: string): DriveAssetKind {
  if (mimeType.startsWith("image/")) return "photo";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

function DriveAssetPreview({ mimeType }: { mimeType: string }) {
  const kind = classifyDriveAsset(mimeType);
  const Icon = kind === "video" ? Video : kind === "document" ? FileText : ImageIcon;
  const label = kind === "video" ? "Video" : kind === "document" ? "Document" : "Photo";

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center">
      <Icon size={26} className="text-muted" />
      <span className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</span>
    </div>
  );
}

function formatDriveDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function driveStatusMessage(status: string, errorMessage?: string) {
  switch (status) {
    case "connected":
      return "Drive folder linked and synced.";
    case "synced":
      return "Drive folder sync complete.";
    case "disconnected":
      return "Drive folder disconnected.";
    case "reconnect-required":
      return "Reconnect Google to enable Drive previews.";
    case "invalid-folder":
      return "Use a valid Google Drive folder URL or folder ID.";
    case "connect-failed":
      return errorMessage ? `Link failed: ${errorMessage}` : "Could not link this Drive folder.";
    case "sync-failed":
      return errorMessage ? `Sync failed: ${errorMessage}` : "Could not refresh Drive folder metadata.";
    default:
      return status;
  }
}
