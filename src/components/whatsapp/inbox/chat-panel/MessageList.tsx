"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, ChevronUp, ChevronDown, Send, Search } from "lucide-react";
import { useErixToast } from "../../../../toast/useErixToast";
import { Avatar, AvatarFallback, AvatarImage } from "../../../ui/avatar";
import { Button } from "../../../ui/button";
import { Checkbox } from "../../../ui/checkbox";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../ui/command";
import { ScrollArea } from "../../../ui/scroll-area";
import { Skeleton } from "../../../ui/skeleton";
import { MessageItem } from "./MessageItem";
import { MessageListSkeleton } from "./MessageListSkeleton";
import { cn } from "../../../../lib/utils";

const formatDateLabel = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

interface MessageListProps {
  messages: any[];
  chat: any;
  setReplyingTo: (msg: any) => void;
  onSendMessage?: (
    text?: string,
    mediaUrl?: string,
    mediaType?: string,
    templateName?: string,
    templateLanguage?: string,
    variables?: any[],
    replyToId?: string,
  ) => Promise<void>;
  onToggleStar?: (msg: any) => Promise<void>;
  onReactMessage?: (msg: any, reaction: string) => Promise<void>;
  isSending: boolean;
  conversations: any[];
  onForwardMessage?: (
    message: any,
    targetConversationId: string,
  ) => Promise<void>;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

export function MessageList({
  messages,
  chat,
  setReplyingTo,
  onSendMessage,
  onToggleStar,
  onReactMessage,
  isSending,
  conversations,
  onForwardMessage,
  hasMore,
  isFetchingMore,
  onLoadMore,
  isLoading,
}: MessageListProps) {
  const toast = useErixToast();
  const [forwardingMessage, setForwardingMessage] = useState<any>(null);
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [selectedForwardContacts, setSelectedForwardContacts] = useState<
    string[]
  >([]);
  const [isForwardingBulk, setIsForwardingBulk] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const prevScrollHeightRef = useRef<number>(0);
  const firstMessageIdRef = useRef<string | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const isFetchingMoreRef = useRef(false);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isFetchingMoreRef.current = !!isFetchingMore;
  }, [isFetchingMore]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const isAtBottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    setShowScrollButton(!isAtBottom);
  };

  const onLoadMoreStable = useCallback(() => {
    onLoadMore?.();
  }, [onLoadMore]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isFetchingMoreRef.current) {
          onLoadMoreStable();
        }
      },
      { threshold: 0.1 },
    );

    if (hasMore && !isFetchingMore) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, onLoadMoreStable]);

  React.useLayoutEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const viewport = scrollArea.querySelector(
      "erix-[data-radix-scroll-area-viewport]",
    ) as HTMLDivElement;
    if (!viewport) return;

    if (isFetchingMore) {
      if (prevScrollHeightRef.current === 0) {
        prevScrollHeightRef.current = viewport.scrollHeight;
      }
      return;
    }

    if (prevScrollHeightRef.current > 0) {
      const currentFirstId = messages[0]?.id || messages[0]?._id;
      if (currentFirstId !== firstMessageIdRef.current && messages.length > 0) {
        const delta = viewport.scrollHeight - prevScrollHeightRef.current;
        if (delta > 0) {
          viewport.scrollTop += delta;
        }
      }
      prevScrollHeightRef.current = 0;
    }

    firstMessageIdRef.current = messages[0]?.id || messages[0]?._id;
    lastMessageIdRef.current =
      messages[messages.length - 1]?.id || messages[messages.length - 1]?._id;
  }, [messages, isFetchingMore]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    }, 50);
  }, []);

  const handleBulkForward = async () => {
    if (!forwardingMessage || selectedForwardContacts.length === 0) return;

    setIsForwardingBulk(true);
    let successCount = 0;
    try {
      for (const targetId of selectedForwardContacts) {
        await onForwardMessage?.(forwardingMessage, targetId);
        successCount++;
      }

      if (successCount > 0) {
        toast.success(`Message forwarded to ${successCount} contact(s)`);
        setIsForwardOpen(false);
        setForwardingMessage(null);
        setSelectedForwardContacts([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to forward some messages");
    } finally {
      setIsForwardingBulk(false);
    }
  };

  useEffect(() => {
    if (!isForwardOpen) {
      setSelectedForwardContacts([]);
    }
  }, [isForwardOpen]);

  // Auto-scroll logic
  const lastChatId = useRef<string | null>(null);

  useEffect(() => {
    if (messages.length > 0) {
      const isNewChat = lastChatId.current !== chat?.id;
      const currentLastId =
        messages[messages.length - 1]?.id || messages[messages.length - 1]?._id;
      const isNewMessage = currentLastId !== lastMessageIdRef.current;

      if (isNewChat) {
        scrollToBottom("auto");
        lastChatId.current = chat?.id;
        return;
      }

      if (isNewMessage && !isFetchingMoreRef.current) {
        const viewport = scrollAreaRef.current?.querySelector(
          "erix-[data-radix-scroll-area-viewport]",
        );
        if (viewport) {
          const isNearBottom =
            viewport.scrollHeight - viewport.scrollTop <=
            viewport.clientHeight + 200;
          if (isNearBottom) {
            scrollToBottom("smooth");
          }
        } else {
          scrollToBottom("smooth");
        }
      }
    }
  }, [messages.length, chat?.id, messages, scrollToBottom]);

  const handleResendMessage = (msg: any) => {
    if (isSending) return;
    onSendMessage?.(
      msg.text,
      msg.mediaUrl,
      msg.type,
      msg.templateName,
      msg.templateLanguage,
      msg.variables,
    );
  };

  return (
    <div className="erix-relative erix-flex erix-flex-1 erix-flex-col erix-overflow-hidden">
      {isLoading ? (
        <MessageListSkeleton />
      ) : (
        <ScrollArea
          ref={scrollAreaRef}
          onContextMenu={(e) => e.preventDefault()}
          onDoubleClick={(e) => e.preventDefault()}
          className="erix-relative erix-z-0 erix-w-full erix-flex-1 erix-overflow-y-auto erix-bg-[#efeae2] erix-pl-3 erix-pr-4 erix-pt-1"
          onScrollCapture={handleScroll}
        >
          <div
            className="erix-absolute erix-inset-0 erix-z-[-1] erix-pointer-events-none erix-opacity-40"
            style={{
              backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
              backgroundSize: "400px",
              backgroundRepeat: "repeat",
            }}
          />
          <div className="erix-w-full erix-space-y-2 erix-pb-4">
            <div ref={topSentinelRef} className="erix-h-px erix-w-full" />
            {hasMore && (
              <div className="erix-flex erix-justify-center erix-py-2">
                {isFetchingMore ? (
                  <div className="erix-bg-background/80 erix-border-border erix-flex erix-items-center erix-gap-2 erix-rounded-full erix-border erix-px-3 erix-py-1.5 erix-shadow-sm">
                    <Loader2 className="erix-text-muted-foreground erix-h-3.5 erix-w-3.5 erix-animate-spin" />
                    <span className="erix-text-muted-foreground erix-text-xs">
                      Loading older messages...
                    </span>
                  </div>
                ) : (
                  <div className="erix-bg-background/80 erix-border-border erix-flex erix-items-center erix-gap-2 erix-rounded-full erix-border erix-px-3 erix-py-1.5 erix-shadow-sm">
                    <ChevronUp className="erix-text-muted-foreground erix-h-3.5 erix-w-3.5" />
                    <span className="erix-text-muted-foreground erix-text-xs">
                      Scroll up for more
                    </span>
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, index) => {
              const currentDateLabel = formatDateLabel(msg.fullDate);
              const prevDateLabel =
                index > 0
                  ? formatDateLabel(messages[index - 1].fullDate)
                  : null;
              const showDate = !!(
                currentDateLabel && currentDateLabel !== prevDateLabel
              );
              const isSameSender =
                index > 0 && messages[index - 1].sender === msg.sender;
              const isLastFromSender =
                index === messages.length - 1 ||
                messages[index + 1].sender !== msg.sender;

              return (
                <MessageItem
                  key={msg.id || msg._id || `idx-${index}`}
                  msg={msg}
                  isSameSender={isSameSender}
                  isLastFromSender={isLastFromSender}
                  showDate={showDate}
                  currentDateLabel={currentDateLabel}
                  isSending={isSending}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  setReplyingTo={setReplyingTo}
                  onResendMessage={handleResendMessage}
                  onReactMessage={onReactMessage}
                  onForwardMessageClick={(m) => {
                    setForwardingMessage(m);
                    setIsForwardOpen(true);
                  }}
                  onToggleStar={onToggleStar}
                  onTouchStart={(msgId) => {
                    isLongPress.current = false;
                    longPressTimer.current = setTimeout(() => {
                      isLongPress.current = true;
                      setOpenMenuId(msgId);
                      if (typeof navigator !== "undefined" && navigator.vibrate)
                        navigator.vibrate(20);
                    }, 500);
                  }}
                  onTouchEnd={() => {
                    if (longPressTimer.current) {
                      clearTimeout(longPressTimer.current);
                      longPressTimer.current = null;
                    }
                  }}
                />
              );
            })}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      )}

      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="erix-absolute erix-bottom-4 erix-left-1/2 erix-z-20 erix--erix-translate-x-1/2"
          >
            <Button
              size="icon"
              className="erix-bg-background/80 hover:erix-bg-background erix-h-8 erix-w-8 erix-cursor-pointer erix-rounded-full erix-shadow-md"
              onClick={() => scrollToBottom()}
            >
              <ChevronDown className="erix-text-foreground erix-h-4 erix-w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <CommandDialog open={isForwardOpen} onOpenChange={setIsForwardOpen}>
        <div className="erix-flex erix-items-center erix-border-b erix-px-3">
          <Search className="erix-mr-2 erix-h-4 erix-w-4 erix-shrink-0 erix-opacity-50" />
          <CommandInput
            placeholder="Search contact to forward..."
            className="placeholder:erix-text-muted-foreground erix-flex erix-h-11 erix-w-full erix-rounded-md erix-border-none erix-bg-transparent erix-py-3 erix-text-sm erix-outline-none focus:erix-ring-0 disabled:erix-cursor-not-allowed disabled:erix-opacity-50"
          />
        </div>
        <CommandList className="erix-max-h-[300px] erix-overflow-hidden">
          <ScrollArea className="erix-h-[300px]">
            <CommandEmpty>No contacts found.</CommandEmpty>
            <CommandGroup heading="Forward to..." className="erix-px-2">
              {conversations
                .filter((c) => c.id !== chat?.id)
                .map((c, idx) => (
                  <CommandItem
                    key={c.id || `conv-${idx}`}
                    onSelect={() => {
                      setSelectedForwardContacts((prev) =>
                        prev.includes(c.id)
                          ? prev.filter((id) => id !== c.id)
                          : [...prev, c.id],
                      );
                    }}
                    className="hover:erix-bg-accent hover:erix-text-accent-foreground data-[selected=true]:erix-bg-accent data-[selected=true]:erix-text-accent-foreground erix-flex erix-cursor-pointer erix-items-center erix-justify-between erix-rounded-md erix-p-2"
                  >
                    <div className="erix-flex erix-items-center erix-gap-3 erix-overflow-hidden">
                      <Avatar className="erix-h-8 erix-w-8">
                        <AvatarImage src={c.profilePicture} alt={c.name} />
                        <AvatarFallback className="erix-bg-primary/10 erix-text-primary erix-text-[10px]">
                          {c.name?.slice(0, 2).toUpperCase() || "UN"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="erix-flex erix-flex-col erix-overflow-hidden erix-text-left">
                        <span className="erix-truncate erix-text-sm erix-font-medium">
                          {c.name}
                        </span>
                        <span className="erix-text-muted-foreground erix-truncate erix-text-[10px]">
                          {c.phone}
                        </span>
                      </div>
                    </div>
                    <Checkbox
                      checked={selectedForwardContacts.includes(c.id)}
                      className="erix-pointer-events-none"
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
          </ScrollArea>
        </CommandList>
        <div className="erix-bg-secondary/30 erix-flex erix-items-center erix-justify-end erix-gap-2 erix-border-t erix-p-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsForwardOpen(false)}
            className="erix-h-8"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleBulkForward}
            disabled={selectedForwardContacts.length === 0 || isForwardingBulk}
            className="erix-h-8 erix-gap-2"
          >
            {isForwardingBulk ? (
              <Loader2 className="erix-h-3 erix-w-3 erix-animate-spin" />
            ) : (
              <Send className="erix-h-3 erix-w-3" />
            )}
            Send ({selectedForwardContacts.length})
          </Button>
        </div>
      </CommandDialog>
    </div>
  );
}
