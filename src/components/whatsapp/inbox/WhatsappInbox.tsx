"use client";

import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useErixClient } from "../../../context/ErixProvider";
import { useWhatsAppSocket } from "../../../hooks/whatsapp/useWhatsAppSocket";
import { useErixToast } from "../../../toast/useErixToast";
import { cn } from "../../../lib/utils";

import { ChatWindow } from "./chat-panel/ChatWindow";
import { ChatWindowSkeleton } from "./ChatWindowSkeleton";
import { EmptyState } from "./EmptyState";
import { InboxSidebar } from "./sidebar/InboxSidebar";

const safeFormat = (date: any, formatStr: string) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, formatStr);
};

const formatSidebarDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return safeFormat(date, "h:mm a");
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
};

export function WhatsappInbox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialContactId = searchParams.get("conversation");
  const sdk = useErixClient();
  const toast = useErixToast();

  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    initialContactId,
  );
  // Dedicated chat metadata state — set instantly on click or fetched by ID on URL load.
  const [selectedChatData, setSelectedChatData] = useState<any | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesCache, setMessagesCache] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isConversationsLoading, setIsConversationsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMoreCache, setHasMoreCache] = useState<Record<string, boolean>>({});
  // Conversations pagination
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [isFetchingMoreConversations, setIsFetchingMoreConversations] =
    useState(false);

  // Dynamic Height Detection
  const [headerHeight, setHeaderHeight] = useState(0);

  // Helper to map backend conversation to frontend model
  const mapConversation = useCallback(
    (c: any) => ({
      id: c._id || c.id,
      name: c.userName || c.phone,
      lastMessage: c.lastMessage || "No messages",
      time: c.lastMessageAt ? formatSidebarDate(c.lastMessageAt) : "",
      unread: c.unreadCount,
      avatar: (c.userName || c.phone || "?").slice(0, 2).toUpperCase(),
      profilePicture: c.profilePicture,
      phone: c.phone,
      lastMessageAt: c.lastMessageAt ? new Date(c.lastMessageAt).getTime() : 0,
      lastMessageStatus: c.lastMessageStatus,
      lastMessageSender: c.lastMessageSender,
      lastMessageType: c.lastMessageType,
      direction: c.direction,
      leadId: c.leadId,
      ...c,
    }),
    [],
  );

  // Helper to map backend message to frontend model
  const mapMessage = useCallback((m: any) => {
    if (!m) return null as any;
    return {
      id: m._id || m.id,
      sender: m.direction === "outbound" ? "admin" : "user",
      text: m.text || m.body || "",
      type: m.messageType || m.type || "text",
      mediaUrl: m.mediaUrl,
      time: safeFormat(m.createdAt || new Date(), "h:mm a"),
      fullDate: m.createdAt || new Date().toISOString(),
      status: m.status || "sent",
      direction: m.direction || "outbound",
      leadId: m.leadId,
      ...m,
    };
  }, []);

  const selectedContactIdRef = useRef(selectedContactId);
  useEffect(() => {
    selectedContactIdRef.current = selectedContactId;
  }, [selectedContactId]);

  const messagesCacheRef = useRef<Record<string, any[]>>({});
  const hasMoreCacheRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    messagesCacheRef.current = messagesCache;
  }, [messagesCache]);
  useEffect(() => {
    hasMoreCacheRef.current = hasMoreCache;
  }, [hasMoreCache]);

  // Dynamic Height Detection Logic
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector("[data-header-height]");
      if (header instanceof HTMLElement) {
        setHeaderHeight(header.offsetHeight);
      } else {
        setHeaderHeight(0);
      }
    };

    updateHeaderHeight();

    // ResizeObserver to handle header height changes (e.g. mobile responsiveness)
    const header = document.querySelector("[data-header-height]");
    let resizeObserver: ResizeObserver | null = null;

    if (header instanceof HTMLElement) {
      resizeObserver = new ResizeObserver(() => updateHeaderHeight());
      resizeObserver.observe(header);
    }

    window.addEventListener("resize", updateHeaderHeight);
    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
      resizeObserver?.disconnect();
    };
  }, []);

  // Sync selectedChatData from conversations list.
  useEffect(() => {
    if (!selectedContactId || conversations.length === 0) return;
    const found = conversations.find(
      (c) =>
        String(c.id) === String(selectedContactId) ||
        String(c._id) === String(selectedContactId),
    );
    if (found) {
      setSelectedChatData(found);
    }
  }, [conversations, selectedContactId]);

  // Initial Load & Socket Handlers
  useEffect(() => {
    const loadConversations = async () => {
      setIsConversationsLoading(true);
      try {
        const result = await sdk.whatsapp.conversations.list<any>({
          limit: 10,
        });
        if (result.success && result.data) {
          const data = result.data?.data || result.data || [];
          if (Array.isArray(data)) {
            const mapped = data.map(mapConversation);
            setConversations(mapped);
            setHasMoreConversations(result.data?.hasMore || false);
          }
        }
      } catch (err) {
        console.error("Failed to load chats", err);
      } finally {
        setIsConversationsLoading(false);
      }
    };
    loadConversations();
  }, [sdk, mapConversation]);

  // Synchronize URL with state
  useEffect(() => {
    const paramsId = searchParams.get("conversation");
    if (paramsId !== selectedContactId) {
      setSelectedContactId(paramsId);
      if (paramsId) {
        const chat = conversations.find(
          (c) =>
            String(c.id) === String(paramsId) ||
            String(c._id) === String(paramsId),
        );
        setSelectedChatData(chat ?? null);
      } else {
        setSelectedChatData(null);
      }
    }
  }, [searchParams, conversations, selectedContactId]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedContactId) {
        if (window.matchMedia("(min-width: 1024px)").matches) {
          handleBack();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedContactId]);

  // Socket listener integration
  useWhatsAppSocket({
    onNewMessage: (payload: any) => {
      const currentSelectedId = String(selectedContactIdRef.current);
      const incomingMsg = payload.message || payload;
      const conversationIdStr = String(
        incomingMsg.conversationId?._id ||
          incomingMsg.conversationId ||
          incomingMsg._id,
      );

      setConversations((prev) => {
        const existingIndex = prev.findIndex(
          (c) =>
            String(c.id) === conversationIdStr ||
            String(c._id) === conversationIdStr,
        );

        let updatedConv;
        if (existingIndex === -1) {
          updatedConv = mapConversation({
            ...payload,
            lastMessage: incomingMsg.text || "Media",
            lastMessageType: incomingMsg.messageType,
            lastMessageAt: incomingMsg.createdAt,
            unreadCount: incomingMsg.direction === "outbound" ? 0 : 1,
            lastMessageSender:
              incomingMsg.direction === "outbound" ? "admin" : "user",
            lastMessageStatus: incomingMsg.status || "delivered",
            _id: incomingMsg.conversationId,
          });
        } else {
          const existingConv = prev[existingIndex];
          updatedConv = {
            ...existingConv,
            lastMessage: incomingMsg.text || "Media",
            lastMessageType: incomingMsg.messageType,
            lastMessageAt: new Date(incomingMsg.createdAt).getTime(),
            time: formatSidebarDate(incomingMsg.createdAt),
            unread:
              currentSelectedId === conversationIdStr
                ? 0
                : incomingMsg.direction === "outbound"
                  ? existingConv.unread
                  : (existingConv.unread || 0) + 1,
            lastMessageSender:
              incomingMsg.direction === "outbound" ? "admin" : "user",
            lastMessageStatus: incomingMsg.status || "delivered",
          };
        }

        const newList = [...prev];
        if (existingIndex !== -1) newList.splice(existingIndex, 1);
        newList.unshift(updatedConv);
        return newList;
      });

      setMessagesCache((prev) => {
        const existing = prev[conversationIdStr] || [];
        if (existing.some((m) => String(m.id) === String(incomingMsg._id)))
          return prev;
        return {
          ...prev,
          [conversationIdStr]: [...existing, mapMessage(incomingMsg)],
        };
      });

      if (currentSelectedId === conversationIdStr) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(incomingMsg._id)))
            return prev;
          return [...prev, mapMessage(incomingMsg)];
        });
      } else if (incomingMsg.direction !== "outbound") {
        const senderName = payload.userName || payload.phone || "Customer";
        toast.info(`New message from ${senderName}`);
      }
    },
    onMessageSent: (msg: any) => {
      const currentSelectedId = String(selectedContactIdRef.current);
      const conversationIdStr = String(
        msg.conversationId?._id || msg.conversationId,
      );

      setMessagesCache((prev) => {
        const existing = prev[conversationIdStr] || [];
        const exists = existing.find((m) => String(m.id) === String(msg._id));
        const newArray = exists
          ? existing.map((m) =>
              String(m.id) === String(msg._id) ? mapMessage(msg) : m,
            )
          : [...existing, mapMessage(msg)];
        return { ...prev, [conversationIdStr]: newArray };
      });

      if (currentSelectedId === conversationIdStr) {
        setMessages((prev) => {
          const exists = prev.find((m) => String(m.id) === String(msg._id));
          return exists
            ? prev.map((m) =>
                String(m.id) === String(msg._id) ? mapMessage(msg) : m,
              )
            : [...prev, mapMessage(msg)];
        });
      }
    },
    onStatusUpdate: (payload: any) => {
      const convId = String(payload.conversationId);
      const msgId = String(payload.messageId);

      setMessages((prev) =>
        prev.map((m) =>
          String(m.id) === msgId ? { ...m, status: payload.status } : m,
        ),
      );

      setMessagesCache((prev) => {
        const existing = prev[convId];
        if (!existing) return prev;
        return {
          ...prev,
          [convId]: existing.map((m) =>
            String(m.id) === msgId ? { ...m, status: payload.status } : m,
          ),
        };
      });

      setConversations((prev) =>
        prev.map((c) => {
          if (String(c.id) === convId && String(c.lastMessageId) === msgId) {
            return { ...c, lastMessageStatus: payload.status };
          }
          return c;
        }),
      );
    },
  });

  // Background Pre-fetching for top conversations
  useEffect(() => {
    if (conversations.length === 0) return;
    const topChats = conversations.slice(0, 5);

    topChats.forEach((chat, index) => {
      const chatId = String(chat.id || chat._id);
      if (messagesCacheRef.current[chatId]) return;

      setTimeout(() => {
        sdk.whatsapp.conversations
          .messages<any>(chatId, { limit: 25 })
          .then((result) => {
            if (result.success && result.data) {
              const data = result.data?.data || result.data || [];
              if (Array.isArray(data)) {
                const mapped = data.map(mapMessage);
                setMessagesCache((prev) => {
                  if (prev[chatId]) return prev;
                  return { ...prev, [chatId]: mapped };
                });
                setHasMoreCache((prev) => ({
                  ...prev,
                  [chatId]: result.data?.hasMore || false,
                }));
              }
            }
          })
          .catch(() => {});
      }, index * 300);
    });
  }, [conversations.length, sdk, mapMessage]);

  // Load Messages for Selected Chat — with Cache-First "Zero-Flash" logic
  useEffect(() => {
    if (!selectedContactId) return;

    let isMounted = true;
    const currentId = selectedContactId;

    if (!messagesCacheRef.current[currentId]?.length) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
      setMessages(messagesCacheRef.current[currentId]!);
      setHasMore(hasMoreCacheRef.current[currentId] ?? false);
    }

    const fetchMessages = async () => {
      try {
        const result = await sdk.whatsapp.conversations.messages<any>(
          currentId,
          { limit: 25 },
        );
        if (isMounted && result.success && result.data) {
          const data = result.data?.data || result.data || [];
          if (Array.isArray(data)) {
            const mapped = data.map(mapMessage);
            if (isMounted && selectedContactIdRef.current === currentId) {
              setMessages(mapped);
              setHasMore(result.data?.hasMore || false);
            }
            setMessagesCache((prev) => ({ ...prev, [currentId]: mapped }));
            setHasMoreCache((prev) => ({
              ...prev,
              [currentId]: result.data?.hasMore || false,
            }));
          }
        }
      } catch (err) {
        if (isMounted) console.error("Failed to load messages", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMessages();
    sdk.whatsapp.conversations.markRead(currentId);

    return () => {
      isMounted = false;
    };
  }, [selectedContactId, sdk, mapMessage]);

  const handleLoadMoreMessages = async () => {
    if (!selectedContactId || isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    try {
      const oldestMessage = messages[0];
      const before = oldestMessage ? oldestMessage.fullDate : null;
      if (!before) return;

      const result = await sdk.whatsapp.conversations.messages<any>(
        selectedContactId,
        { limit: 25, before },
      );

      if (result.success && result.data) {
        const data = result.data?.data || result.data || [];
        if (Array.isArray(data)) {
          const mapped = data.map(mapMessage);
          const newMessages = [...mapped, ...messages];
          setMessages(newMessages);
          setHasMore(result.data?.hasMore || false);
          setMessagesCache((prev) => ({
            ...prev,
            [selectedContactId]: newMessages,
          }));
          setHasMoreCache((prev) => ({
            ...prev,
            [selectedContactId]: result.data?.hasMore || false,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load more messages", err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const handleLoadMoreConversations = async () => {
    if (isFetchingMoreConversations || !hasMoreConversations) return;
    setIsFetchingMoreConversations(true);
    try {
      const oldest = conversations[conversations.length - 1];
      const before = oldest?.lastMessageAt
        ? new Date(oldest.lastMessageAt).toISOString()
        : null;
      if (!before) return;

      const result = await sdk.whatsapp.conversations.list<any>({
        limit: 20,
        before,
      });
      if (result.success && result.data) {
        const data = result.data?.data || result.data || [];
        if (Array.isArray(data)) {
          const mapped = data.map(mapConversation);
          setConversations((prev) => [...prev, ...mapped]);
          setHasMoreConversations(result.data?.hasMore || false);
        }
      }
    } catch (err) {
      console.error("Failed to load more conversations", err);
    } finally {
      setIsFetchingMoreConversations(false);
    }
  };

  const handleSendMessage = async (
    text?: string,
    mediaUrl?: string,
    mediaType?: string,
    templateName?: string,
    templateLanguage?: string,
    variables?: string[],
    replyToId?: string,
    filename?: string,
  ) => {
    if (!selectedContactId) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = mapMessage({
      _id: tempId,
      text: text || "",
      direction: "outbound",
      status: "queued",
      createdAt: new Date().toISOString(),
      messageType: mediaType || (templateName ? "template" : "text"),
      mediaUrl,
      filename,
    });

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const result = await sdk.whatsapp.messages.send<any>({
        to: selectedChatData?.phone || selectedContactId,
        text: text || "",
        mediaUrl,
        mediaType: mediaType as any,
        templateName,
        language: templateLanguage,
        variables,
        replyToId,
        filename,
      });

      if (!result.success)
        throw new Error((result as any).error || "Failed to send");

      const realMsg = mapMessage(result.data?.data || result.data);
      setMessages((prev) => prev.map((m) => (m._id === tempId ? realMsg : m)));
    } catch (error: any) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      toast.error(error.message || "Failed to send message");
      throw error;
    }
  };

  const handleForwardMessage = async (
    msg: any,
    targetConversationId: string,
  ) => {
    const targetChat = conversations.find(
      (c) => String(c.id) === String(targetConversationId),
    );
    if (!targetChat) return;

    try {
      const result = await sdk.whatsapp.messages.send<any>({
        to: targetChat.phone,
        text: msg.text || "",
        mediaUrl: msg.mediaUrl,
        mediaType: msg.type,
      });
      if (!result.success)
        throw new Error((result as any).error || "Failed to forward");
      toast.success("Message forwarded");
    } catch (error: any) {
      toast.error(error.message || "Failed to forward message");
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const result = await sdk.whatsapp.conversations.delete(id);
      if (!(result as unknown as { success: boolean }).success)
        throw new Error((result as any).error || "Failed");

      toast.success("Conversation deleted");
      setConversations((prev) =>
        prev.filter((c) => String(c.id) !== String(id)),
      );
      if (selectedContactId === id) handleBack();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleRefresh = async () => {
    if (!selectedContactId) return;
    toast.info("Refreshing...");
    try {
      const convResult = await sdk.whatsapp.conversations.list<any>({
        limit: 10,
      });
      if (convResult.success)
        setConversations((convResult.data?.data || []).map(mapConversation));

      setIsLoading(true);
      const msgResult = await sdk.whatsapp.conversations.messages<any>(
        selectedContactId,
        { limit: 25 },
      );
      if (msgResult.success) {
        const mapped = (msgResult.data?.data || []).map(mapMessage);
        setMessages(mapped);
        setHasMore(msgResult.data?.hasMore || false);
        setMessagesCache((prev) => ({ ...prev, [selectedContactId]: mapped }));
      }
      toast.success("Refreshed");
    } catch (error) {
      toast.error("Failed to refresh");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSelect = (id: string) => {
    const chat = conversations.find((c) => String(c.id) === String(id));
    const cachedMessages = messagesCacheRef.current[id];

    setSelectedContactId(id);
    setSelectedChatData(chat ?? null);
    setMessages(cachedMessages ?? []);
    setHasMore(hasMoreCacheRef.current[id] ?? false);
    setIsLoading(!cachedMessages?.length);

    router.push(`/admin/communication/whatsapp?conversation=${id}`, {
      scroll: false,
    });
  };

  const handleBack = () => {
    setSelectedContactId(null);
    setSelectedChatData(null);
    router.push("/admin/communication/whatsapp", { scroll: false });
  };

  return (
    <div
      style={{ height: `calc(100dvh - ${headerHeight}px)` }}
      className="erix-border-border erix-bg-card erix-flex erix-w-full erix-overflow-hidden erix-border erix-transition-all erix-duration-200"
    >
      <InboxSidebar
        conversations={conversations}
        selectedId={selectedContactId}
        onSelect={handleContactSelect}
        className={selectedContactId ? "erix-hidden lg:erix-flex" : "erix-flex"}
        isLoading={isConversationsLoading}
        isNewChatOpen={isNewChatOpen}
        setIsNewChatOpen={setIsNewChatOpen}
        hasMoreConversations={hasMoreConversations}
        isFetchingMoreConversations={isFetchingMoreConversations}
        onLoadMoreConversations={handleLoadMoreConversations}
      />

      <div
        className={cn(
          "erix-flex erix-min-w-0 erix-flex-1 erix-flex-col erix-overflow-hidden erix-transition-all",
          !selectedContactId && "erix-hidden lg:erix-flex",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add("erix-bg-primary/5");
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove("erix-bg-primary/5");
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("erix-bg-primary/5");
          const id = e.dataTransfer.getData("conversationId");
          if (id) handleContactSelect(id);
        }}
      >
        {selectedContactId ? (
          !selectedChatData && isLoading && !messages.length ? (
            <ChatWindowSkeleton
              className={
                !selectedContactId ? "erix-hidden lg:erix-flex" : "erix-flex"
              }
            />
          ) : (
            <ChatWindow
              key={selectedContactId}
              chat={selectedChatData}
              messages={messages}
              conversations={conversations}
              onBack={handleBack}
              className={
                !selectedContactId ? "erix-hidden lg:erix-flex" : "erix-flex"
              }
              onSendMessage={handleSendMessage}
              onForwardMessage={handleForwardMessage}
              onDeleteConversation={handleDeleteConversation}
              onStartNewChat={() => setIsNewChatOpen(true)}
              hasMore={hasMore}
              isFetchingMore={isFetchingMore}
              onLoadMore={handleLoadMoreMessages}
              isLoading={isLoading}
              onRefresh={handleRefresh}
            />
          )
        ) : (
          <EmptyState
            className={
              !selectedContactId ? "erix-hidden lg:erix-flex" : "erix-flex"
            }
          />
        )}
      </div>
    </div>
  );
}
