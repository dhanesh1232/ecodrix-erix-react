"use client";
// src/hooks/whatsapp/useConversations.ts
import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";
import type { Conversation, Message } from "@/types/platform";

export function useConversations() {
  const sdk = useErixClient();
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading]             = React.useState(false);
  const [hasMore, setHasMore]             = React.useState(false);
  const [error, setError]                 = React.useState<string | null>(null);

  const fetch_ = React.useCallback(async (before?: string, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await sdk.whatsapp.conversations.list({ limit: 25, before });
      if (signal?.aborted) return;
      const items: Conversation[] = res?.data ?? [];
      if (before) {
        setConversations((prev) => [...prev, ...items]);
      } else {
        setConversations(items);
      }
      setHasMore(res?.hasMore ?? false);
    } catch (e) {
      if (signal?.aborted) return;
      setError((e as Error).message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [sdk]);

  React.useEffect(() => {
    const ctrl = new AbortController();
    void fetch_(undefined, ctrl.signal);
    return () => ctrl.abort();
  }, [fetch_]);

  const markRead = React.useCallback(async (conversationId: string) => {
    await sdk.whatsapp.conversations.markRead(conversationId);
    setConversations((prev) =>
      prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c)),
    );
  }, [sdk]);

  const deleteConversation = React.useCallback(async (id: string) => {
    await sdk.whatsapp.conversations.delete(id);
    setConversations((prev) => prev.filter((c) => c._id !== id));
  }, [sdk]);

  const createConversation = React.useCallback(async (phone: string, name?: string): Promise<Conversation> => {
    const res: any = await sdk.whatsapp.conversations.create({ phone, name });
    const created  = (res?.data ?? res) as Conversation;
    setConversations((prev) => [created, ...prev]);
    return created;
  }, [sdk]);

  return {
    conversations,
    loading,
    hasMore,
    error,
    loadMore: () => {
      const last = conversations[conversations.length - 1];
      if (last?.lastMessageAt) void fetch_(last.lastMessageAt);
    },
    markRead,
    deleteConversation,
    createConversation,
    refetch: () => fetch_(),
    /** Optimistic bump — move conversation to top after a new outbound message */
    bumpConversation: (id: string) => {
      setConversations((prev) => {
        const target = prev.find((c) => c._id === id);
        if (!target) return prev;
        return [
          { ...target, lastMessageAt: new Date().toISOString() },
          ...prev.filter((c) => c._id !== id),
        ];
      });
    },
  };
}

export function useMessages(conversationId: string | null) {
  const sdk = useErixClient();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading]   = React.useState(false);
  const [hasMore, setHasMore]   = React.useState(false);
  const [error, setError]       = React.useState<string | null>(null);

  const fetch_ = React.useCallback(async (before?: string, signal?: AbortSignal) => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const res: any = await sdk.whatsapp.conversations.messages(conversationId, {
        limit: 50,
        before,
      });
      if (signal?.aborted) return;
      const items: Message[] = res?.data ?? [];
      if (before) {
        setMessages((prev) => [...items, ...prev]);
      } else {
        setMessages(items);
      }
      setHasMore(res?.hasMore ?? false);
    } catch (e) {
      if (signal?.aborted) return;
      setError((e as Error).message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [sdk, conversationId]);

  React.useEffect(() => {
    const ctrl = new AbortController();
    void fetch_(undefined, ctrl.signal);
    return () => ctrl.abort();
  }, [fetch_]);

  const send = React.useCallback(async (payload: {
    text?:         string;
    mediaUrl?:     string;
    mediaType?:    string;
    templateName?: string;
    variables?:    string[];
    replyToId?:    string;
  }): Promise<Message> => {
    let res: any;
    if (payload.templateName) {
      const conv: any = await sdk.whatsapp.conversations.retrieve(conversationId!);
      const phone: string = conv?.data?.phone ?? conv?.phone ?? "";
      res = await sdk.whatsapp.messages.sendTemplate({
        to:           phone,
        templateName: payload.templateName,
        variables:    payload.variables,
        mediaUrl:     payload.mediaUrl,
        mediaType:    payload.mediaType as any,
      });
    } else {
      res = await sdk.request("POST", "/api/saas/chat/send", {
        conversationId,
        ...payload,
      });
    }
    const msg = (res?.data?.message ?? res?.message ?? res?.data ?? res) as Message;
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, [sdk, conversationId]);

  const starMessage = React.useCallback(async (messageId: string, isStarred: boolean) => {
    await sdk.whatsapp.messages.star(messageId, isStarred);
    setMessages((prev) =>
      prev.map((m) => (m._id === messageId ? { ...m, isStarred } : m)),
    );
  }, [sdk]);

  /** Push an inbound message from a WebSocket listener */
  const appendMessage = React.useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  return {
    messages,
    loading,
    hasMore,
    error,
    loadBefore: () => {
      const first = messages[0];
      if (first?.createdAt) void fetch_(first.createdAt);
    },
    send,
    starMessage,
    appendMessage,
    refetch: () => fetch_(),
  };
}
