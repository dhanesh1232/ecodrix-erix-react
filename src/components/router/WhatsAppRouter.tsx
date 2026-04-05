"use client";
/**
 * components/router/WhatsAppRouter.tsx
 * Sub-router for the WhatsApp module.
 *
 * Sub-path mapping:
 *   ""                  → WhatsAppInbox (full split-pane inbox)
 *   ":conversationId"   → WhatsAppInbox with specific conversation open
 */

import * as React from "react";
import { matchSubPath } from "@/routing/match";
import { useErixRoute } from "@/routing/RouterContext";
import { WhatsAppInbox } from "../whatsapp/WhatsAppInbox";

export const WhatsAppRouter: React.FC = () => {
  const { subPath } = useErixRoute();

  if (!subPath) {
    return <WhatsAppInbox />;
  }

  // WhatsAppInbox manages its own active conversation state internally.
  // Future: pass initialConversationId when the component supports it.
  return <WhatsAppInbox />;
};
