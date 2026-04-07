"use client";
// src/components/whatsapp/WhatsAppInbox.tsx — 3-panel inbox shell
import * as React from "react";
import { Search, Plus, X, MessageSquare, RefreshCw, MoreVertical, Trash2 } from "lucide-react";
import { useConversations, useMessages } from "@/hooks/whatsapp/useConversations";
import { ErixBadge } from "@/components/ui/erix-badge";
import { ErixSpinner } from "@/components/ui/erix-spinner";
import { MessageBubble } from "./MessageBubble";
import { TemplateSelector } from "./TemplateSelector";
import type { Conversation, Message } from "@/types/platform";
import { cn } from "@/lib/utils";

// ─── Conversation row ──────────────────────────────────────────────────────────
function ConvRow({
  conv,
  active,
  onClick,
  onDelete,
}: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [hover, setHover] = React.useState(false);
  const initials = (conv.userName ?? conv.phone)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={cn(
        "erix-flex erix-cursor-pointer erix-items-center erix-gap-3 erix-rounded-xl px-3 py-2.5 transition-all",
        active ? "erix-bg-primary/10 erix-border erix-border-primary/20" : "hover:erix-bg-muted/60",
      )}
    >
      {/* Avatar */}
      <div className="erix-relative erix-shrink-0">
        <div className="erix-flex erix-size-10 erix-items-center erix-justify-center erix-rounded-full erix-bg-gradient-to-br erix-from-violet-500 erix-to-indigo-500 erix-text-xs font-semibold erix-text-white">
          {initials}
        </div>
        {conv.unreadCount > 0 && (
          <span className="erix-absolute -top-0.5 -right-0.5 erix-flex erix-size-4 erix-items-center erix-justify-center erix-rounded-full erix-bg-emerald-500 erix-text-[9px] font-bold erix-text-white">
            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
          </span>
        )}
      </div>
      {/* Info */}
      <div className="min-w-0 erix-flex-1">
        <div className="erix-flex erix-items-center erix-justify-between erix-gap-1">
          <p className="erix-truncate erix-text-sm font-medium erix-text-foreground">
            {conv.userName ?? conv.phone}
          </p>
          <ErixBadge
            variant={conv.status === "open" ? "success" : conv.status === "waiting" ? "warning" : "ghost"}
            size="sm"
            dot
          >
            {conv.status}
          </ErixBadge>
        </div>
        <p className="erix-truncate erix-text-xs erix-text-muted-foreground">{conv.phone}</p>
      </div>
      {/* Delete on hover */}
      {hover && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="erix-shrink-0 erix-rounded-md erix-p-1 erix-text-muted-foreground hover:erix-text-red-400 hover:erix-bg-red-500/10"
        >
          <Trash2 className="erix-size-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Chat Panel ────────────────────────────────────────────────────────────────
function ChatPanel({ conversationId }: { conversationId: string }) {
  const { messages, loading, send, appendMessage, loadBefore, hasMore } = useMessages(conversationId);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [templateOpen, setTemplateOpen] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await send({ text: text.trim() });
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="erix-flex erix-h-full erix-flex-col">
      {/* Message list */}
      <div className="erix-flex-1 erix-overflow-y-auto px-4 py-3 space-y-2">
        {hasMore && (
          <button
            type="button"
            onClick={loadBefore}
            className="erix-w-full erix-rounded-lg py-1.5 erix-text-xs erix-text-muted-foreground hover:erix-bg-muted transition-colors"
          >
            Load older messages
          </button>
        )}
        {loading && messages.length === 0 ? (
          <div className="erix-flex erix-h-full erix-items-center erix-justify-center">
            <ErixSpinner />
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg._id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="erix-border-t erix-border-border erix-p-3">
        <div className="erix-flex erix-items-end erix-gap-2 erix-rounded-xl erix-border erix-border-border erix-bg-muted/40 px-3 py-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Type a message…"
            rows={1}
            className="erix-flex-1 erix-resize-none erix-bg-transparent erix-text-sm erix-text-foreground placeholder:erix-text-muted-foreground focus:erix-outline-none"
          />
          <div className="erix-flex erix-shrink-0 erix-items-center erix-gap-1.5 pb-0.5">
            <button
              type="button"
              onClick={() => setTemplateOpen(true)}
              className="erix-rounded-lg px-2.5 py-1.5 erix-text-xs font-medium erix-text-muted-foreground hover:erix-bg-muted transition-colors erix-border erix-border-border"
            >
              Template
            </button>
            <button
              type="button"
              disabled={!text.trim() || sending}
              onClick={() => void handleSend()}
              className="erix-flex erix-size-8 erix-items-center erix-justify-center erix-rounded-lg erix-bg-primary erix-text-primary-foreground transition-opacity hover:erix-opacity-90 disabled:erix-opacity-40"
            >
              {sending ? <ErixSpinner size="sm" className="erix-text-white" /> : "↑"}
            </button>
          </div>
        </div>
      </div>

      {templateOpen && (
        <TemplateSelector
          onSelect={async (name, variables) => {
            await send({ templateName: name, variables });
            setTemplateOpen(false);
          }}
          onClose={() => setTemplateOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Main Inbox ────────────────────────────────────────────────────────────────
interface WhatsAppInboxProps {
  onLeadOpen?: (leadId: string) => void;
}

export function WhatsAppInbox({ onLeadOpen }: WhatsAppInboxProps) {
  const { conversations, loading, markRead, deleteConversation, refetch } = useConversations();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const active = conversations.find((c) => c._id === activeId) ?? null;

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.phone.includes(q) ||
        c.userName?.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  function handleSelect(conv: Conversation) {
    setActiveId(conv._id);
    if (conv.unreadCount > 0) void markRead(conv._id);
  }

  return (
    <div className="erix-flex erix-h-full erix-overflow-hidden erix-rounded-2xl erix-border erix-border-border erix-bg-card">
      {/* Left — Conversation list */}
      <div className="erix-flex erix-w-[300px] erix-shrink-0 erix-flex-col erix-border-r erix-border-border">
        {/* Header */}
        <div className="erix-flex erix-items-center erix-gap-2 erix-border-b erix-border-border px-3 py-3">
          <MessageSquare className="erix-size-4 erix-text-primary" />
          <span className="erix-flex-1 erix-text-sm font-semibold">Inbox</span>
          <button type="button" onClick={refetch} className="erix-rounded-md erix-p-1.5 erix-text-muted-foreground hover:erix-bg-muted">
            <RefreshCw className="erix-size-3.5" />
          </button>
        </div>
        {/* Search */}
        <div className="px-3 py-2">
          <div className="erix-flex erix-items-center erix-gap-2 erix-rounded-lg erix-border erix-border-border erix-bg-muted/40 px-2.5 py-1.5">
            <Search className="erix-size-3.5 erix-shrink-0 erix-text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="erix-flex-1 erix-bg-transparent erix-text-xs erix-text-foreground placeholder:erix-text-muted-foreground focus:erix-outline-none"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}>
                <X className="erix-size-3 erix-text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        {/* List */}
        <div className="erix-flex-1 erix-overflow-y-auto px-2 space-y-0.5 pb-2">
          {loading && conversations.length === 0 ? (
            <div className="erix-flex erix-h-32 erix-items-center erix-justify-center">
              <ErixSpinner />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 erix-text-center erix-text-xs erix-text-muted-foreground">No conversations</div>
          ) : (
            filtered.map((conv) => (
              <ConvRow
                key={conv._id}
                conv={conv}
                active={conv._id === activeId}
                onClick={() => handleSelect(conv)}
                onDelete={() => void deleteConversation(conv._id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Center — Chat window */}
      <div className="erix-flex erix-flex-1 erix-flex-col erix-overflow-hidden">
        {active ? (
          <>
            {/* Chat header */}
            <div className="erix-flex erix-items-center erix-gap-3 erix-border-b erix-border-border px-4 py-3">
              <div className="erix-flex erix-size-8 erix-items-center erix-justify-center erix-rounded-full erix-bg-gradient-to-br erix-from-violet-500 erix-to-indigo-500 erix-text-xs font-semibold erix-text-white">
                {(active.userName ?? active.phone)[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 erix-flex-1">
                <p className="erix-text-sm font-semibold">{active.userName ?? active.phone}</p>
                <p className="erix-text-xs erix-text-muted-foreground">{active.phone}</p>
              </div>
              {active.leadId && (
                <button
                  type="button"
                  onClick={() => onLeadOpen?.(active.leadId!)}
                  className="erix-rounded-lg erix-border erix-border-border px-2.5 py-1 erix-text-xs erix-text-muted-foreground hover:erix-bg-muted transition-colors"
                >
                  View Lead
                </button>
              )}
            </div>
            <ChatPanel conversationId={active._id} />
          </>
        ) : (
          <div className="erix-flex erix-flex-1 erix-flex-col erix-items-center erix-justify-center erix-gap-3 erix-text-muted-foreground">
            <MessageSquare className="erix-size-12 erix-opacity-20" />
            <p className="erix-text-sm">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
