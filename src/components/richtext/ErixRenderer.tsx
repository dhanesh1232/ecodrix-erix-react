import React from "react";
import type { ErixOutputFormat } from "@/types/erix";

export interface ErixRendererProps {
  /**
   * The content to render. If format is json, can be a JSON string or parsed array.
   */
  content: string | Record<string, any>[];
  /**
   * The format of the provided content. Default is html.
   */
  format?: ErixOutputFormat;
  className?: string;
  style?: React.CSSProperties;
}

export const ErixRenderer: React.FC<ErixRendererProps> = ({
  content,
  format = "html",
  className,
  style,
}) => {
  if (!content) return null;

  if (format === "html") {
    return (
      <div
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: content as string }}
      />
    );
  }

  if (format === "text") {
    return (
      <div className={className} style={{ whiteSpace: "pre-wrap", ...style }}>
        {content as string}
      </div>
    );
  }

  if (format === "markdown") {
    // Built-in lightweight fallback. For full markdown support, host project should implement marked/react-markdown.
    return (
      <div
        className={className}
        style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", ...style }}
      >
        {content as string}
      </div>
    );
  }

  if (format === "json") {
    let nodes: any[] = [];
    if (typeof content === "string") {
      try {
        nodes = JSON.parse(content);
      } catch (e) {
        return <div className="erix-text-destructive">Invalid JSON Content</div>;
      }
    } else if (Array.isArray(content)) {
      nodes = content;
    }

    return (
      <div className={className} style={style}>
        {renderNodes(nodes)}
      </div>
    );
  }

  return null;
};

function renderNodes(nodes: any[]): React.ReactNode[] {
  return nodes.map((node, i) => {
    const key = `erix-node-${i}`;

    if (node.type === "text") {
      let el: React.ReactNode = node.content;
      if (node.marks && Array.isArray(node.marks)) {
        node.marks.forEach((mark: any) => {
          if (mark.type === "bold") el = <strong key={key}>{el}</strong>;
          if (mark.type === "italic") el = <em key={key}>{el}</em>;
          if (mark.type === "underline") el = <u key={key}>{el}</u>;
          if (mark.type === "strike") el = <s key={key}>{el}</s>;
          if (mark.type === "code") el = <code key={key}>{el}</code>;
          if (mark.type === "superscript") el = <sup key={key}>{el}</sup>;
          if (mark.type === "subscript") el = <sub key={key}>{el}</sub>;
          if (mark.type === "link") {
            el = (
              <a
                href={mark.attrs?.href}
                target="_blank"
                rel="noopener noreferrer"
                key={key}
                className="erix-text-primary hover:erix-underline"
              >
                {el}
              </a>
            );
          }
          if (mark.type === "color") {
            el = (
              <span style={{ color: mark.attrs?.color }} key={key}>
                {el}
              </span>
            );
          }
          if (mark.type === "highlight") {
            el = (
              <mark
                style={{ backgroundColor: mark.attrs?.color }}
                key={key}
                className="erix-px-1 erix-rounded-sm"
              >
                {el}
              </mark>
            );
          }
          if (mark.type === "font_size") {
            el = (
              <span style={{ fontSize: mark.attrs?.size }} key={key}>
                {el}
              </span>
            );
          }
          if (mark.type === "font_family") {
            el = (
              <span style={{ fontFamily: mark.attrs?.family }} key={key}>
                {el}
              </span>
            );
          }
        });
      }
      // Wrap floating text strings in a fragment
      return <React.Fragment key={key}>{el}</React.Fragment>;
    }

    const childrenList =
      node.children && Array.isArray(node.children)
        ? renderNodes(node.children)
        : null;

    switch (node.type) {
      case "heading": {
        const level = node.attrs?.level || 1;
        const style = { textAlign: node.attrs?.textAlign };
        switch (level) {
          case 1: return <h1 key={key} style={style}>{childrenList}</h1>;
          case 2: return <h2 key={key} style={style}>{childrenList}</h2>;
          case 3: return <h3 key={key} style={style}>{childrenList}</h3>;
          case 4: return <h4 key={key} style={style}>{childrenList}</h4>;
          case 5: return <h5 key={key} style={style}>{childrenList}</h5>;
          case 6: return <h6 key={key} style={style}>{childrenList}</h6>;
          default: return <h1 key={key} style={style}>{childrenList}</h1>;
        }
      }
      case "paragraph":
        return (
          <p key={key} style={{ textAlign: node.attrs?.textAlign }}>
            {childrenList}
          </p>
        );
      case "blockquote":
        return <blockquote key={key}>{childrenList}</blockquote>;
      case "code_block":
        return (
          <pre key={key}>
            <code>{node.content}</code>
          </pre>
        );
      case "divider":
        return <hr key={key} />;
      case "bullet_list":
        return <ul key={key}>{childrenList}</ul>;
      case "ordered_list":
        return <ol key={key}>{childrenList}</ol>;
      case "list_item":
        return <li key={key}>{childrenList}</li>;
      case "task_list":
        return (
          <ul
            key={key}
            className="erix-task-list"
            style={{ listStyle: "none", padding: 0 }}
          >
            {childrenList}
          </ul>
        );
      case "task_item":
        return (
          <li
            key={key}
            className="erix-task-item"
            style={{ display: "flex", gap: "0.5rem" }}
          >
            <input
              type="checkbox"
              readOnly
              checked={!!node.attrs?.checked}
              className="erix-mt-1 erix-w-4 erix-h-4 erix-rounded erix-accent-primary"
            />
            <span style={{ flex: 1 }}>{childrenList}</span>
          </li>
        );
      case "image":
        return (
          <figure key={key}>
            {node.attrs?.link ? (
              <a
                href={node.attrs.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={node.attrs.src}
                  alt={node.attrs.alt || ""}
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              </a>
            ) : (
              <img
                src={node.attrs?.src}
                alt={node.attrs?.alt || ""}
                style={{ maxWidth: "100%", height: "auto" }}
              />
            )}
          </figure>
        );
      case "video":
        return (
          <div
            key={key}
            className="erix-video-embed"
            style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}
          >
            <iframe
              src={node.attrs?.src}
              frameBorder="0"
              allowFullScreen
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        );
      case "callout":
        return (
          <div
            key={key}
            className="erix-callout"
            style={{
              display: "flex",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              backgroundColor: node.attrs?.bg || "#fef3c7",
              border: `1px solid ${node.attrs?.border || "#fcd34d"}`,
              borderRadius: "8px",
            }}
          >
            <span className="erix-callout-emoji">
              {node.attrs?.emoji || "💡"}
            </span>
            <div className="erix-callout-content" style={{ flex: 1 }}>
              {childrenList}
            </div>
          </div>
        );
      case "toggle":
        return (
          <details
            key={key}
            className="erix-toggle"
            style={{ margin: "0.5rem 0" }}
          >
            <summary
              className="erix-toggle-trigger"
              style={{ cursor: "pointer", fontWeight: 500 }}
            >
              {node.attrs?.label}
            </summary>
            <div
              className="erix-toggle-content"
              style={{
                marginTop: "0.25rem",
                paddingLeft: "1.5rem",
                borderLeft: "2px solid #e5e7eb",
              }}
            >
              {childrenList}
            </div>
          </details>
        );
      case "table":
        return (
          <div
            key={key}
            className="erix-table-wrapper"
            style={{ overflowX: "auto" }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>{childrenList}</tbody>
            </table>
          </div>
        );
      case "table_row":
        return <tr key={key}>{childrenList}</tr>;
      case "table_cell":
        return (
          <td
            key={key}
            style={{ border: "1px solid #e5e7eb", padding: "8px 12px" }}
          >
            {childrenList}
          </td>
        );
      case "table_header":
        return (
          <th
            key={key}
            style={{
              border: "1px solid #e5e7eb",
              padding: "8px 12px",
              background: "#f9fafb",
            }}
          >
            {childrenList}
          </th>
        );
      case "column_layout":
        return (
          <div
            key={key}
            className="erix-columns"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${node.attrs?.cols || 2}, 1fr)`,
              gap: "1rem",
            }}
          >
            {childrenList}
          </div>
        );
      case "column":
        return (
          <div key={key} className="erix-column">
            {childrenList}
          </div>
        );
      default:
        // fallback
        return <div key={key}>{childrenList}</div>;
    }
  });
}
