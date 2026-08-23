/**
 * Example: Integrating PasteHandler with ErixEditor
 *
 * This example demonstrates how to use the enhanced PasteHandler
 * with the ErixEditor component to handle rich content from various sources.
 */

import React, { useRef, useEffect } from "react";
import { PasteHandler, type ParsedContent } from "./PasteHandler";
import { ErixEditor } from "../../components/richtext/editor";
import { useErixEditor } from "../../context/editor";

interface EnhancedEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  linkPreviewApiUrl?: string;
  apiKey?: string;
}

/**
 * Enhanced editor with intelligent paste handling
 */
export function EnhancedEditor({
  initialContent,
  onChange,
  linkPreviewApiUrl,
  apiKey,
}: EnhancedEditorProps) {
  const pasteHandlerRef = useRef<PasteHandler | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize paste handler
  useEffect(() => {
    pasteHandlerRef.current = new PasteHandler({
      preserveFormatting: true,
      sanitize: true,
      maxSize: 1024 * 1024, // 1MB
      linkPreviewApiUrl,
      apiKey,
    });
  }, [linkPreviewApiUrl, apiKey]);

  // Handle paste events
  const handlePaste = async (event: ClipboardEvent) => {
    event.preventDefault();

    if (!pasteHandlerRef.current) return;

    try {
      // Show loading indicator for large pastes
      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      const size =
        (clipboardData.getData("text/html")?.length || 0) +
        (clipboardData.getData("text/plain")?.length || 0);

      if (size > 1024 * 1024) {
        console.log("Processing large paste...");
      }

      // Process the paste
      const result: ParsedContent =
        await pasteHandlerRef.current.handlePaste(event);

      // Log the result type
      console.log("Paste type:", result.type);

      // Handle different content types
      switch (result.type) {
        case "word":
          console.log("Pasted from Microsoft Word");
          break;
        case "google-docs":
          console.log("Pasted from Google Docs");
          break;
        case "code":
          console.log(
            "Pasted code block:",
            result.metadata?.codeBlock?.language,
          );
          break;
        case "link":
          console.log(
            "Pasted link with preview:",
            result.metadata?.linkPreview?.title,
          );
          break;
        default:
          console.log("Pasted regular content");
      }

      // Insert the parsed HTML into the editor
      // This would integrate with your actual editor implementation
      if (editorRef.current) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const fragment = range.createContextualFragment(result.html);
          range.insertNode(fragment);
          range.collapse(false);
        }
      }

      // Notify parent of content change
      if (onChange && editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    } catch (error) {
      console.error("Paste error:", error);
      // Show error notification to user
      alert("Failed to paste content. Please try again.");
    }
  };

  // Attach paste event listener
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.addEventListener("paste", handlePaste as EventListener);

    return () => {
      editor.removeEventListener("paste", handlePaste as EventListener);
    };
  }, [onChange]);

  return (
    <div className="enhanced-editor">
      <div
        ref={editorRef}
        contentEditable
        className="editor-content"
        dangerouslySetInnerHTML={{ __html: initialContent || "" }}
        style={{
          minHeight: "300px",
          padding: "16px",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      />
      <style>{`
        .link-preview {
          display: flex;
          gap: 12px;
          padding: 12px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          margin: 8px 0;
          background: #f9f9f9;
        }
        .link-preview-thumbnail {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 4px;
        }
        .link-preview-content {
          flex: 1;
        }
        .link-preview-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
        }
        .link-preview-title a {
          color: #0066cc;
          text-decoration: none;
        }
        .link-preview-title a:hover {
          text-decoration: underline;
        }
        .link-preview-description {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #666;
          line-height: 1.4;
        }
        .link-preview-site {
          font-size: 12px;
          color: #999;
        }
        pre {
          background: #f5f5f5;
          padding: 16px;
          border-radius: 4px;
          overflow-x: auto;
        }
        code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

/**
 * Example: Using PasteHandler with ErixEditor context
 */
export function ErixEditorWithPasteHandler() {
  const { engine } = useErixEditor();
  const pasteHandler = useRef(
    new PasteHandler({
      preserveFormatting: true,
      sanitize: true,
      linkPreviewApiUrl: process.env.NEXT_PUBLIC_LINK_PREVIEW_API,
      apiKey: process.env.NEXT_PUBLIC_API_KEY,
    }),
  );

  useEffect(() => {
    if (!engine) return;

    // Override the default paste handler
    const handlePaste = async (event: ClipboardEvent) => {
      event.preventDefault();

      try {
        const result = await pasteHandler.current.handlePaste(event);

        // Use ErixEngine to insert content
        engine.insertHTML(result.html);

        // Track analytics
        if (result.type === "code") {
          console.log(
            "Code block inserted:",
            result.metadata?.codeBlock?.language,
          );
        } else if (result.type === "link") {
          console.log(
            "Link preview inserted:",
            result.metadata?.linkPreview?.url,
          );
        }
      } catch (error) {
        console.error("Paste failed:", error);
      }
    };

    // Attach to editor iframe
    const iframe = engine.getIframe();
    if (iframe?.contentDocument) {
      iframe.contentDocument.addEventListener(
        "paste",
        handlePaste as EventListener,
      );

      return () => {
        iframe.contentDocument?.removeEventListener(
          "paste",
          handlePaste as EventListener,
        );
      };
    }
  }, [engine]);

  return <ErixEditor />;
}

/**
 * Example: Standalone paste handler demo
 */
export function PasteHandlerDemo() {
  const [pastedContent, setPastedContent] =
    React.useState<ParsedContent | null>(null);
  const pasteHandler = useRef(new PasteHandler());

  const handlePaste = async (event: React.ClipboardEvent) => {
    event.preventDefault();

    try {
      const result = await pasteHandler.current.handlePaste(
        event.nativeEvent as ClipboardEvent,
      );
      setPastedContent(result);
    } catch (error) {
      console.error("Paste error:", error);
    }
  };

  return (
    <div className="paste-demo">
      <h2>Paste Handler Demo</h2>
      <p>Paste content from Word, Google Docs, or code snippets below:</p>

      <div
        contentEditable
        onPaste={handlePaste}
        style={{
          minHeight: "200px",
          padding: "16px",
          border: "2px dashed #ccc",
          borderRadius: "8px",
          marginBottom: "16px",
        }}
      >
        Paste here...
      </div>

      {pastedContent && (
        <div className="paste-result">
          <h3>Parsed Content</h3>
          <p>
            <strong>Type:</strong> {pastedContent.type}
          </p>

          {pastedContent.metadata?.codeBlock && (
            <div>
              <p>
                <strong>Language:</strong>{" "}
                {pastedContent.metadata.codeBlock.language}
              </p>
              <pre>
                <code>{pastedContent.metadata.codeBlock.code}</code>
              </pre>
            </div>
          )}

          {pastedContent.metadata?.linkPreview && (
            <div>
              <p>
                <strong>Link Preview:</strong>
              </p>
              <ul>
                <li>Title: {pastedContent.metadata.linkPreview.title}</li>
                <li>
                  Description: {pastedContent.metadata.linkPreview.description}
                </li>
                <li>URL: {pastedContent.metadata.linkPreview.url}</li>
              </ul>
            </div>
          )}

          <h4>HTML Output:</h4>
          <pre
            style={{
              background: "#f5f5f5",
              padding: "8px",
              borderRadius: "4px",
            }}
          >
            <code>{pastedContent.html}</code>
          </pre>

          <h4>Rendered Output:</h4>
          <div
            style={{
              border: "1px solid #e0e0e0",
              padding: "16px",
              borderRadius: "4px",
            }}
            dangerouslySetInnerHTML={{ __html: pastedContent.html }}
          />
        </div>
      )}
    </div>
  );
}
