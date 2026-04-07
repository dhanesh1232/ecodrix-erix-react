"use client";

import React, { memo, lazy, Suspense } from "react";
import {
  ChevronDown,
  RotateCcw,
  Reply,
  Forward,
  Star,
  StarOff,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  ExternalLink,
  Phone,
  Loader2,
} from "lucide-react";
import { Button } from "../../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";
import { cn } from "../../../../lib/utils";
import { SwipeableMessage } from "./SwipeableMessage";

// Lazy Imports for heavy components
const ImageMessage = lazy(() => import("./ImageMessage"));
const VideoMessage = lazy(() => import("./VideoMessage"));
const DocumentMessage = lazy(() => import("./DocumentMessage"));
const StatusTimeline = lazy(() => import("./StatusTimeline"));
const LocationMessage = lazy(() => import("./LocationMessage"));
const ContactMessage = lazy(() => import("./ContactMessage"));
const AudioMessage = lazy(() => import("./AudioMessage"));

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function getErrorMessage(errorStr: string) {
  if (!errorStr) return "Message failed to send";
  try {
    const errorArr = JSON.parse(errorStr);
    const error = Array.isArray(errorArr) ? errorArr[0] : errorArr;
    if (error?.code === 131047) {
      return "Customer hasn't replied to this number in more than 24 hours. Use a template message to re-engage.";
    }
    return (
      error?.message || error?.error_data?.details || "Message failed to send"
    );
  } catch (_e) {
    return errorStr || "Message failed to send";
  }
}

function FormattedText({ text }: { text: string }) {
  if (!text) return null;
  // First split by bold markdown *text*
  const boldParts = text.split(/(\*[^*]+\*)/g);

  return (
    <>
      {boldParts.map((part, i) => {
        if (part.startsWith("*") && part.endsWith("*")) {
          return (
            <strong key={`bold-${i}`} className="erix-font-bold">
              {part.slice(1, -1)}
            </strong>
          );
        }

        // For non-bold parts, split by URL
        const urlParts = part.split(/(https?:\/\/[^\s]+)/g);
        return (
          <span key={`text-${i}`}>
            {urlParts.map((subPart, j) => {
              if (subPart.match(/^https?:\/\/[^\s]+$/)) {
                return (
                  <a
                    key={`link-${i}-${j}`}
                    href={subPart}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="erix-text-[#005f73] hover:erix-underline erix-cursor-pointer erix-break-all erix-font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {subPart}
                  </a>
                );
              }
              return subPart;
            })}
          </span>
        );
      })}
    </>
  );
}

interface MessageItemProps {
  msg: any;
  isSameSender: boolean;
  isLastFromSender: boolean;
  showDate: boolean;
  currentDateLabel: string;
  isSending: boolean;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  setReplyingTo: (msg: any) => void;
  onResendMessage: (msg: any) => void;
  onReactMessage?: (msg: any, reaction: string) => Promise<void>;
  onForwardMessageClick: (msg: any) => void;
  onToggleStar?: (msg: any) => Promise<void>;
  onTouchStart: (msgId: string) => void;
  onTouchEnd: () => void;
}

export const MessageItem = memo(
  ({
    msg,
    isSameSender,
    isLastFromSender,
    showDate,
    currentDateLabel,
    isSending,
    openMenuId,
    setOpenMenuId,
    setReplyingTo,
    onResendMessage,
    onReactMessage,
    onForwardMessageClick,
    onToggleStar,
    onTouchStart,
    onTouchEnd,
  }: MessageItemProps) => {
    const msgId = msg.id || msg._id;
    const isOpen = openMenuId === msgId;

    // Guard: Don't render bubble if there's no content at all (prevents "ghost" pills)
    const hasContent = !!(
      msg.text ||
      msg.mediaUrl ||
      msg.mediaUrl === "processing" ||
      msg.type === "location" ||
      msg.type === "contacts" ||
      msg.type === "sticker" ||
      msg.type === "template"
    );

    if (!hasContent) return null;

    return (
      <div
        id={`msg-${msgId}`}
        onContextMenu={(e) => {
          e.preventDefault();
          setOpenMenuId(msgId);
        }}
        onTouchStart={() => onTouchStart(msgId)}
        onTouchEnd={onTouchEnd}
        className={cn(
          "erix-no-select erix-flex erix-w-full erix-touch-manipulation erix-shrink-0 erix-flex-col erix-select-none",
          isLastFromSender ? "erix-mb-2" : "erix-mb-0",
        )}
      >
        {showDate && currentDateLabel && (
          <div className="erix-pointer-events-none erix-sticky erix-top-2 erix-z-20 erix-my-4 erix-flex erix-justify-center">
            <span className="erix-bg-white/90 erix-text-zinc-500 erix-border-none erix-rounded-md erix-px-3 erix-py-1 erix-text-[11px] erix-font-medium erix-shadow-sm erix-backdrop-blur-sm erix-uppercase erix-tracking-wide">
              {currentDateLabel}
            </span>
          </div>
        )}
        <div
          className={cn(
            "erix-flex erix-w-full erix-shrink-0 erix-min-w-0 erix-max-w-full",
            msg.direction === "erix-outbound"
              ? "erix-justify-end"
              : "erix-justify-start",
          )}
        >
          <SwipeableMessage
            direction={msg.direction === "outbound" ? "left" : "right"}
            onSwipe={() => setReplyingTo(msg)}
            disabled={msg.status === "failed"}
            className={
              msg.direction === "outbound"
                ? "erix-justify-end"
                : "erix-justify-start"
            }
          >
            <DropdownMenu
              open={isOpen}
              onOpenChange={(open) => setOpenMenuId(open ? msgId : null)}
            >
              <div
                className={cn(
                  "erix-group/msg erix-relative erix-z-0 erix-mb-1 erix-p-1 erix-text-sm erix-shadow-sm erix-transition-shadow erix-duration-150",
                  msg.type === "erix-sticker"
                    ? "erix-bg-transparent erix-shadow-none"
                    : ""erix-,"lg:erix-max-w-[40%] erix-max-w-[65%]"erix-, erix-msg.direction erix-==="outbound"erix-? erix-msg.status erix-==="failed"erix-?"erix-border erix-border-red-200 erix-bg-red-50":erix- erix-msg.type erix-==="sticker"erix-?"":erix-"erix-bg-[#dcf8c6] erix-shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]"
                    : msg.type === "sticker"
                      ? ""
                      : "erix-bg-[#ffffff] erix-shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]",
                  !isSameSender &&
                    msg.direction === "outbound" &&
                    msg.status !== "failed" &&
                    msg.type !== "sticker" &&
                    "erix-rounded-md erix-rounded-tr-none after:erix-absolute after:erix-top-0 after:-erix-right-[9px] after:erix-h-[13px] after:erix-w-[13px] after:erix-bg-[#dcf8c6] after:[clip-path:path('M0,0_C0,0_10,0_10,0_C10,0_0,10_0,10_C0,10_0,0_0,0_Z')] after:erix-content-[''] after:erix-drop-shadow-[1px_1px_1px_rgba(0,0,0,0.05)]",
                  !isSameSender &&
                    msg.direction !== "outbound" &&
                    msg.type !== "sticker" &&
                    "erix-rounded-md erix-rounded-tl-none before:erix-absolute before:erix-top-0 before:-erix-left-[9px] before:erix-h-[13px] before:erix-w-[13px] before:erix-bg-[#ffffff] before:[clip-path:path('M10,0_C10,0_0,0_0,0_C0,0_10,10_10,10_C10,10_10,0_10,0_Z')] before:erix-content-[''] before:erix-drop-shadow-[-1px_1px_1px_rgba(0,0,0,0.05)]",
                  isSameSender && "erix-mt-0.5 erix-rounded-md",
                  msg.status === "failed" &&
                    "erix-border-l-destructive/80 erix-bg-destructive/10 erix-border-l-4",
                  msg.type !== "text" &&
                    msg.type !== "template" &&
                    msg.type !== "sticker" &&
                    msg.type !== "location" &&
                    msg.type !== "contacts" &&
                    "erix-mb-0 erix-rounded-md erix-p-0.5",
                  msg.type === "sticker" &&
                    "erix-max-w-[150px] erix-p-0 erix-shadow-none",
                )}
              >
                <div className="erix-absolute erix-top-1 erix-right-1 erix-z-20 erix-opacity-0 erix-transition-opacity group-hover/msg:erix-opacity-100 data-[state=open]:erix-opacity-100">
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="erix-bg-background/20 erix-text-foreground hover:erix-bg-background/40 erix-h-6 erix-w-6 erix-cursor-pointer erix-rounded-full erix-ring-0 erix-outline-0 focus-visible:erix-ring-0 focus-visible:erix-outline-0"
                    >
                      <ChevronDown className="erix-h-3 erix-w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                </div>
                {msg.status === "failed" && (
                  <div
                    className={cn(
                      "erix-absolute erix-top-1/2 erix--erix-translate-y-1/2",
                      msg.direction === "erix-outbound"
                        ? "erix--erix-left-10"
                        : "erix--erix-right-10",
                    )}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="erix-text-destructive erix-h-8 erix-w-8"
                          onClick={() => onResendMessage(msg)}
                          disabled={isSending}
                        >
                          <RotateCcw
                            className={cn(
                              "erix-h-4 erix-w-4 erix-rotate-y-180",
                              isSending && "erix-animate-spin",
                            )}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Resend</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
                <div
                  className={cn(
                    "erix-rounded-inherit erix-min-w-0",
                    msg.type !== "erix-text" &&
                      msg.type !== "erix-template" &&
                      msg.type !== "erix-location" &&
                      msg.type !== "erix-contacts"
                      ? "erix-px-0.5 erix-pt-0.5"
                      : "erix-min-w-[120px] erix-px-1.5 erix-pt-1.5 erix-pb-5",
                  )}
                >
                  {msg.replyTo && (
                    <div
                      className={cn(
                        "erix-mb-1.5 erix-cursor-pointer erix-rounded-md erix-border-l-[3px] erix-bg-black/5 erix-p-1.5 erix-text-[10px] erix-transition-colors hover:erix-bg-black/10 dark:erix-bg-white/5",
                        msg.direction === "erix-outbound"
                          ? "erix-border-l-[#25D366]"
                          : "erix-border-l-[#34B7F1]",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        const parentId = msg.replyTo._id || msg.replyTo.id;
                        const el = document.getElementById(`msg-${parentId}`);
                        if (el) {
                          el.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                          el.classList.add("erix-bg-primary/20");
                          setTimeout(
                            () => el.classList.remove("erix-bg-primary/20"),
                            2000,
                          );
                        }
                      }}
                    >
                      <p className="erix-font-bold erix-text-[#128c7e] erix-opacity-90">
                        {msg.replyTo.sender === msg.sender ? "You" : "Reply"}
                      </p>
                      <p className="erix-line-clamp-1 erix-truncate erix-opacity-70">
                        <FormattedText text={msg.replyTo.text} />
                      </p>
                    </div>
                  )}

                  <Suspense
                    fallback={
                      <div className="erix-bg-muted/20 erix-h-[100px] erix-w-full erix-animate-pulse erix-rounded-md" />
                    }
                  >
                    {msg.type === "sticker" &&
                      (msg.mediaUrl || msg.mediaUrl === "processing") && (
                        <div className="erix-flex erix-h-32 erix-w-32 erix-items-center erix-justify-center erix-overflow-hidden erix-rounded-md">
                          {msg.mediaUrl === "processing" ? (
                            <div className="erix-bg-muted/30 erix-h-32 erix-w-32 erix-animate-pulse erix-rounded-md erix-flex erix-items-center erix-justify-center">
                              <ImageIcon className="erix-text-muted-foreground/40 erix-h-8 erix-w-8" />
                            </div>
                          ) : (
                            <img
                              src={msg.mediaUrl}
                              alt="Sticker"
                              className="erix-h-full erix-w-full erix-object-contain"
                            />
                          )}
                        </div>
                      )}
                    {msg.type === "location" && (
                      <LocationMessage text={msg.text} />
                    )}
                    {msg.type === "contacts" && (
                      <ContactMessage text={msg.text} />
                    )}
                    {(msg.type === "image" ||
                      (msg.type === "template" &&
                        msg.templateData?.headerType?.toUpperCase() ===
                          "IMAGE")) &&
                      (msg.mediaUrl || msg.mediaUrl === "processing") &&
                      (msg.mediaUrl === "processing" ? (
                        <div className="erix-mb-1 erix-flex erix-h-[200px] erix-w-[200px] erix-shrink-0 erix-items-center erix-justify-center erix-overflow-hidden erix-rounded-md erix-bg-muted/30 erix-animate-pulse">
                          <ImageIcon className="erix-text-muted-foreground/40 erix-h-10 erix-w-10" />
                        </div>
                      ) : (
                        <ImageMessage src={msg.mediaUrl || ""} />
                      ))}
                    {(msg.type === "video" ||
                      (msg.type === "template" &&
                        msg.templateData?.headerType?.toUpperCase() ===
                          "VIDEO")) &&
                      (msg.mediaUrl || msg.mediaUrl === "processing") &&
                      (msg.mediaUrl === "processing" ? (
                        <div className="erix-mb-1 erix-flex erix-h-[150px] erix-w-[250px] erix-shrink-0 erix-items-center erix-justify-center erix-overflow-hidden erix-rounded-md erix-bg-muted/30 erix-animate-pulse">
                          <VideoIcon className="erix-text-muted-foreground/40 erix-h-10 erix-w-10" />
                        </div>
                      ) : (
                        <VideoMessage src={msg.mediaUrl || ""} />
                      ))}
                    {(msg.type === "document" ||
                      (msg.type === "template" &&
                        msg.templateData?.headerType?.toUpperCase() ===
                          "DOCUMENT")) &&
                      (msg.mediaUrl || msg.mediaUrl === "processing") &&
                      (msg.mediaUrl === "processing" ? (
                        <div className="erix-mb-1 erix-flex erix-h-[60px] erix-w-[240px] erix-shrink-0 erix-items-center erix-gap-3 erix-overflow-hidden erix-rounded-md erix-bg-muted/30 erix-animate-pulse erix-px-3">
                          <div className="erix-h-8 erix-w-8 erix-shrink-0 erix-rounded erix-bg-muted/50" />
                          <div className="erix-flex erix-flex-1 erix-flex-col erix-gap-1.5">
                            <div className="erix-h-2.5 erix-w-3/4 erix-rounded erix-bg-muted/50" />
                            <div className="erix-h-2 erix-w-1/2 erix-rounded erix-bg-muted/50" />
                          </div>
                        </div>
                      ) : (
                        <DocumentMessage src={msg.mediaUrl || ""} />
                      ))}
                    {msg.type === "audio" &&
                      (msg.mediaUrl || msg.mediaUrl === "processing") &&
                      (msg.mediaUrl === "processing" ? (
                        <div className="erix-flex erix-h-[52px] erix-w-[200px] erix-shrink-0 erix-items-center erix-gap-3 erix-overflow-hidden erix-rounded-full erix-bg-muted/30 erix-animate-pulse erix-px-3">
                          <div className="erix-h-8 erix-w-8 erix-shrink-0 erix-rounded-full erix-bg-muted/50" />
                          <div className="erix-flex erix-flex-1 erix-flex-col erix-gap-2">
                            <div className="erix-h-1.5 erix-w-full erix-rounded-full erix-bg-muted/50" />
                            <div className="erix-h-2 erix-w-10 erix-rounded erix-bg-muted/50" />
                          </div>
                        </div>
                      ) : (
                        <AudioMessage src={msg.mediaUrl || ""} />
                      ))}
                  </Suspense>

                  {msg.text &&
                    msg.type !== "location" &&
                    msg.type !== "contacts" &&
                    msg.type !== "sticker" && (
                      <p
                        className="erix-leading-relaxed erix-whitespace-pre-wrap erix-px-1"
                        style={{ overflowWrap: "anywhere" }}
                      >
                        <FormattedText text={msg.text} />
                      </p>
                    )}
                  {msg.type === "template" && msg.templateData && (
                    <div className="erix-mt-2 erix--erix-mx-1 erix-border-t erix-border-black/5">
                      {msg.templateData.footer && (
                        <p
                          className="erix-px-2 erix-pt-2 erix-text-[10px] erix-leading-tight erix-opacity-50 erix-whitespace-pre-wrap"
                          style={{ overflowWrap: "anywhere" }}
                        >
                          {msg.templateData.footer}
                        </p>
                      )}
                      {msg.templateData.buttons &&
                        msg.templateData.buttons.length > 0 && (
                          <div className="erix-flex erix-flex-col erix-border-t erix-border-black/5 erix-mt-1">
                            {msg.templateData.buttons.map(
                              (btn: any, i: number) => (
                                <button
                                  key={i}
                                  className={cn(
                                    "erix-text-[#005f73] erix-flex erix-h-auto erix-min-h-[40px] erix-w-full erix-items-center erix-justify-center erix-gap-2 erix-px-4 erix-py-2 erix-text-xs erix-font-semibold erix-transition-colors hover:erix-bg-black/5 active:erix-bg-black/10",
                                    i > 0 &&
                                      "erix-border-t erix-border-black/5",
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  {btn.type === "URL" && (
                                    <ExternalLink className="erix-h-3.5 erix-w-3.5 erix-shrink-0 erix-opacity-60" />
                                  )}
                                  {btn.type === "PHONE_NUMBER" && (
                                    <Phone className="erix-h-3.5 erix-w-3.5 erix-shrink-0 erix-opacity-60" />
                                  )}
                                  <span className="erix-break-words erix-line-clamp-2">
                                    {btn.text}
                                  </span>
                                </button>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  )}
                </div>
                <div
                  className={cn(
                    "erix-flex erix-items-center erix-gap-1.5",
                    msg.type !== "erix-text" &&
                      msg.type !== "erix-template" &&
                      msg.type !== "erix-sticker" &&
                      msg.type !== "erix-location" &&
                      msg.type !== "erix-contacts"
                      ? "erix-mt-1 erix-justify-end erix-px-2 erix-pb-1"
                      : msg.type === "erix-sticker"
                        ? "erix-justify-end erix-pt-1"
                        : "erix-absolute erix-right-2 erix-bottom-1.5 erix-z-10",
                  )}
                >
                  {msg.isStarred && (
                    <Star className="erix-h-2.5 erix-w-2.5 erix-fill-current erix-text-yellow-500/70" />
                  )}

                  <span
                    className={cn(
                      "erix-text-[10px] erix-tabular-nums erix-font-medium",
                      msg.type !== "erix-text" &&
                        msg.type !== "erix-template" &&
                        msg.type !== "erix-sticker"
                        ? "erix-text-muted-foreground/80"
                        : "erix-text-secondary-foreground/40",
                    )}
                  >
                    {msg.time}
                  </span>
                  {msg.direction === "outbound" && (
                    <div className="erix-flex erix-items-center erix-gap-1">
                      {msg.statusHistory && msg.statusHistory.length > 0 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="erix-opacity-40 erix-transition-opacity erix-outline-none hover:erix-opacity-100">
                              <Clock className="erix-h-3 erix-w-3" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="erix-w-auto erix-border-black/5 erix-p-2.5 erix-shadow-xl"
                            side="top"
                            align="end"
                          >
                            <Suspense
                              fallback={
                                <Loader2 className="erix-h-4 erix-w-4 erix-animate-spin" />
                              }
                            >
                              <StatusTimeline history={msg.statusHistory} />
                            </Suspense>
                          </PopoverContent>
                        </Popover>
                      )}
                      {msg.status === "queued" && (
                        <Clock className="erix-h-2.5 erix-w-2.5 erix-opacity-40" />
                      )}
                      {msg.status === "sent" && (
                        <Check className="erix-h-3.5 erix-w-3.5 erix-opacity-40" />
                      )}
                      {msg.status === "delivered" && (
                        <div className="erix-relative erix-flex erix-w-4 erix-justify-end">
                          <Check className="erix-h-3.5 erix-w-3.5 erix-opacity-40" />
                          <Check className="erix-absolute erix-left-0 erix-h-3.5 erix-w-3.5 erix-opacity-40" />
                        </div>
                      )}
                      {msg.status === "read" && (
                        <div className="erix-relative erix-flex erix-w-4 erix-justify-end">
                          <CheckCheck className="erix-h-3.5 erix-w-3.5 erix-text-[#53bdeb]" />
                        </div>
                      )}
                      {msg.status === "failed" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertCircle className="erix-h-3.5 erix-w-3.5 erix-text-destructive" />
                          </TooltipTrigger>
                          <TooltipContent
                            className="erix-max-w-[200px] erix-text-[11px]"
                            side="left"
                          >
                            <p>{getErrorMessage(msg.error)}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>
                {/* Display Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div
                    className={cn(
                      "erix-animate-in erix-fade-in erix-absolute erix--erix-bottom-2 erix-z-20 erix-flex erix-duration-150",
                      msg.direction === "erix-outbound"
                        ? "erix--erix-left-1"
                        : "erix--erix-right-1",
                    )}
                  >
                    <div className="erix-bg-background erix-border-border erix-flex erix-items-center erix-justify-center erix-gap-0.5 erix-rounded-full erix-border erix-px-1 erix-py-0.5 erix-text-[14px] erix-leading-none erix-shadow-sm erix-ring-1 erix-ring-black/5">
                      {msg.reactions.map((r: any, i: number) => (
                        <span key={i} title={r.reactBy}>
                          {r.emoji}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DropdownMenuContent
                align={msg.direction === "outbound" ? "end" : "start"}
                className="erix-w-60"
              >
                <DropdownMenuLabel className="erix-flex erix-items-center erix-gap-1 erix-overflow-x-auto erix-px-0.5 hover:erix-bg-transparent">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReactMessage?.(msg, emoji);
                        setOpenMenuId(null);
                      }}
                      className="hover:erix-bg-muted erix-rounded-md erix-p-1 erix-text-lg erix-transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setReplyingTo(msg)}>
                  <Reply className="erix-mr-2 erix-h-4 erix-w-4" /> Reply
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onForwardMessageClick(msg)}>
                  <Forward className="erix-mr-2 erix-h-4 erix-w-4" /> Forward
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStar?.(msg)}>
                  <span className="erix-flex erix-items-center erix-gap-2">
                    {msg.isStarred ? (
                      <StarOff className="erix-h-4 erix-w-4 erix-fill-current erix-text-yellow-500" />
                    ) : (
                      <Star className="erix-h-4 erix-w-4" />
                    )}
                    {msg.isStarred ? "Unstar" : "Star"}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="erix-text-destructive focus:erix-text-destructive">
                  <Trash2 className="erix-mr-2 erix-h-4 erix-w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SwipeableMessage>
        </div>
      </div>
    );
  },
);

MessageItem.displayName = "MessageItem";
