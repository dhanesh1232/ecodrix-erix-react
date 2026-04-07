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
  const [selectedChatData, setSelectedChatData] = useState<any | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesCache, setMessagesCache] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isConversationsLoading, setIsConversationsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMoreCache, setHasMoreCache] = useState<Record<string, boolean>>({});
  const [hasMoreConversations, setHasMoreConversations] = useState(false);

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

  // Initial Load
  useEffect(() => {
    const loadConversations = async () => {
      setIsConversationsLoading(true);
      try {
        const result = await sdk.whatsapp.conversations.list<any>({
          limit: 25,
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

  // Sync selectedContactId with URL
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

  // Socket Handlers
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
                  : existingConv.unread + 1,
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
    },
  });

  // Load Messages for Selected Chat
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
        console.error("Failed to load messages", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMessages();

    // Mark as read
    sdk.whatsapp.conversations.markRead(currentId);

    return () => {
      isMounted = false;
    };
  }, [selectedContactId, sdk, mapMessage]);

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
        throw new Error(
          (result as unknown as { error: string }).error || "Failed to send",
        );

      const realMsg = mapMessage(result.data?.data || result.data);
      setMessages((prev) => prev.map((m) => (m._id === tempId ? realMsg : m)));
    } catch (error: any) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      toast.error(error.message || "Failed to send message");
      throw error;
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
    <div className="erix-bg-background erix-flex erix-h-full erix-w-full erix-overflow-hidden erix-rounded-xl erix-border erix-shadow-sm">
      <InboxSidebar
        conversations={conversations}
        selectedId={selectedContactId}
        onSelect={handleContactSelect}
        isLoading={isConversationsLoading}
      />

      <div className="erix-relative erix-flex erix-flex-1 erix-flex-col erix-overflow-hidden">
        {selectedContactId ? (
          isLoading && !messages.length ? (
            <ChatWindowSkeleton chat={selectedChatData} />
          ) : (
            <ChatWindow
              chat={selectedChatData}
              messages={messages}
              onSendMessage={handleSendMessage}
              onBack={handleBack}
              conversations={conversations}
              isLoading={isLoading}
              hasMore={hasMore}
              onLoadMore={() => {}} // TODO: implement load more
              isFetchingMore={isFetchingMore}
            />
          )
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
