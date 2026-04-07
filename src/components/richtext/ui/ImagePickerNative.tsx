// src/components/richtext/ui/ImagePickerNative.tsx
"use client";

import {
  CheckCircle2,
  ExternalLink,
  FileImage,
  Grid2X2,
  Image as ImageIcon,
  Link as LinkIcon,
  List,
  Loader2,
  Search,
  Trash2,
  Upload,
  UploadCloud,
} from "lucide-react";
import * as React from "react";
import { useErixEditor, useErixStyle } from "@/context/editor";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number | undefined, decimals = 1) => {
  if (!bytes || !+bytes) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
};

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
  usagePoints?: {
    category?: number;
    productFeatured?: number;
    productGallery?: number;
  };
}

const getDisplayName = (src: ImageFormat) => {
  let name = src.fileName || src.name || "";
  if (!name && src.url) {
    name = decodeURIComponent(src.url.split("/").pop() || "");
  }
  if (!name) return "Unnamed Media";
  name = name.replace(/[_-]\d{13,}(\.[^.]+)?$/, (_, p1) => p1 || "");
  const dotIdx = name.lastIndexOf(".");
  const nameWithoutExt = dotIdx > 0 ? name.slice(0, dotIdx) : name;
  const ext = dotIdx > 0 ? name.slice(dotIdx + 1) : "";
  const cleanName = nameWithoutExt.replace(/[-_]/g, " ").trim();
  return ext ? `${cleanName}.${ext}` : cleanName;
};

// ─── Skeleton ──────────────────────────────────────────────────────────────

const GallerySkeleton = ({ mode }: { mode: "erix-grid" | "list" }) => (
  <div
    className={cn(
      mode === "erix-grid"
        ? "erix-grid erix-grid-cols-3 erix-gap-3"
        : "erix-space-y-2",
    )}
  >
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className={cn(
          "erix-bg-muted erix-animate-pulse erix-rounded-lg",
          mode === "erix-grid" ? "erix-aspect-square" : "erix-h-12 erix-w-full",
        )}
      />
    ))}
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const ImagePickerNative: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const {
    imagePickerVisible,
    setImagePickerVisible,
    engine,
    apiKey,
    apiUrl,
    clientCode,
  } = useErixEditor();
  const { popoverRadius, buttonRadius, shadowClass } = useErixStyle();

  const [tab, setTab] = React.useState("library");

  // Selection Metadata
  const [selectedImage, setSelectedImage] = React.useState<ImageFormat | null>(
    null,
  );
  const [url, setUrl] = React.useState("");
  const [alt, setAlt] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");

  // Gallery State
  const [images, setImages] = React.useState<ImageFormat[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  // Upload State
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isOverQuota, setIsOverQuota] = React.useState(false);

  // ── SDK Bridge ──

  const fetchLibrary = React.useCallback(async () => {
    if (!apiUrl || !apiKey || !imagePickerVisible) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${apiUrl}/api/saas/images?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            "x-api-key": apiKey,
            "x-client-code": clientCode || "default",
          },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setImages(json.data.images || []);
      setIsOverQuota(!!json.data.isOverQuota);
    } catch (err) {
      console.error("Fetch Library Error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, apiKey, clientCode, searchQuery, imagePickerVisible]);

  React.useEffect(() => {
    if (imagePickerVisible) fetchLibrary();
  }, [fetchLibrary, imagePickerVisible]);

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement> | React.DragEvent,
  ) => {
    let files: File[] = [];
    if ("files" in e.target && e.target.files) {
      files = Array.from(e.target.files);
    } else if ("dataTransfer" in e && e.dataTransfer.files) {
      files = Array.from(e.dataTransfer.files);
    }

    if (files.length === 0 || !apiUrl || !apiKey) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("file", f));
      formData.append("folder", "editor");

      const res = await fetch(`${apiUrl}/api/saas/images`, {
        method: "POST",
        body: formData,
        headers: {
          "x-api-key": apiKey,
          "x-client-code": clientCode || "default",
        },
      });

      if (!res.ok) throw new Error("Upload failed");

      setUploadProgress(100);
      const json = await res.json();
      const newImages = Array.isArray(json.data) ? json.data : [json.data];

      setImages((prev) => [...newImages, ...prev]);
      if (newImages[0]) {
        setSelectedImage(newImages[0]);
        setAlt(getDisplayName(newImages[0]));
      }
      setTab("library");
    } catch (_err) {
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteImage = async (img: ImageFormat) => {
    if (!img.key || !apiUrl || !apiKey) return;
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const res = await fetch(
        `${apiUrl}/api/saas/images?key=${encodeURIComponent(img.key)}`,
        {
          method: "DELETE",
          headers: {
            "x-api-key": apiKey,
            "x-client-code": clientCode || "default",
          },
        },
      );
      if (res.ok) {
        setImages((prev) => prev.filter((i) => i.key !== img.key));
        if (selectedImage?.key === img.key) setSelectedImage(null);
      }
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  const handleInsert = () => {
    if (tab === "url") {
      if (!url.trim()) return;
      engine?.image(url, alt, linkUrl);
    } else if (selectedImage) {
      engine?.image(selectedImage.url, alt, linkUrl);
    }
    closeWorkspace();
  };

  const closeWorkspace = () => {
    setImagePickerVisible(false);
    setSelectedImage(null);
    setAlt("");
    setLinkUrl("");
    setUrl("");
  };

  // ── Render ──

  return (
    <Dialog open={imagePickerVisible} onOpenChange={setImagePickerVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className={cn(
          "erix-max-w-[850px] erix-p-0 erix-overflow-hidden erix-flex erix-flex-col erix-h-[85vh] erix-max-h-[750px]",
          popoverRadius,
          shadowClass,
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <DialogHeader className="erix-p-6 erix-pb-4 erix-border-b erix-border-border">
          <div className="erix-flex erix-items-center erix-justify-between">
            <DialogTitle className="erix-flex erix-items-center erix-gap-2.5">
              <div
                className={cn("erix-p-1.5 erix-bg-primary/10", buttonRadius)}
              >
                <ImageIcon className="erix-w-4 erix-h-4 erix-text-primary" />
              </div>
              <span className="erix-font-bold erix-tracking-tight erix-text-lg">
                Media Workspace
              </span>
            </DialogTitle>
          </div>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={setTab}
          className="erix-flex-1 erix-flex erix-flex-col erix-overflow-hidden"
        >
          <div className="erix-px-6 erix-py-3 erix-bg-muted/30 erix-flex erix-items-center erix-justify-between erix-border-b erix-border-border/50">
            <TabsList className="erix-bg-muted/50">
              <TabsTrigger value="library" className="erix-gap-2">
                <FileImage className="erix-w-3.5 erix-h-3.5" /> Library
              </TabsTrigger>
              <TabsTrigger value="upload" className="erix-gap-2">
                <Upload className="erix-w-3.5 erix-h-3.5" /> Upload
              </TabsTrigger>
              <TabsTrigger value="url" className="erix-gap-2">
                <LinkIcon className="erix-w-3.5 erix-h-3.5" /> External URL
              </TabsTrigger>
            </TabsList>

            {tab === "library" && (
              <div className="erix-flex erix-items-center erix-gap-2">
                <div className="erix-relative erix-group">
                  <Search className="erix-absolute erix-left-2.5 erix-top-1/2 erix-translate-y-[-50%] erix-w-3.5 erix-h-3.5 erix-text-muted-foreground" />
                  <input
                    placeholder="Search library..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      "erix-h-8 erix-pl-8 erix-pr-3 erix-text-xs erix-bg-background erix-border erix-border-border erix-w-[180px]",
                      "focus:erix-w-[220px] erix-transition-all focus:erix-outline-none focus:erix-ring-2 focus:erix-ring-primary/20",
                      buttonRadius,
                    )}
                  />
                </div>
                <div
                  className={cn(
                    "erix-flex erix-p-0.5 erix-bg-muted erix-border erix-border-border",
                    buttonRadius,
                  )}
                >
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "erix-p-1",
                      buttonRadius,
                      viewMode === "erix-grid"
                        ? "erix-bg-background erix-shadow-sm"
                        : "erix-text-muted-foreground",
                    )}
                  >
                    <Grid2X2 size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "erix-p-1",
                      buttonRadius,
                      viewMode === "list"
                        ? "erix-bg-background erix-shadow-sm"
                        : "erix-text-muted-foreground",
                    )}
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="erix-flex-1 erix-flex erix-overflow-hidden">
            {/* Main Content */}
            <div className="erix-flex-1 erix-overflow-y-auto erix-p-6">
              <TabsContent value="library" className="erix-mt-0 erix-h-full">
                {loading && images.length === 0 ? (
                  <GallerySkeleton mode={viewMode} />
                ) : images.length === 0 ? (
                  <div className="erix-flex erix-flex-col erix-items-center erix-justify-center erix-h-full erix-text-center">
                    <div className="erix-w-16 erix-h-16 erix-bg-muted erix-rounded-full erix-flex erix-items-center erix-justify-center erix-mb-4">
                      <ImageIcon className="erix-w-8 erix-h-8 erix-text-muted-foreground/40" />
                    </div>
                    <p className="erix-text-sm erix-font-bold">
                      Library is empty
                    </p>
                    <p className="erix-text-xs erix-text-muted-foreground erix-mt-1 erix-max-w-[200px]">
                      Upload files to start managing your assets.
                    </p>
                  </div>
                ) : (
                  <div
                    className={cn(
                      viewMode === "erix-grid"
                        ? "erix-grid erix-grid-cols-3 erix-gap-4"
                        : "erix-flex erix-flex-col erix-gap-2",
                    )}
                  >
                    {images.map((img) => (
                      <div
                        key={img.key}
                        onClick={() => {
                          setSelectedImage(img);
                          if (!alt) setAlt(getDisplayName(img));
                        }}
                        className={cn(
                          "erix-group erix-relative erix-border erix-transition-all erix-cursor-pointer",
                          selectedImage?.key === img.key
                            ? "erix-border-primary erix-ring-2 erix-ring-primary/20"
                            : "erix-border-border hover:erix-border-primary/50",
                          viewMode === "erix-grid"
                            ? "erix-aspect-square"
                            : "erix-flex erix-items-center erix-p-2 erix-gap-3",
                          buttonRadius,
                        )}
                      >
                        <div
                          className={cn(
                            "erix-bg-muted erix-overflow-hidden",
                            viewMode === "erix-grid"
                              ? "erix-w-full erix-h-full"
                              : "erix-w-10 erix-h-10 erix-shrink-0",
                            buttonRadius,
                          )}
                        >
                          <img
                            src={img.url}
                            alt=""
                            className="erix-w-full erix-h-full erix-object-cover"
                          />
                        </div>

                        {viewMode === "list" && (
                          <div className="erix-flex-1 erix-min-w-0">
                            <p className="erix-text-xs erix-font-bold erix-truncate">
                              {getDisplayName(img)}
                            </p>
                            <p className="erix-text-[10px] erix-text-muted-foreground erix-uppercase">
                              {formatBytes(img.size)} •{" "}
                              {img.type?.split("/")[1] || "IMG"}
                            </p>
                          </div>
                        )}

                        {selectedImage?.key === img.key && (
                          <div className="erix-absolute erix-top-2 erix-left-2 erix-bg-primary erix-text-primary-foreground erix-rounded-full erix-p-0.5">
                            <CheckCircle2 size={12} />
                          </div>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteImage(img);
                          }}
                          className="erix-absolute erix-top-2 erix-right-2 erix-p-1.5 erix-bg-background/80 erix-backdrop-blur erix-text-destructive erix-opacity-0 group-hover:erix-opacity-100 erix-transition-opacity hover:erix-bg-destructive hover:erix-text-white erix-rounded-md"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upload" className="erix-mt-0 erix-h-full">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleUpload(e);
                  }}
                  className={cn(
                    "erix-h-full erix-min-h-[300px] erix-flex erix-flex-col erix-items-center erix-justify-center erix-gap-4",
                    "erix-border-2 erix-border-dashed erix-border-border hover:erix-border-primary/50 hover:erix-bg-primary/5",
                    "erix-transition-all erix-cursor-pointer",
                    buttonRadius,
                  )}
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                >
                  {isUploading ? (
                    <div className="erix-flex erix-flex-col erix-items-center erix-gap-4 erix-w-full erix-max-w-[240px]">
                      <Loader2 className="erix-w-10 erix-h-10 erix-text-primary erix-animate-spin" />
                      <div className="erix-w-full erix-h-1.5 erix-bg-muted erix-rounded-full erix-overflow-hidden">
                        <div
                          className="erix-h-full erix-bg-primary erix-transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="erix-text-xs erix-font-medium">
                        Uploading Asset...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div
                        className={cn(
                          "erix-w-16 erix-h-16 erix-bg-primary/10 erix-flex erix-items-center erix-justify-center",
                          buttonRadius,
                        )}
                      >
                        <UploadCloud className="erix-w-8 erix-h-8 erix-text-primary" />
                      </div>
                      <div className="erix-text-center">
                        <p className="erix-text-sm erix-font-bold">
                          Drop your image here
                        </p>
                        <p className="erix-text-xs erix-text-muted-foreground erix-mt-1">
                          or click to browse local files
                        </p>
                      </div>
                    </>
                  )}
                  <input
                    id="file-upload"
                    type="file"
                    className="erix-hidden"
                    accept="image/*"
                    onChange={handleUpload}
                  />
                </div>
              </TabsContent>

              <TabsContent value="url" className="erix-mt-0">
                <div className="erix-flex erix-flex-col erix-gap-6 erix-max-w-[480px] erix-mx-auto erix-py-8">
                  <div className="erix-flex erix-flex-col erix-gap-2">
                    <label className="erix-text-xs erix-font-bold erix-uppercase erix-tracking-widest erix-text-muted-foreground">
                      Source URL
                    </label>
                    <div className="erix-relative">
                      <ExternalLink className="erix-absolute erix-left-3 erix-top-1/2 erix-translate-y-[-50%] erix-w-4 erix-h-4 erix-text-muted-foreground" />
                      <input
                        placeholder="https://example.com/image.jpg"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className={cn(
                          "erix-w-full erix-h-11 erix-pl-10 erix-pr-4 erix-bg-background erix-border erix-border-border focus:erix-ring-2 focus:erix-ring-primary/20 focus:erix-outline-none",
                          buttonRadius,
                        )}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>

            {/* Sidebar Inspector */}
            {(selectedImage || tab === "url") && (
              <div className="erix-w-[280px] erix-border-l erix-border-border erix-bg-muted/10 erix-p-6 erix-flex erix-flex-col erix-gap-6">
                <div>
                  <h3 className="erix-text-xs erix-font-bold erix-uppercase erix-tracking-widest erix-text-muted-foreground erix-mb-4">
                    Properties
                  </h3>
                  <div className="erix-space-y-5">
                    <div className="erix-flex erix-flex-col erix-gap-1.5">
                      <label className="erix-text-[11px] erix-font-medium erix-flex erix-items-center erix-gap-2">
                        Alt Text{" "}
                        <span className="erix-text-muted-foreground">
                          (SEO)
                        </span>
                      </label>
                      <input
                        placeholder="Image description..."
                        value={alt}
                        onChange={(e) => setAlt(e.target.value)}
                        className={cn(
                          "erix-w-full erix-h-9 erix-px-3 erix-text-xs erix-bg-background erix-border erix-border-border focus:erix-outline-none focus:erix-ring-2 focus:erix-ring-primary/20",
                          buttonRadius,
                        )}
                      />
                    </div>
                    <div className="erix-flex erix-flex-col erix-gap-1.5">
                      <label className="erix-text-[11px] erix-font-medium erix-flex erix-items-center erix-gap-2">
                        Link URL{" "}
                        <span className="erix-text-muted-foreground">
                          (Optional)
                        </span>
                      </label>
                      <div className="erix-relative">
                        <LinkIcon className="erix-absolute erix-left-2.5 erix-top-1/2 erix-translate-y-[-50%] erix-w-3 erix-h-3 erix-text-muted-foreground" />
                        <input
                          placeholder="https://..."
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          className={cn(
                            "erix-w-full erix-h-9 erix-pl-8 erix-pr-3 erix-text-xs erix-bg-background erix-border erix-border-border focus:erix-outline-none focus:erix-ring-2 focus:erix-ring-primary/20",
                            buttonRadius,
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {selectedImage && (
                  <div className="erix-mt-auto erix-pt-4 erix-border-t erix-border-border">
                    <div className="erix-aspect-video erix-rounded-md erix-overflow-hidden erix-bg-muted erix-mb-3 erix-border erix-border-border">
                      <img
                        src={selectedImage.url}
                        alt=""
                        className="erix-w-full erix-h-full erix-object-contain"
                      />
                    </div>
                    <div className="erix-space-y-1">
                      <p className="erix-text-[10px] erix-font-bold erix-truncate">
                        {getDisplayName(selectedImage)}
                      </p>
                      <p className="erix-text-[9px] erix-text-muted-foreground erix-uppercase">
                        {formatBytes(selectedImage.size)} •{" "}
                        {selectedImage.type || "image"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Tabs>

        {/* Footer Actions */}
        <div className="erix-p-4 erix-px-6 erix-bg-muted/10 erix-border-t erix-border-border erix-flex erix-items-center erix-justify-between">
          <div className="erix-text-xs erix-text-muted-foreground">
            {selectedImage ? (
              <span className="erix-flex erix-items-center erix-gap-2">
                <CheckCircle2 className="erix-w-4 erix-h-4 erix-text-success" />
                1 asset selected
              </span>
            ) : tab === "url" && url ? (
              <span className="erix-flex erix-items-center erix-gap-2">
                <ExternalLink className="erix-w-4 erix-h-4" /> Ready to insert
                remote asset
              </span>
            ) : (
              "Select an image to continue"
            )}
          </div>
          <div className="erix-flex erix-items-center erix-gap-3">
            <button
              onClick={closeWorkspace}
              className={cn(
                "erix-h-10 erix-px-4 erix-text-sm erix-font-medium hover:erix-bg-muted erix-transition-all",
                buttonRadius,
              )}
            >
              Cancel
            </button>
            <button
              disabled={
                (!selectedImage && tab !== "url") || (tab === "url" && !url)
              }
              onClick={handleInsert}
              className={cn(
                "erix-h-10 erix-px-6 erix-bg-primary erix-text-primary-foreground erix-text-sm erix-font-bold erix-transition-all",
                "disabled:erix-opacity-30 disabled:erix-pointer-events-none active:erix-scale-[0.98]",
                buttonRadius,
              )}
            >
              Insert Asset
            </button>
          </div>
        </div>

        {isOverQuota && (
          <div className="erix-px-6 erix-py-1.5 erix-bg-destructive/10 erix-text-[10px] erix-text-destructive erix-text-center erix-font-bold erix-uppercase erix-tracking-tighter">
            Storage alert: You are over your space limit. Please upgrade.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
