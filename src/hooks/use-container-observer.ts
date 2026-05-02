// hooks/useContainerObserver.ts
import { useEffect, useRef, useState } from "react";

export function useContainerObserver() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [toolbarWidth, setToolbarWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    observer.observe(containerRef.current);

    // measure children (toolbar actual content)
    const measureToolbar = () => {
      if (!containerRef.current) return;
      const total = Array.from(containerRef.current.children).reduce(
        (acc, el) => acc + (el as HTMLElement).offsetWidth,
        0,
      );
      setToolbarWidth(total);
    };

    measureToolbar();
    window.addEventListener("resize", measureToolbar);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureToolbar);
    };
  }, []);

  return { containerRef, containerWidth, toolbarWidth };
}
