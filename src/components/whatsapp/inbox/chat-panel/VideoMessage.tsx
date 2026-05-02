"use client";

import { useState } from "react";
import { Video as VideoIcon } from "lucide-react";
import { cn } from "../../../../lib/utils";

export default function VideoMessage({ src }: { src: string }) {
  const [error, setError] = useState(false);
  
  if (error) {
    return (
      <div className="erix-bg-muted/20 erix-border-border erix-mb-1 erix-flex erix-h-[150px] erix-w-[250px] erix-items-center erix-justify-center erix-rounded-md erix-border">
        <VideoIcon className="erix-text-muted-foreground erix-h-10 erix-w-10 erix-opacity-50" />
      </div>
    );
  }
  
  return (
    <div className="erix-mb-1 erix-max-w-[300px] erix-overflow-hidden erix-rounded-md erix-border erix-border-black/5 erix-shadow-sm">
      <video
        src={src}
        controls
        className="erix-h-auto erix-w-full"
        onError={() => setError(true)}
      />
    </div>
  );
}
