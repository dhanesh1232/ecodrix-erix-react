// src/app/page.tsx — live demo for the dev server
"use client";
import { useState } from "react";
import { ErixEditor } from "@/components/richtext/editor";
import { AiAction, AiProvider } from "@/types/erix";

const mockAiProvider: AiProvider = {
  name: "Ecodrix AI",
  enhance: async (text: string, action: AiAction, context?: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In production, this would be a fetch to api.ecodrix.com/v1/ai/enhance
    if (action === "improve") return `✨ Improved: ${text}`;
    if (action === "summarize")
      return `📝 Summary: ${text.substring(0, 50)}...`;
    if (action === "translate") return `🌍 Translated: ${text}`;
    if (action === "make_shorter")
      return `✂️ Shortened: ${text.substring(0, Math.floor(text.length / 2))}`;
    if (action === "make_longer")
      return `➕ Expanded: ${text} with a lot more detail added here to make it significantly longer.`;
    if (action === "custom")
      return `💡 Custom (${context}): AI response to "${text}"`;
    return `✅ AI processed (${action}): ${text}`;
  },
};

export default function Page() {
  const [html, setHtml] = useState("");

  return (
    <div className="erix-w-full erix-min-h-screen erix-overflow-auto erix-flex erix-flex-col lg:erix-flex-row erix-items-start erix-justify-center erix-gap-6 erix-p-6 erix-bg-background">
      {/* Editor */}
      <div className="erix-w-full lg:erix-w-7/12 erix-flex erix-flex-col erix-gap-4">
        <h1 className="erix-text-2xl erix-font-bold erix-tracking-tight">
          Erix Rich Text Editor
        </h1>
        <ErixEditor
          apiKey={process.env.NEXT_PUBLIC_ERIX_API_KEY as string}
          shortcutsEnabled={true}
          placeholder="Type '/' for commands…"
          onChange={setHtml}
          aiProvider={mockAiProvider}
          style={{ height: "480px", border: { radius: "lg" }, shadow: "md" }}
          toolbar={{
            history: true,
            textFormat: true,
            headings: true,
            lists: true,
            alignment: true,
            indent: true,
            colors: true,
            link: true,
            image: true,
            table: true,
            blocks: true,
          }}
        />
      </div>

      {/* HTML output */}
      <div className="erix-w-full lg:erix-w-5/12 erix-flex erix-flex-col erix-gap-2">
        <h2 className="erix-text-lg erix-font-semibold">HTML Output</h2>
        <pre className="erix-text-xs erix-p-4 erix-bg-muted erix-rounded-xl erix-border erix-border-border erix-overflow-auto erix-max-h-[460px] erix-whitespace-pre-wrap erix-break-all">
          {html || (
            <span className="erix-text-muted-foreground">Start typing…</span>
          )}
        </pre>
      </div>
    </div>
  );
}
