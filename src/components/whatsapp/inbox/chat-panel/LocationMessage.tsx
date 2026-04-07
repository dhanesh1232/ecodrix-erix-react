"use client";

import { MapPin, ExternalLink } from "lucide-react";
import { cn } from "../../../../lib/utils";

export default function LocationMessage({ text }: { text: string }) {
  let location: any = null;
  try {
    location = typeof text === "string" ? JSON.parse(text) : text;
  } catch {
    return (
      <div className="erix-p-2 erix-bg-red-50 erix-text-red-500 erix-text-xs erix-rounded-md">
        Invalid location data
      </div>
    );
  }

  const { latitude, longitude, name, address } = location || {};
  if (!latitude || !longitude) return null;

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  // Use a static maps-like placeholder since we don't always have an API key here
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=300x150&markers=color:red%7C${latitude},${longitude}&key=`;

  return (
    <div className="erix-min-w-[240px] erix-max-w-[300px] erix-overflow-hidden erix-rounded-md erix-border erix-border-black/5 erix-bg-white/50">
      <div
        className="erix-relative erix-h-[140px] erix-w-full erix-cursor-pointer erix-bg-neutral-100"
        onClick={() => window.open(mapUrl, "_blank")}
      >
        <img
          src={staticMapUrl}
          alt="Location map"
          className="erix-h-full erix-w-full erix-object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png";
          }}
        />
        <div className="erix-absolute erix-inset-0 erix-flex erix-items-center erix-justify-center erix-bg-black/5 hover:erix-bg-black/0 erix-transition-colors">
          <div className="erix-bg-primary erix-text-white erix-rounded-full erix-p-2 erix-shadow-lg">
            <MapPin className="erix-h-5 erix-w-5" />
          </div>
        </div>
      </div>
      <div
        className="erix-p-2.5 erix-cursor-pointer hover:erix-bg-black/5 erix-transition-colors"
        onClick={() => window.open(mapUrl, "_blank")}
      >
        <div className="erix-flex erix-items-start erix-justify-between erix-gap-2">
          <div className="erix-flex-1 erix-min-w-0">
            <h4 className="erix-text-[13px] erix-font-bold erix-truncate erix-text-foreground">
              {name || "Shared Location"}
            </h4>
            <p className="erix-text-[11px] erix-text-muted-foreground erix-line-clamp-2 erix-leading-relaxed">
              {address || `${latitude}, ${longitude}`}
            </p>
          </div>
          <ExternalLink className="erix-h-3.5 erix-w-3.5 erix-text-primary erix-shrink-0 erix-mt-0.5" />
        </div>
      </div>
    </div>
  );
}
