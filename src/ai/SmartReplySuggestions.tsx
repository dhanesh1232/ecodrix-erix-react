"use client";
// src/ai/SmartReplySuggestions.tsx
import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useSmartReplies } from "./useErixAi";

interface SmartReplySuggestionsProps {
  conversationId: string;
  lastMessage?:   string;
  /** Called when user picks a suggestion */
  onSelect:       (text: string) => void;
}

/**
 * Renders AI-generated smart reply suggestions below the chat input.
 * Auto-generates when lastMessage changes.
 *
 * @example
 * ```tsx
 * <SmartReplySuggestions
 *   conversationId={conv._id}
 *   lastMessage={messages[messages.length - 1]?.text}
 *   onSelect={(text) => setInputValue(text)}
 * />
 * ```
 */
export function SmartReplySuggestions({ conversationId, lastMessage, onSelect }: SmartReplySuggestionsProps) {
  const { suggestions, loading, generate } = useSmartReplies(conversationId);

  React.useEffect(() => {
    if (lastMessage) void generate(lastMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

  if (!loading && suggestions.length === 0) return null;

  return (
    <div style={{ display: "erix-flex", gap: 6, flexWrap: "wrap", padding: "6px 0" }}>
      {loading ? (
        <span style={{ display: "erix-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94a3b8" }}>
          <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
          Thinking…
        </span>
      ) : (
        <>
          <span style={{ color: "#6366f1", display: "erix-flex", alignItems: "center", gap: 3, fontSize: 11 }}>
            <Sparkles size={11} /> AI suggests:
          </span>
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.text)}
              style={{
                background: "#1e293b", border: "1px solid #334155",
                borderRadius: 20, padding: "3px 10px",
                fontSize: 12, color: "#e2e8f0", cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {s.text}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
