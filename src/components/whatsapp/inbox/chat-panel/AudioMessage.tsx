"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, AudioLines, Phone } from "lucide-react";
import { cn } from "../../../../lib/utils";

export default function AudioMessage({ src }: { src: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => setDuration(audio.duration);
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const onEnd = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="erix-flex erix-items-center erix-gap-3 erix-py-1.5 erix-px-2 erix-min-w-[200px]">
      <audio ref={audioRef} src={src} className="erix-hidden" />

      <button
        onClick={togglePlay}
        className="erix-flex erix-h-10 erix-w-10 erix-shrink-0 erix-items-center erix-justify-center erix-rounded-full erix-bg-primary/10 erix-text-primary erix-transition-colors hover:erix-bg-primary/20"
      >
        {isPlaying ? (
          <Pause className="erix-h-6 erix-w-6" />
        ) : (
          <Play className="erix-h-6 erix-w-6 erix-ml-0.5" />
        )}
      </button>

      <div className="erix-flex erix-flex-col erix-gap-1.5 erix-flex-1 erix-min-w-0">
        {/* Progress Bar */}
        <div className="erix-relative erix-h-1.5 erix-w-full erix-overflow-hidden erix-rounded-full erix-bg-zinc-200">
          <div
            className="erix-absolute erix-left-0 erix-top-0 erix-h-full erix-bg-primary erix-transition-all erix-duration-100"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>

        <div className="erix-flex erix-justify-between erix-text-[10px] erix-tabular-nums erix-text-muted-foreground erix-font-medium">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="erix-relative erix-shrink-0">
        <AudioLines className="erix-h-5 erix-w-5 erix-text-[#34B7F1]" />
        <div className="erix-absolute -erix-bottom-1 -erix-right-1 erix-flex erix-h-3 erix-w-3 erix-items-center erix-justify-center erix-rounded-full erix-bg-white erix-shadow-sm erix-ring-1 erix-ring-black/5">
          <svg
            className="erix-h-2 erix-w-2 erix-text-[#25D366]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
