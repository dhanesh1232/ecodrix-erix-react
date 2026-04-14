// src/app/page.tsx — live demo for the dev server
"use client";
import { useState, useEffect } from "react";
import { ErixEditor } from "@/components/richtext/editor";
import { ErixRenderer } from "@/components/richtext/ErixRenderer";
import { AiAction, AiProvider } from "@/types/erix";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

type DataSource = "editor" | "leads_manifest" | "pipeline_manifest";

export default function Page() {
  const [content, setContent] = useState<any>();
  const [format, setFormat] = useState<"html" | "json" | "markdown" | "text">(
    "json",
  );
  const [dataSource, setDataSource] = useState<DataSource>("editor");
  const [manifestData, setManifestData] = useState<any>(null);

  // ─── SDK Introspection Logic ───────────────────────────────────────────────
  // Ideally this would use the useResourceManifest hook, but for the raw
  // playground we'll fetch them directly from the client instance.
  useEffect(() => {
    async function fetchManifests() {
      // In a real app, this comes from useErixClient(), but for this dev demo
      // we'll assume a global window.ecodrix or create a temporary one.
      const sdk = (window as any).ecodrix;
      if (!sdk) return;

      if (dataSource === "leads_manifest") {
        const manifest = await sdk.crm.leads.describe();
        setManifestData(manifest);
      } else if (dataSource === "pipeline_manifest") {
        const manifest = await sdk.crm.pipelines.getStageManifest("default");
        setManifestData(manifest);
      }
    }
    fetchManifests();
  }, [dataSource]);

  // Determine what to show in the raw block
  const rawContent = dataSource === "editor" ? content : manifestData;

  return (
    <div className="erix-w-full erix-min-h-screen erix-overflow-auto erix-flex erix-flex-col lg:erix-flex-row erix-items-start erix-justify-center erix-gap-6 erix-p-6 erix-bg-background">
      {/* Editor */}
      <div className="erix-w-full lg:erix-w-7/12 erix-flex erix-flex-col erix-gap-4">
        <h1 className="erix-text-2xl erix-font-bold erix-tracking-tight">
          Erix SDK Playground
        </h1>
        <ErixEditor
          apiKey={process.env.NEXT_PUBLIC_ERIX_API_KEY as string}
          shortcutsEnabled={true}
          placeholder="Type '/' for commands…"
          loader="spinner"
          onChange={setContent}
          aiProvider={mockAiProvider}
          style={{ height: "480px", border: { radius: "lg" }, shadow: "none" }}
          format={format}
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

      {/* Output Viewer */}
      <div className="erix-w-full lg:erix-w-5/12 erix-flex erix-flex-col erix-gap-6">
        {/* Rendered Preview */}
        <div className="erix-flex erix-flex-col erix-gap-2">
          <div className="erix-flex erix-justify-between erix-items-center">
            <h2 className="erix-text-lg erix-font-semibold">Live Preview</h2>
            <div className="erix-flex erix-gap-2">
              <Select value={format} onValueChange={(e) => setFormat(e as any)}>
                <SelectTrigger className="erix-w-28">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="erix-p-4 erix-bg-background erix-rounded-xl erix-border erix-border-border erix-overflow-auto erix-max-h-[300px]">
            {content ? (
              <ErixRenderer content={content} format={format} />
            ) : (
              <span className="erix-text-muted-foreground erix-text-sm">
                Preview will appear here…
              </span>
            )}
          </div>
        </div>

        {/* Raw Output Data */}
        <div className="erix-flex erix-flex-col erix-gap-2">
          <div className="erix-flex erix-justify-between erix-items-center">
            <h2 className="erix-text-lg erix-font-semibold">Inspect Data</h2>
            <Select
              value={dataSource}
              onValueChange={(e) => setDataSource(e as any)}
            >
              <SelectTrigger className="erix-w-44">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor Content</SelectItem>
                <SelectItem value="leads_manifest">Leads Manifest</SelectItem>
                <SelectItem value="pipeline_manifest">
                  Pipeline Manifest
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <pre className="erix-text-xs erix-p-4 erix-bg-muted erix-rounded-xl erix-border erix-border-border erix-overflow-auto erix-max-h-[400px] erix-whitespace-pre-wrap erix-break-all">
            {rawContent ? (
              typeof rawContent === "string" &&
              dataSource === "editor" &&
              format === "json" ? (
                JSON.stringify(JSON.parse(rawContent), null, 2)
              ) : typeof rawContent === "object" ? (
                JSON.stringify(rawContent, null, 2)
              ) : (
                rawContent
              )
            ) : (
              <span className="erix-text-muted-foreground">
                No data available for this source.
              </span>
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
