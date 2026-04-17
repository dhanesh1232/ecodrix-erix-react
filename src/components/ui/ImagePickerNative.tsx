"use client";

import {
  ArrowDownUp,
  Check,
  CheckSquare2,
  ClipboardCopy,
  FileText,
  Film,
  Grid2X2,
  ImagePlus,
  Link as LinkIcon,
  List,
  Loader2,
  Play,
  RotateCcw,
  Search,
  Square,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import * as React from "react";
import type { IconType } from "react-icons/lib";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Ecodrix } from "@ecodrix/erix-api";
import { useErixClient } from "@/context/ErixProvider";

export interface ImageVariants {
  thumb: string;
  medium: string;
  full: string;
  raw: string;
}

export interface ImageFormat {
  url: string;
  name?: string;
  type?: string;
  fileName?: string;
  key?: string;
  lastModified?: Date;
  size?: number;
  thumbnail?: string;
  used?: boolean;
  usageCount?: number;
  variants?: ImageVariants;
  usagePoints?: {
    category?: number;
    productFeatured?: number;
    productGallery?: number;
  };
}

export interface ImagePickerNativeProps {
  onInsert?: (url: ImageFormat[]) => void;
  selected?: ImageFormat[];
  aspectRatio?: "square" | "portrait" | "landscape" | "free";
  maxSize?: number;
  multiple?: boolean;
  open?: boolean;
  setOpen?: (value: boolean) => void;
  trigger?: boolean;
  className?: string;
  selectedImages?: ImageFormat[];
  icon?: IconType;
  size?: string;
  folder?: string;
  apiUrl?: string;
  apiKey?: string;
  clientCode?: string;
  variant?: "richtext" | "casual";
  children?: React.ReactNode;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number | undefined, decimals = 1) => {
  if (!bytes || !+bytes) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
};

const getDisplayName = (src: ImageFormat) => {
  let name = src.fileName || "";
  if (!name && src.url) {
    name = decodeURIComponent(src.url.split("/").pop() || "");
  }
  if (!name) return "";
  name = name.replace(/[_-]\d{13,}(\.[^.]+)?$/, (_, p1) => p1 || "");
  const dotIdx = name.lastIndexOf(".");
  const nameWithoutExt = dotIdx > 0 ? name.slice(0, dotIdx) : name;
  const ext = dotIdx > 0 ? name.slice(dotIdx + 1) : "";
  const cleanName = nameWithoutExt.replace(/[-_]/g, " ").trim();
  return ext ? `${cleanName}.${ext}` : cleanName;
};

const isImage = (src: ImageFormat) => {
  if (src.type === "image") return true;
  if (src.type?.startsWith("image/")) return true;
  if (src.url?.match(/\.(jpe?g|png|gif|webp|avif|svg)$/i)) return true;
  if (src.fileName?.match(/\.(jpe?g|png|gif|webp|avif|svg)$/i)) return true;
  return false;
};

const isPdf = (src: ImageFormat) => {
  if (src.type === "document") return true;
  if (src.type === "application/pdf") return true;
  if (src.url?.match(/\.pdf$/i)) return true;
  if (src.fileName?.match(/\.pdf$/i)) return true;
  return false;
};

const isVideo = (src: ImageFormat) => {
  if (src.type === "video") return true;
  if (src.type?.startsWith("video/")) return true;
  if (src.url?.match(/\.(mp4|webm|ogg|mov)$/i)) return true;
  if (src.fileName?.match(/\.(mp4|webm|ogg|mov)$/i)) return true;
  return false;
};

// ─── Skeleton Cards ──────────────────────────────────────────────────────────

const GridSkeleton = () => (
  <div className="erix-overflow-hidden erix-rounded-lg erix-border erix-border-border/40 erix-bg-muted/20 erix-animate-pulse">
    <div className="erix-aspect-square erix-bg-muted/60" />
    <div className="erix-px-2 erix-py-1.5 erix-bg-muted/20">
      <div className="erix-h-2 erix-w-2/3 erix-rounded erix-bg-muted-foreground/15" />
    </div>
  </div>
);

const ListSkeleton = () => (
  <div className="erix-flex erix-items-center erix-gap-3 erix-p-2.5 erix-rounded-lg erix-border erix-border-border/40 erix-bg-muted/10 erix-animate-pulse">
    <div className="erix-h-11 erix-w-11 erix-rounded-md erix-bg-muted/60 erix-shrink-0" />
    <div className="erix-flex-1 erix-space-y-2">
      <div className="erix-h-2.5 erix-w-1/2 erix-rounded erix-bg-muted-foreground/15" />
      <div className="erix-h-2 erix-w-1/4 erix-rounded erix-bg-muted-foreground/10" />
    </div>
  </div>
);

// ─── Media Thumbnail ─────────────────────────────────────────────────────────

const MediaThumb = ({
  src,
  index,
  mode,
}: {
  src: ImageFormat;
  index: number;
  mode: "grid" | "list";
}) => {
  const cls =
    mode === "grid"
      ? "erix-aspect-square erix-w-full"
      : "erix-h-11 erix-w-11 erix-shrink-0 erix-rounded-md erix-overflow-hidden";

  if (isPdf(src)) {
    return (
      <div
        className={cn(
          "erix-relative erix-flex erix-items-center erix-justify-center erix-bg-red-50 dark:erix-bg-red-950/30",
          cls,
          mode === "grid" && "erix-rounded-none",
        )}
      >
        <FileText className="erix-h-7 erix-w-7 erix-text-red-400" />
        <span className="erix-absolute erix-bottom-1.5 erix-right-1.5 erix-rounded erix-bg-red-500 erix-px-1 erix-py-0.5 erix-text-[8px] erix-font-bold erix-uppercase erix-tracking-widest erix-text-white">
          PDF
        </span>
      </div>
    );
  }

  if (isVideo(src)) {
    return (
      <div
        className={cn(
          "erix-relative erix-overflow-hidden erix-bg-black",
          cls,
          mode === "grid" && "erix-rounded-none",
        )}
      >
        <video
          src={src.url}
          className="erix-h-full erix-w-full erix-object-cover erix-opacity-80"
          muted
          onMouseOver={(e) => e.currentTarget.play()}
          onMouseOut={(e) => {
            e.currentTarget.pause();
            e.currentTarget.currentTime = 0;
          }}
        />
        <div className="erix-absolute erix-inset-0 erix-flex erix-items-center erix-justify-center">
          <div className="erix-rounded-full erix-bg-black/50 erix-p-1.5 erix-backdrop-blur-sm">
            <Play className="erix-h-3 erix-w-3 erix-fill-white erix-text-white" />
          </div>
        </div>
        <span className="erix-absolute erix-bottom-1 erix-left-1 erix-flex erix-items-center erix-gap-0.5 erix-rounded erix-bg-black/60 erix-px-1 erix-py-0.5 erix-backdrop-blur-sm">
          <Film className="erix-h-2.5 erix-w-2.5 erix-text-white" />
          <span className="erix-text-[8px] erix-font-bold erix-uppercase erix-text-white">
            VID
          </span>
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "erix-relative erix-overflow-hidden erix-bg-muted/40",
        cls,
        mode === "grid" && "erix-rounded-none",
      )}
    >
      <img
        width={mode === "grid" ? 200 : 48}
        height={mode === "grid" ? 200 : 48}
        loading="lazy"
        src={src.variants?.thumb ?? src.url ?? "/placeholder.png"}
        alt={src.name || `Media ${index}`}
        className="erix-h-full erix-w-full erix-object-cover erix-transition-transform erix-duration-300 group-hover:erix-scale-[1.05]"
      />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ImagePickerNative: React.FC<ImagePickerNativeProps> = ({
  onInsert,
  selected,
  maxSize = 50,
  multiple = false,
  open,
  setOpen,
  trigger = false,
  className,
  selectedImages: externalSelectedImages,
  icon: Icon = ImagePlus,
  size = "size-10",
  folder = "profile",
  apiUrl,
  apiKey,
  clientCode,
  variant = "casual",
  children,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [externalUrl, setExternalUrl] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [copyFeedback, setCopyFeedback] = React.useState<string | null>(null);

  // SDK init
  const contextSdk = React.useRef<Ecodrix | null>(null);
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    contextSdk.current = useErixClient();
  } catch (_) {}

  const sdk = React.useMemo(() => {
    if (contextSdk.current && !apiUrl && !apiKey) return contextSdk.current;
    if (!apiUrl || !apiKey) return contextSdk.current || null;
    return new Ecodrix({
      baseUrl: apiUrl,
      apiKey: apiKey,
      clientCode: clientCode || "default",
    });
  }, [contextSdk, apiUrl, apiKey, clientCode]);

  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = (val: boolean) => {
    if (setOpen) setOpen(val);
    setInternalOpen(val);
  };

  const [uploadingCount, setUploadingCount] = React.useState(0);
  const [deletingKeys, setDeletingKeys] = React.useState<string[]>([]);
  const [images, setImages] = React.useState<ImageFormat[]>([]);
  const [loadingImages, setLoadingImages] = React.useState(true);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [dragActive, setDragActive] = React.useState(false);
  const [filterType, setFilterType] = React.useState<
    "all" | "image" | "video" | "pdf"
  >("all");
  const [sortBy, setSortBy] = React.useState<"date" | "name" | "size">("date");
  const [selectedImages, setSelectedImage] = React.useState<ImageFormat[]>([]);
  const [isOverQuota, setIsOverQuota] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>("library");

  // Sync external selection
  React.useEffect(() => {
    if (open) {
      setSelectedImage(selected ? [...selected] : []);
    } else {
      setSelectedImage([]);
      setSearchQuery("");
      setFilterType("all");
    }
  }, [selected, open]);

  React.useEffect(() => {
    if (open && externalSelectedImages) {
      setSelectedImage([...externalSelectedImages]);
    }
  }, [externalSelectedImages, open]);

  // Fetch library
  const fetchImages = React.useCallback(async () => {
    try {
      setLoadingImages(true);
      if (!sdk) {
        console.warn("[MediaPicker] SDK client not initialized.");
        setLoadingImages(false);
        return;
      }
      const resolvedClientCode =
        clientCode && clientCode !== "default" ? clientCode : null;
      if (!resolvedClientCode) {
        console.warn("[MediaPicker] No valid clientCode.");
        setLoadingImages(false);
        return;
      }
      const res = await sdk.media.list(folder, { q: searchQuery });
      const imgs = (res as any).data?.images ?? [];
      const overQuota = !!(res as any).data?.isOverQuota;
      setImages(imgs);
      setIsOverQuota(overQuota);
    } catch (err: any) {
      console.error("[MediaPicker] Fetch Error:", err);
    } finally {
      setLoadingImages(false);
    }
  }, [sdk, folder, searchQuery, clientCode]);

  React.useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Filter + Sort
  const filteredImages = React.useMemo(() => {
    let list = images.filter((img) => {
      if (searchQuery) {
        const displayName = getDisplayName(img).toLowerCase();
        if (!displayName.includes(searchQuery.toLowerCase())) return false;
      }
      if (filterType === "all") return true;
      if (filterType === "image") return isImage(img);
      if (filterType === "video") return isVideo(img);
      if (filterType === "pdf") return isPdf(img);
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "name") {
        return getDisplayName(a).localeCompare(getDisplayName(b));
      }
      if (sortBy === "size") {
        return (b.size ?? 0) - (a.size ?? 0);
      }
      // date: newest first (default)
      return (
        new Date(b.lastModified ?? 0).getTime() -
        new Date(a.lastModified ?? 0).getTime()
      );
    });

    return list;
  }, [images, filterType, searchQuery, sortBy]);

  const handleSelectAll = () => {
    if ((selectedImages?.length ?? 0) >= images.length && images.length > 0) {
      setSelectedImage([]);
    } else {
      setSelectedImage([...images]);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || isOverQuota) return;

    const validFiles = files.filter((file) => {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`${file.name} exceeds the ${maxSize}MB limit.`);
        return false;
      }
      const ok = ["image/", "video/", "application/pdf"].some((t) =>
        file.type.startsWith(t),
      );
      if (!ok) {
        alert(`${file.name}: unsupported format.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadingCount(validFiles.length);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      if (!sdk) throw new Error("SDK not initialized");
      for (const file of validFiles) {
        setUploadingCount((prev) => prev + 1);
        const { data: result } = await sdk.media.upload(file, {
          folder,
          filename: file.name,
          contentType: file.type,
        });
        setImages((prev) => [result, ...prev]);
        if (multiple) {
          setSelectedImage((prev) => [...(prev || []), result]);
        } else {
          setSelectedImage([result]);
        }
        setUploadingCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      console.error("[MediaPicker] Upload Error:", err);
      alert(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadingCount(0);
      setUploadProgress(0);
      e.target.value = "";
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      handleUpload({
        target: { files },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleSelectImage = (image: ImageFormat) => {
    if (multiple) {
      setSelectedImage((prev) =>
        prev?.some((item) => item.url === image.url)
          ? prev.filter((item) => item.url !== image.url)
          : [...(prev || []), image],
      );
    } else {
      setSelectedImage([image]);
    }
  };

  const isSelected = (src: ImageFormat) =>
    !!selectedImages?.find((i) => i?.url === src?.url);

  const handleDeleteMedia = async (e: React.MouseEvent, src: ImageFormat) => {
    e.stopPropagation();
    if (!src.key || !sdk)
      return alert("Cannot delete: missing media key or SDK.");
    if (!confirm("Permanently delete this file?")) return;
    try {
      setDeletingKeys((prev) => [...prev, src.key!]);
      await sdk.media.delete(src.key);
      setImages((prev) => prev.filter((img) => img.key !== src.key));
      setSelectedImage((prev) => prev?.filter((img) => img.key !== src.key));
    } catch (err: any) {
      console.error("[MediaPicker] Delete Error:", err);
      alert(err.message || "Delete failed");
    } finally {
      setDeletingKeys((prev) => prev.filter((key) => key !== src.key));
    }
  };

  const handleCopyUrl = (e: React.MouseEvent, src: ImageFormat) => {
    e.stopPropagation();
    navigator.clipboard.writeText(src.url).then(() => {
      setCopyFeedback(src.url);
      setTimeout(() => setCopyFeedback(null), 1800);
    });
  };

  const selCount = selectedImages?.length ?? 0;
  const allSelected = images.length > 0 && selCount === images.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : trigger ? (
        <DialogTrigger asChild>
          <Button
            role="button"
            variant="dashed"
            size="sm"
            aria-label="Upload Image"
            className={cn(
              "erix-h-inherit erix-flex erix-h-full erix-w-full erix-cursor-pointer erix-items-center erix-justify-center erix-border erix-border-dashed focus-visible:erix-ring-0",
              className,
            )}
            pointer
          >
            <Icon className={cn(size, "erix-text-primary/70")} />
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="erix-flex erix-h-[88vh] erix-max-w-[800px] erix-flex-col erix-gap-0 erix-overflow-hidden erix-rounded-2xl erix-p-0 erix-shadow-2xl">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="erix-flex erix-h-full erix-min-h-0 erix-flex-col"
        >
          {/* ═══ STABLE HEADER ═══ */}
          <div className="erix-shrink-0 erix-border-b erix-border-border/50 erix-bg-background">
            {/* Top row */}
            <div className="erix-flex erix-items-center erix-justify-between erix-gap-3 erix-px-5 erix-py-3">
              {/* Left: icon + title + count */}
              <div className="erix-flex erix-min-w-0 erix-shrink-0 erix-items-center erix-gap-2.5">
                <div className="erix-flex erix-h-7 erix-w-7 erix-shrink-0 erix-items-center erix-justify-center erix-rounded-lg erix-bg-primary/10">
                  <ImagePlus className="erix-h-3.5 erix-w-3.5 erix-text-primary" />
                </div>
                <DialogTitle className="erix-whitespace-nowrap erix-text-sm erix-font-semibold erix-leading-none erix-tracking-tight">
                  {activeTab === "library"
                    ? "Media Library"
                    : "Insert from URL"}
                </DialogTitle>
                {activeTab === "library" &&
                  !loadingImages &&
                  images.length > 0 && (
                    <span className="erix-rounded-full erix-bg-primary/10 erix-px-2 erix-py-0.5 erix-text-[10px] erix-font-semibold erix-text-primary">
                      {images.length}
                    </span>
                  )}
              </div>

              {/* Center: custom tab switcher */}
              {variant === "richtext" && (
                <div className="erix-flex erix-h-8 erix-items-center erix-rounded-lg erix-border erix-border-border/60 erix-bg-muted/50 erix-p-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("library")}
                    className={cn(
                      "erix-flex erix-h-7 erix-items-center erix-gap-1.5 erix-rounded-md erix-px-3 erix-text-[11px] erix-font-semibold erix-transition-all erix-duration-150",
                      activeTab === "library"
                        ? "erix-bg-background erix-text-foreground erix-shadow-sm"
                        : "erix-text-muted-foreground hover:erix-text-foreground",
                    )}
                  >
                    <ImagePlus className="erix-h-3 erix-w-3" />
                    Library
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("url")}
                    className={cn(
                      "erix-flex erix-h-7 erix-items-center erix-gap-1.5 erix-rounded-md erix-px-3 erix-text-[11px] erix-font-semibold erix-transition-all erix-duration-150",
                      activeTab === "url"
                        ? "erix-bg-background erix-text-foreground erix-shadow-sm"
                        : "erix-text-muted-foreground hover:erix-text-foreground",
                    )}
                  >
                    <LinkIcon className="erix-h-3 erix-w-3" />
                    URL
                  </button>
                </div>
              )}

              {/* Right: toolbar (fades on URL tab) */}
              <div
                className={cn(
                  "erix-flex erix-shrink-0 erix-items-center erix-gap-1 erix-transition-opacity erix-duration-200",
                  activeTab !== "library" &&
                    "erix-pointer-events-none erix-opacity-0",
                )}
              >
                {/* Select all — multi mode */}
                {multiple && images.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="erix-flex erix-h-7 erix-items-center erix-gap-1.5 erix-rounded-md erix-border erix-border-border erix-px-2.5 erix-text-[11px] erix-font-medium erix-text-muted-foreground erix-transition-colors hover:erix-bg-accent hover:erix-text-foreground"
                  >
                    {allSelected ? (
                      <CheckSquare2 className="erix-h-3.5 erix-w-3.5 erix-text-primary" />
                    ) : (
                      <Square className="erix-h-3.5 erix-w-3.5" />
                    )}
                    {allSelected ? "Deselect all" : "Select all"}
                  </button>
                )}

                <div className="erix-mx-1 erix-h-4 erix-w-px erix-bg-border" />

                {/* Sort */}
                <Select
                  value={sortBy}
                  onValueChange={(v) =>
                    setSortBy(v as "date" | "name" | "size")
                  }
                >
                  <SelectTrigger className="erix-h-7 erix-w-7 erix-border-0 erix-bg-transparent erix-p-0 erix-shadow-none erix-text-muted-foreground hover:erix-text-foreground focus:erix-ring-0">
                    <ArrowDownUp className="erix-h-3.5 erix-w-3.5" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="date" className="erix-text-xs">
                      Newest first
                    </SelectItem>
                    <SelectItem value="name" className="erix-text-xs">
                      Name A–Z
                    </SelectItem>
                    <SelectItem value="size" className="erix-text-xs">
                      Largest first
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Refresh */}
                <button
                  onClick={fetchImages}
                  disabled={loadingImages}
                  title="Refresh library"
                  className="erix-flex erix-h-7 erix-w-7 erix-items-center erix-justify-center erix-rounded-md erix-text-muted-foreground erix-transition-colors hover:erix-bg-muted hover:erix-text-foreground disabled:erix-opacity-40"
                >
                  {loadingImages ? (
                    <Loader2 className="erix-h-3.5 erix-w-3.5 erix-animate-spin" />
                  ) : (
                    <RotateCcw className="erix-h-3.5 erix-w-3.5" />
                  )}
                </button>

                {/* View toggle */}
                <div className="erix-flex erix-h-7 erix-items-center erix-rounded-md erix-border erix-border-border erix-bg-muted/40 erix-p-0.5">
                  <button
                    onClick={() => setViewMode("grid")}
                    title="Grid view"
                    className={cn(
                      "erix-flex erix-h-5 erix-w-6 erix-items-center erix-justify-center erix-rounded-sm erix-transition-all",
                      viewMode === "grid"
                        ? "erix-bg-background erix-text-foreground erix-shadow-sm"
                        : "erix-text-muted-foreground hover:erix-text-foreground",
                    )}
                  >
                    <Grid2X2 className="erix-h-3 erix-w-3" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    title="List view"
                    className={cn(
                      "erix-flex erix-h-5 erix-w-6 erix-items-center erix-justify-center erix-rounded-sm erix-transition-all",
                      viewMode === "list"
                        ? "erix-bg-background erix-text-foreground erix-shadow-sm"
                        : "erix-text-muted-foreground hover:erix-text-foreground",
                    )}
                  >
                    <List className="erix-h-3 erix-w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Search + filter — library only */}
            {activeTab === "library" && (
              <div className="erix-flex erix-items-center erix-gap-2 erix-px-5 erix-pb-3">
                <div className="erix-relative erix-flex-1">
                  <Search className="erix-pointer-events-none erix-absolute erix-left-2.5 erix-top-1/2 erix-h-3.5 erix-w-3.5 -erix-translate-y-1/2 erix-text-muted-foreground/60" />
                  <input
                    type="search"
                    placeholder="Search files…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="erix-h-8 erix-w-full erix-rounded-lg erix-border erix-border-border erix-bg-muted/30 erix-pl-8 erix-pr-3 erix-text-xs placeholder:erix-text-muted-foreground/50 focus:erix-border-primary focus:erix-bg-background focus:erix-outline-none focus:erix-ring-2 focus:erix-ring-primary/20"
                  />
                </div>
                <Select
                  value={filterType}
                  onValueChange={(val: "all" | "image" | "video" | "pdf") =>
                    setFilterType(val)
                  }
                >
                  <SelectTrigger
                    size="sm"
                    className="erix-h-8 erix-w-[104px] erix-rounded-lg erix-border-border erix-text-[11px] erix-font-medium"
                  >
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="erix-text-xs">
                      All types
                    </SelectItem>
                    <SelectItem value="image" className="erix-text-xs">
                      Images
                    </SelectItem>
                    <SelectItem value="video" className="erix-text-xs">
                      Videos
                    </SelectItem>
                    <SelectItem value="pdf" className="erix-text-xs">
                      PDFs
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* ═══ LIBRARY TAB ═══ */}
          <TabsContent
            value="library"
            className="erix-mt-0 erix-flex erix-min-h-0 erix-flex-1 erix-flex-col erix-overflow-hidden data-[state=inactive]:erix-hidden"
          >
            <div className="erix-flex-1 erix-overflow-y-auto erix-bg-muted/10 erix-p-4 erix-space-y-4">
              {/* Upload zone */}
              <div
                className={cn(
                  "erix-relative erix-flex erix-flex-col erix-items-center erix-justify-center erix-gap-3 erix-rounded-xl erix-border-2 erix-border-dashed erix-px-5 erix-py-7 erix-transition-all erix-duration-200",
                  dragActive
                    ? "erix-border-primary erix-bg-primary/5 erix-scale-[1.005] erix-shadow-[0_0_0_4px_rgba(var(--primary),.08)]"
                    : "erix-border-border/50 erix-bg-background/60 hover:erix-border-primary/50 hover:erix-bg-primary/[0.02]",
                  (isUploading || isOverQuota) &&
                    "erix-pointer-events-none erix-opacity-70",
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {isOverQuota ? (
                  <div className="erix-flex erix-flex-col erix-items-center erix-gap-2 erix-text-center">
                    <div className="erix-flex erix-h-10 erix-w-10 erix-items-center erix-justify-center erix-rounded-full erix-border erix-border-destructive/30 erix-bg-destructive/10">
                      <X className="erix-h-5 erix-w-5 erix-text-destructive" />
                    </div>
                    <p className="erix-text-sm erix-font-semibold erix-text-destructive">
                      Storage limit reached
                    </p>
                    <p className="erix-text-xs erix-text-muted-foreground">
                      Free up space or upgrade to continue uploading
                    </p>
                  </div>
                ) : isUploading ? (
                  <div className="erix-flex erix-w-full erix-max-w-xs erix-flex-col erix-items-center erix-gap-3">
                    <div className="erix-relative erix-flex erix-h-12 erix-w-12 erix-items-center erix-justify-center">
                      <div className="erix-absolute erix-inset-0 erix-animate-ping erix-rounded-full erix-bg-primary/20" />
                      <div className="erix-flex erix-h-12 erix-w-12 erix-items-center erix-justify-center erix-rounded-full erix-bg-primary/10">
                        <Loader2 className="erix-h-5 erix-w-5 erix-animate-spin erix-text-primary" />
                      </div>
                    </div>
                    <div className="erix-w-full">
                      <div className="erix-mb-1.5 erix-flex erix-justify-between erix-text-xs">
                        <span className="erix-font-medium">
                          Uploading {uploadingCount} file
                          {uploadingCount !== 1 ? "s" : ""}…
                        </span>
                        <span className="erix-tabular-nums erix-text-muted-foreground">
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="erix-h-1.5 erix-w-full erix-overflow-hidden erix-rounded-full erix-bg-muted">
                        <div
                          className="erix-h-full erix-rounded-full erix-bg-primary erix-transition-all erix-duration-500"
                          style={{ width: `${uploadProgress || 40}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="erix-group/upload erix-flex erix-h-11 erix-w-11 erix-cursor-pointer erix-items-center erix-justify-center erix-rounded-xl erix-border erix-border-primary/20 erix-bg-primary/8 erix-transition-all hover:erix-scale-105 hover:erix-border-primary/40 hover:erix-bg-primary/15"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud className="erix-h-5 erix-w-5 erix-text-primary erix-transition-transform group-hover/upload:-erix-translate-y-0.5" />
                    </div>
                    <div className="erix-text-center">
                      <p className="erix-text-sm erix-font-medium erix-text-foreground/80">
                        Drop files here, or{" "}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="erix-font-semibold erix-text-primary hover:erix-underline erix-underline-offset-2"
                        >
                          browse
                        </button>
                      </p>
                      <p className="erix-mt-1 erix-text-[11px] erix-text-muted-foreground">
                        Images · Videos · PDFs — max {maxSize} MB each
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,application/pdf"
                      multiple
                      onChange={handleUpload}
                      className="erix-hidden"
                    />
                  </>
                )}
              </div>

              {/* Gallery label */}
              {!loadingImages && images.length > 0 && (
                <div className="erix-flex erix-items-center erix-gap-2">
                  <span className="erix-text-[10px] erix-font-bold erix-uppercase erix-tracking-widest erix-text-muted-foreground/50">
                    Library
                  </span>
                  {images.length !== filteredImages.length && (
                    <span className="erix-text-[10px] erix-text-muted-foreground/50">
                      {filteredImages.length} of {images.length}
                    </span>
                  )}
                </div>
              )}

              {/* Gallery */}
              {loadingImages ? (
                <div
                  className={cn(
                    viewMode === "grid"
                      ? "erix-grid erix-grid-cols-3 sm:erix-grid-cols-4 erix-gap-2"
                      : "erix-space-y-1.5",
                  )}
                >
                  {[...Array(viewMode === "grid" ? 12 : 5)].map((_, i) =>
                    viewMode === "grid" ? (
                      <GridSkeleton key={i} />
                    ) : (
                      <ListSkeleton key={i} />
                    ),
                  )}
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="erix-flex erix-flex-col erix-items-center erix-justify-center erix-py-12 erix-text-center">
                  <div className="erix-mb-3 erix-flex erix-h-12 erix-w-12 erix-items-center erix-justify-center erix-rounded-2xl erix-border erix-border-border/40 erix-bg-gradient-to-b erix-from-muted/60 erix-to-muted/20">
                    {searchQuery || filterType !== "all" ? (
                      <Search className="erix-h-5 erix-w-5 erix-text-muted-foreground/40" />
                    ) : (
                      <ImagePlus className="erix-h-5 erix-w-5 erix-text-muted-foreground/30" />
                    )}
                  </div>
                  <p className="erix-text-[13px] erix-font-semibold erix-text-foreground/55">
                    {searchQuery || filterType !== "all"
                      ? "No matching files"
                      : "Library is empty"}
                  </p>
                  <p className="erix-mt-1 erix-max-w-[180px] erix-text-[11px] erix-leading-relaxed erix-text-muted-foreground/60">
                    {searchQuery || filterType !== "all"
                      ? "Try adjusting your search or filters."
                      : "Drop files in the zone above to get started."}
                  </p>
                  {(searchQuery || filterType !== "all") && (
                    <button
                      className="erix-mt-2.5 erix-text-xs erix-font-semibold erix-text-primary hover:erix-underline erix-underline-offset-2"
                      onClick={() => {
                        setSearchQuery("");
                        setFilterType("all");
                      }}
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={cn(
                    viewMode === "grid"
                      ? "erix-grid erix-grid-cols-3 sm:erix-grid-cols-4 erix-gap-2"
                      : "erix-space-y-1.5",
                  )}
                >
                  {/* Upload skeletons */}
                  {isUploading &&
                    [...Array(uploadingCount)].map((_, i) =>
                      viewMode === "grid" ? (
                        <GridSkeleton key={`up-${i}`} />
                      ) : (
                        <ListSkeleton key={`up-${i}`} />
                      ),
                    )}

                  {filteredImages.map((src, i) => {
                    const isDeleting =
                      src.key && deletingKeys.includes(src.key);
                    const selected = isSelected(src);
                    const displayName = getDisplayName(src);
                    const isCopied = copyFeedback === src.url;

                    if (isDeleting) {
                      return viewMode === "grid" ? (
                        <GridSkeleton key={src.key || i} />
                      ) : (
                        <ListSkeleton key={src.key || i} />
                      );
                    }

                    if (viewMode === "list") {
                      return (
                        <div
                          key={src.key || i}
                          onClick={() => handleSelectImage(src)}
                          className={cn(
                            "erix-group erix-flex erix-cursor-pointer erix-items-center erix-gap-3 erix-rounded-xl erix-border erix-p-2.5 erix-transition-all erix-duration-150",
                            selected
                              ? "erix-border-primary/50 erix-bg-primary/5 erix-ring-1 erix-ring-primary/20"
                              : "erix-border-border/50 erix-bg-background hover:erix-border-border hover:erix-bg-accent/30",
                          )}
                        >
                          <MediaThumb src={src} index={i} mode="list" />
                          <div className="erix-min-w-0 erix-flex-1">
                            <p
                              className="erix-truncate erix-text-xs erix-font-medium erix-text-foreground"
                              title={displayName}
                            >
                              {displayName || `Media ${i + 1}`}
                            </p>
                            <div className="erix-mt-0.5 erix-flex erix-items-center erix-gap-2">
                              <p className="erix-text-[10px] erix-text-muted-foreground">
                                {src.size ? formatBytes(src.size) : "—"}
                                {src.lastModified &&
                                  ` · ${new Date(src.lastModified).toLocaleDateString()}`}
                              </p>
                              {(src.usageCount ?? 0) > 0 && (
                                <span className="erix-rounded erix-bg-muted erix-px-1.5 erix-py-0.5 erix-text-[9px] erix-font-semibold erix-text-muted-foreground">
                                  Used {src.usageCount}×
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="erix-flex erix-shrink-0 erix-items-center erix-gap-1 erix-pr-0.5 erix-opacity-0 erix-transition-opacity group-hover:erix-opacity-100">
                            <button
                              onClick={(e) => handleCopyUrl(e, src)}
                              className="erix-rounded-md erix-p-1.5 erix-text-muted-foreground erix-transition-colors hover:erix-bg-muted hover:erix-text-foreground"
                              title="Copy URL"
                            >
                              {isCopied ? (
                                <Check className="erix-h-3 erix-w-3 erix-text-green-500" />
                              ) : (
                                <ClipboardCopy className="erix-h-3 erix-w-3" />
                              )}
                            </button>
                            <button
                              onClick={(e) => handleDeleteMedia(e, src)}
                              className="erix-rounded-md erix-p-1.5 erix-text-muted-foreground erix-transition-colors hover:erix-bg-destructive/10 hover:erix-text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="erix-h-3 erix-w-3" />
                            </button>
                          </div>
                          <div
                            className={cn(
                              "erix-flex erix-h-5 erix-w-5 erix-shrink-0 erix-items-center erix-justify-center erix-rounded-full erix-border-2 erix-transition-all",
                              selected
                                ? "erix-border-primary erix-bg-primary erix-text-white"
                                : "erix-border-border/60 erix-bg-background",
                            )}
                          >
                            {selected && (
                              <Check className="erix-h-2.5 erix-w-2.5" />
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Grid view
                    return (
                      <div
                        key={src.key || i}
                        onClick={() => handleSelectImage(src)}
                        className={cn(
                          "erix-group erix-relative erix-cursor-pointer erix-overflow-hidden erix-rounded-xl erix-border erix-transition-all erix-duration-150",
                          selected
                            ? "erix-border-primary erix-ring-2 erix-ring-primary/30 erix-ring-offset-1"
                            : "erix-border-border/40 hover:erix-border-primary/50 hover:erix-shadow-sm",
                        )}
                      >
                        <MediaThumb src={src} index={i} mode="grid" />

                        {/* Hover overlay */}
                        <div
                          className={cn(
                            "erix-absolute erix-inset-0 erix-bg-gradient-to-t erix-from-black/30 erix-to-transparent erix-opacity-0 erix-transition-opacity erix-duration-150 group-hover:erix-opacity-100",
                            selected && "erix-bg-primary/15 erix-opacity-100",
                          )}
                        />

                        {/* Top actions */}
                        <div className="erix-absolute erix-left-1.5 erix-top-1.5 erix-z-10 erix-flex erix-gap-1 erix-opacity-0 erix-transition-all group-hover:erix-opacity-100">
                          <button
                            onClick={(e) => handleCopyUrl(e, src)}
                            className="erix-flex erix-h-6 erix-w-6 erix-items-center erix-justify-center erix-rounded-full erix-bg-black/50 erix-text-white erix-backdrop-blur-sm erix-transition-colors hover:erix-bg-black/70"
                            title="Copy URL"
                          >
                            {isCopied ? (
                              <Check className="erix-h-2.5 erix-w-2.5 erix-text-green-400" />
                            ) : (
                              <ClipboardCopy className="erix-h-2.5 erix-w-2.5" />
                            )}
                          </button>
                          <button
                            onClick={(e) => handleDeleteMedia(e, src)}
                            className="erix-flex erix-h-6 erix-w-6 erix-items-center erix-justify-center erix-rounded-full erix-bg-black/50 erix-text-white erix-backdrop-blur-sm erix-transition-colors hover:erix-bg-red-500"
                            title="Delete"
                          >
                            <Trash2 className="erix-h-2.5 erix-w-2.5" />
                          </button>
                        </div>

                        {/* Selection badge */}
                        <div
                          className={cn(
                            "erix-absolute erix-right-1.5 erix-top-1.5 erix-z-10 erix-flex erix-h-5 erix-w-5 erix-items-center erix-justify-center erix-rounded-full erix-border-2 erix-transition-all",
                            selected
                              ? "erix-border-primary erix-bg-primary erix-text-white erix-shadow"
                              : "erix-border-white/60 erix-bg-black/25 erix-backdrop-blur-sm erix-opacity-0 group-hover:erix-opacity-100",
                          )}
                        >
                          {selected && (
                            <Check className="erix-h-2.5 erix-w-2.5" />
                          )}
                        </div>

                        {/* Usage badge */}
                        {(src.usageCount ?? 0) > 0 && (
                          <div className="erix-absolute erix-bottom-6 erix-right-1.5 erix-z-10">
                            <span className="erix-rounded erix-bg-black/50 erix-px-1 erix-py-0.5 erix-text-[8px] erix-font-bold erix-text-white erix-backdrop-blur-sm">
                              ×{src.usageCount}
                            </span>
                          </div>
                        )}

                        {/* Filename */}
                        <div className="erix-border-t erix-border-border/30 erix-bg-background/95 erix-px-2 erix-py-1">
                          <p
                            className="erix-truncate erix-text-[9px] erix-font-medium erix-text-muted-foreground"
                            title={displayName}
                          >
                            {displayName || `Media ${i + 1}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ═══ URL TAB ═══ */}
          {variant === "richtext" && (
            <TabsContent
              value="url"
              className="erix-mt-0 erix-flex erix-min-h-0 erix-flex-1 erix-flex-col erix-overflow-y-auto data-[state=inactive]:erix-hidden"
            >
              <div className="erix-flex erix-flex-1 erix-flex-col erix-items-center erix-justify-center erix-gap-6 erix-px-8 erix-py-10">
                <div className="erix-flex erix-h-14 erix-w-14 erix-items-center erix-justify-center erix-rounded-2xl erix-border erix-border-border/40 erix-bg-gradient-to-b erix-from-muted/60 erix-to-muted/20">
                  <LinkIcon className="erix-h-6 erix-w-6 erix-text-muted-foreground/60" />
                </div>
                <div className="erix-max-w-sm erix-text-center">
                  <h3 className="erix-text-sm erix-font-semibold">
                    Insert from External URL
                  </h3>
                  <p className="erix-mt-1.5 erix-text-xs erix-leading-relaxed erix-text-muted-foreground">
                    Paste a publicly accessible image URL. HTTPS recommended.
                  </p>
                </div>
                <div className="erix-w-full erix-max-w-md erix-space-y-3">
                  <label className="erix-block erix-text-[11px] erix-font-semibold erix-uppercase erix-tracking-wide erix-text-muted-foreground">
                    Image URL
                  </label>
                  <div className="erix-relative">
                    <LinkIcon className="erix-pointer-events-none erix-absolute erix-left-3 erix-top-1/2 erix-h-3.5 erix-w-3.5 -erix-translate-y-1/2 erix-text-muted-foreground/50" />
                    <Input
                      className="erix-h-9 erix-pl-9 erix-text-xs"
                      placeholder="https://example.com/image.png"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && externalUrl) {
                          onInsert?.([{ url: externalUrl } as ImageFormat]);
                          handleOpenChange(false);
                          setExternalUrl("");
                        }
                      }}
                    />
                  </div>

                  {/* Live preview */}
                  {externalUrl && (
                    <div className="erix-overflow-hidden erix-rounded-xl erix-border erix-border-border/50 erix-bg-muted/20">
                      <div className="erix-flex erix-items-center erix-justify-between erix-px-3 erix-py-2 erix-border-b erix-border-border/30">
                        <span className="erix-text-[10px] erix-font-bold erix-uppercase erix-tracking-widest erix-text-muted-foreground/60">
                          Preview
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            navigator.clipboard.writeText(externalUrl);
                          }}
                          className="erix-flex erix-items-center erix-gap-1 erix-text-[10px] erix-text-muted-foreground hover:erix-text-foreground"
                        >
                          <ClipboardCopy className="erix-h-3 erix-w-3" />
                          Copy
                        </button>
                      </div>
                      <div className="erix-flex erix-min-h-[100px] erix-items-center erix-justify-center erix-bg-[image:repeating-conic-gradient(theme(colors.muted.DEFAULT/15)_0%_25%,transparent_0%_50%)] erix-bg-[length:16px_16px]">
                        <img
                          src={externalUrl}
                          alt="URL preview"
                          className="erix-max-h-40 erix-max-w-full erix-object-contain erix-shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          )}

          {/* ═══ STABLE FOOTER ═══ */}
          <DialogFooter className="erix-shrink-0 erix-border-t erix-border-border/50 erix-bg-background erix-px-5 erix-py-3">
            {activeTab === "library" ? (
              <div className="erix-flex erix-w-full erix-items-center erix-justify-between erix-gap-3">
                {/* Selection indicator */}
                <div>
                  {selCount > 0 ? (
                    <div className="erix-flex erix-items-center erix-gap-2">
                      <div className="erix-flex erix-h-5 erix-w-5 erix-items-center erix-justify-center erix-rounded-full erix-bg-primary erix-text-white">
                        <Check className="erix-h-3 erix-w-3" />
                      </div>
                      <span className="erix-text-xs erix-font-semibold erix-text-foreground">
                        {selCount} file{selCount > 1 ? "s" : ""} selected
                      </span>
                      {multiple && selCount > 1 && (
                        <button
                          onClick={() => setSelectedImage([])}
                          className="erix-text-[10px] erix-text-muted-foreground hover:erix-text-foreground"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="erix-text-xs erix-text-muted-foreground">
                      {images.length > 0
                        ? "Click a file to select"
                        : "No files in library"}
                    </span>
                  )}
                </div>
                {/* Actions */}
                <div className="erix-flex erix-items-center erix-gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="erix-h-8 erix-px-4 erix-text-xs"
                    onClick={() => {
                      handleOpenChange(false);
                      setSelectedImage([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={!selCount || isUploading}
                    onClick={() => {
                      onInsert?.(selectedImages!);
                      handleOpenChange(false);
                      setSelectedImage([]);
                    }}
                    className="erix-h-8 erix-gap-1.5 erix-px-5 erix-text-xs"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="erix-h-3.5 erix-w-3.5 erix-animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <Check className="erix-h-3.5 erix-w-3.5" />
                        {selCount > 0
                          ? `Use ${selCount} file${selCount > 1 ? "s" : ""}`
                          : "Select files"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="erix-flex erix-w-full erix-items-center erix-justify-between erix-gap-3">
                <span className="erix-text-xs erix-text-muted-foreground">
                  Press Enter or click Insert URL
                </span>
                <div className="erix-flex erix-items-center erix-gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="erix-h-8 erix-px-4 erix-text-xs"
                    onClick={() => {
                      handleOpenChange(false);
                      setExternalUrl("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={!externalUrl}
                    onClick={() => {
                      onInsert?.([{ url: externalUrl } as ImageFormat]);
                      handleOpenChange(false);
                      setExternalUrl("");
                    }}
                    className="erix-h-8 erix-gap-1.5 erix-px-5 erix-text-xs"
                  >
                    <LinkIcon className="erix-h-3.5 erix-w-3.5" />
                    Insert URL
                  </Button>
                </div>
              </div>
            )}
          </DialogFooter>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
