"use client";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { useErixEditor } from "@/context/editor";
import { cn } from "@/lib/utils";

export const ImageResizer: React.FC = () => {
  const { ctx, engine, menuContainerRef } = useErixEditor();
  const [resizing, setResizing] = React.useState(false);

  const activeImage = ctx.activeImage;
  const container = menuContainerRef.current;

  // We need the scroll offset of the iframe if we use the top-level container,
  // but wait - activeImage coordinates from getBoundingClientRect() inside the iframe
  // are relative to the IFRAME's viewport!
  // To mount an overlay over the iframe, we need to know the offset of the iframe within editorLayoutRef,
  // or simply position the overlay inside the absolute boundary of the iframe container.
  // Actually, Erix provides menuContainerRef, which is absolutely positioned relative to the editor area.
  // Wait, Erix uses `menuContainerRef` which overlays the iframe exactly.
  // So clientRects from iframe are directly map-able if we just apply the iframe's internal scroll.
  // But getBoundingClientRect() of activeImage is relative to iframe viewport.
  // In `bubblePos` calculations, we adjusted for iframe scroll! Let's just use the raw rect if we place it safely.

  // To keep things simple, let's just render the resizer handles around the rect.
  const [rect, setRect] = React.useState(activeImage);

  React.useEffect(() => {
    if (!resizing) {
      setRect(activeImage);
    }
  }, [activeImage, resizing]);

  if (!rect || !container || !engine) return null;

  const handlePointerDown = (e: React.PointerEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);

    const startX = e.clientX;
    const _startY = e.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;
    const aspectRatio = startWidth / startHeight;

    const onPointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const dx = moveEvent.clientX - startX;

      let newWidth = startWidth;

      if (corner.includes("e")) {
        newWidth = startWidth + dx;
      } else if (corner.includes("w")) {
        newWidth = startWidth - dx;
      }

      if (newWidth < 50) newWidth = 50;

      const newHeight = newWidth / aspectRatio;

      setRect({
        ...rect,
        width: newWidth,
        height: newHeight,
      });

      // Dispatch to engine continuously for immediate feedback
      engine.resizeImage(newWidth, newHeight);
    };

    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      setResizing(false);
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  };

  // Erix absolute overlay expects values relative to the iframe viewport.
  // Assuming our menuContainerRef doesn't shift, the returned coordinates from `getBoundingClientRect`
  // might need adjustment by `iframe.contentWindow.scrollY` if the editor itself scrolls.
  // Wait, `bubblePos` computation inside `editor.tsx` does:
  //      const iframeRect = iframe.getBoundingClientRect();
  //      const rect = range.getBoundingClientRect();
  //      x = rect.left + rect.width / 2;
  //      y = rect.top; // (relative to iframe viewport)
  // Meaning x/y inside `__ERIX_MENUS__` are strictly equal to rect.left / rect.top.

  return ReactDOM.createPortal(
    <div
      className={cn(
        "erix-absolute erix-z-40 erix-border-2 erix-border-erix-primary",
        resizing ? "erix-border-solid" : "erix-border-dashed",
      )}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        pointerEvents: resizing ? "auto" : "none",
      }}
    >
      <div className="erix-absolute erix-top-0 erix-left-0 erix-w-full erix-h-full pointer-events-none">
        {/* Handles */}
        <div
          className="erix-absolute -right-1.5 -bottom-1.5 erix-w-3 erix-h-3 erix-bg-erix-primary erix-border erix-border-white erix-cursor-nwse-resize erix-rounded-full pointer-events-auto erix-shadow-sm"
          onPointerDown={(e) => handlePointerDown(e, "se")}
        />
        <div
          className="erix-absolute -left-1.5 -bottom-1.5 erix-w-3 erix-h-3 erix-bg-erix-primary erix-border erix-border-white erix-cursor-nesw-resize erix-rounded-full pointer-events-auto erix-shadow-sm"
          onPointerDown={(e) => handlePointerDown(e, "sw")}
        />
        <div
          className="erix-absolute -right-1.5 -top-1.5 erix-w-3 erix-h-3 erix-bg-erix-primary erix-border erix-border-white erix-cursor-nesw-resize erix-rounded-full pointer-events-auto erix-shadow-sm"
          onPointerDown={(e) => handlePointerDown(e, "ne")}
        />
        <div
          className="erix-absolute -left-1.5 -top-1.5 erix-w-3 erix-h-3 erix-bg-erix-primary erix-border erix-border-white erix-cursor-nwse-resize erix-rounded-full pointer-events-auto erix-shadow-sm"
          onPointerDown={(e) => handlePointerDown(e, "nw")}
        />
      </div>
    </div>,
    container, // Mount on the top-level relative container (editorLayoutRef) or menuContainerRef?
  );
};
