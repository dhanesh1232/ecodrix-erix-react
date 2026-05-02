import { useEffect, useCallback } from "react";
import { useErixClient } from "../../context/ErixProvider";

export interface WhatsAppSocketOptions {
  onNewMessage?: (data: any) => void;
  onMessageSent?: (data: any) => void;
  onStatusUpdate?: (data: any) => void;
  onLeadUpdate?: (data: any) => void;
  onTypingStatus?: (data: any) => void;
  activeChatId?: string;
}

/**
 * useWhatsAppSocket
 *
 * Bridges the Ecodrix SDK's persistent socket connection with
 * WhatsApp-specific UI events.
 */
export function useWhatsAppSocket({
  onNewMessage,
  onMessageSent,
  onStatusUpdate,
  onLeadUpdate,
  onTypingStatus,
  activeChatId,
}: WhatsAppSocketOptions = {}) {
  const client = useErixClient();

  // New Message Handler
  const handleNewMessage = useCallback(
    (data: any) => {
      if (onNewMessage) onNewMessage(data);
    },
    [onNewMessage],
  );

  // Message Sent Handler
  const handleMessageSent = useCallback(
    (data: any) => {
      if (onMessageSent) onMessageSent(data);
    },
    [onMessageSent],
  );

  // Status Update Handler
  const handleStatusUpdate = useCallback(
    (data: any) => {
      if (onStatusUpdate) onStatusUpdate(data);
    },
    [onStatusUpdate],
  );

  // Lead Update Handler
  const handleLeadUpdate = useCallback(
    (data: any) => {
      if (onLeadUpdate) onLeadUpdate(data);
    },
    [onLeadUpdate],
  );

  // Typing Status Handler
  const handleTypingStatus = useCallback(
    (data: any) => {
      if (onTypingStatus) onTypingStatus(data);
    },
    [onTypingStatus],
  );

  useEffect(() => {
    if (!client) return;

    // Join room for active chat if applicable
    if (activeChatId) {
      client.joinRoom(activeChatId);
    }

    // Subscribe to events (aligned with backend names)
    client.on("new_message", handleNewMessage);
    client.on("message_sent", handleMessageSent);
    client.on("message_status_update", handleStatusUpdate);
    client.on("lead_update", handleLeadUpdate);
    client.on("whatsapp.typing_status", handleTypingStatus);

    return () => {
      // Unsubscribe from events
      client.off("new_message", handleNewMessage);
      client.off("message_sent", handleMessageSent);
      client.off("message_status_update", handleStatusUpdate);
      client.off("lead_update", handleLeadUpdate);
      client.off("whatsapp.typing_status", handleTypingStatus);

      if (activeChatId) {
        client.leaveRoom(activeChatId);
      }
    };
  }, [
    client,
    activeChatId,
    handleNewMessage,
    handleMessageSent,
    handleStatusUpdate,
    handleLeadUpdate,
    handleTypingStatus,
  ]);

  return {
    isActive: !!client,
    socket: client,
  };
}
