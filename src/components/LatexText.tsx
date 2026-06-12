import React, { useMemo } from "react";
import katex from "katex";

interface LatexTextProps {
  children: React.ReactNode;
  className?: string;
}

export default function LatexText({ children, className = "" }: LatexTextProps) {
  const renderedContent = useMemo(() => {
    if (typeof children !== "string") return children;

    // Split text by $$...$$ or $...$
    const parts = children.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith("$$") && part.endsWith("$$")) {
        const math = part.slice(2, -2);
        try {
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(math, {
                  displayMode: true,
                  throwOnError: false,
                }),
              }}
            />
          );
        } catch (e) {
          return <span key={index}>{part}</span>;
        }
      } else if (part.startsWith("$") && part.endsWith("$")) {
        const math = part.slice(1, -1);
        try {
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(math, {
                  displayMode: false,
                  throwOnError: false,
                }),
              }}
            />
          );
        } catch (e) {
          return <span key={index}>{part}</span>;
        }
      } else {
        return <span key={index}>{part}</span>;
      }
    });
  }, [children]);

  return <span className={className}>{renderedContent}</span>;
}
