"use client";

import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "../../../../lib/utils";

export default function ImageMessage({ src }: { src: string }) {
  const [error, setError] = useState(false);
  
  if (error) {
    return (
      <div className="erix-bg-muted/20 erix-border-border erix-mb-1 erix-flex erix-h-[200px] erix-w-[200px] erix-items-center erix-justify-center erix-rounded-md erix-border">
        <ImageIcon className="erix-text-muted-foreground erix-h-10 erix-w-10 erix-opacity-50" />
      </div>
    );
  }
  
  return (
    <div className="erix-mb-1 erix-overflow-hidden erix-rounded-md erix-border erix-border-black/5 erix-shadow-sm">
      <img
        src={src}
        alt="Shared message"
        className="erix-h-auto erix-max-h-[300px] erix-w-full erix-max-w-full erix-object-cover"
        loading="lazy"
        onError={() => setError(true)}
      />
    </div>
  );
}
