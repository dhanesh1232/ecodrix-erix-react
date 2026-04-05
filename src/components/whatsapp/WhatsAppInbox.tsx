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
        "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
        active ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/60",
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-semibold text-white">
          {initials}
        </div>
        {conv.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
          </span>
        )}
      </div>
      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-sm font-medium text-foreground">
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
        <p className="truncate text-xs text-muted-foreground">{conv.phone}</p>
      </div>
      {/* Delete on hover */}
      {hover && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="size-3.5" />
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
    <div className="flex h-full flex-col">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {hasMore && (
          <button
            type="button"
            onClick={loadBefore}
            className="w-full rounded-lg py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            Load older messages
          </button>
        )}
        {loading && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <ErixSpinner />
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg._id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
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
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex shrink-0 items-center gap-1.5 pb-0.5">
            <button
              type="button"
              onClick={() => setTemplateOpen(true)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors border border-border"
            >
              Template
            </button>
            <button
              type="button"
              disabled={!text.trim() || sending}
              onClick={() => void handleSend()}
              className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {sending ? <ErixSpinner size="sm" className="text-white" /> : "↑"}
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
    <div className="flex h-full overflow-hidden rounded-2xl border border-border bg-card">
      {/* Left — Conversation list */}
      <div className="flex w-[300px] shrink-0 flex-col border-r border-border">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-3">
          <MessageSquare className="size-4 text-primary" />
          <span className="flex-1 text-sm font-semibold">Inbox</span>
          <button type="button" onClick={refetch} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <RefreshCw className="size-3.5" />
          </button>
        </div>
        {/* Search */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}>
                <X className="size-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2">
          {loading && conversations.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <ErixSpinner />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">No conversations</div>
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
      <div className="flex flex-1 flex-col overflow-hidden">
        {active ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-semibold text-white">
                {(active.userName ?? active.phone)[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{active.userName ?? active.phone}</p>
                <p className="text-xs text-muted-foreground">{active.phone}</p>
              </div>
              {active.leadId && (
                <button
                  type="button"
                  onClick={() => onLeadOpen?.(active.leadId!)}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  View Lead
                </button>
              )}
            </div>
            <ChatPanel conversationId={active._id} />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageSquare className="size-12 opacity-20" />
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
