import { Fragment, type ReactNode } from "react";
import { BlockMath, InlineMath } from "react-katex";

type MathTextProps = {
  text: string;
  className?: string;
  block?: boolean;
};

type Segment =
  | { type: "text"; value: string }
  | { type: "inline"; value: string }
  | { type: "block"; value: string };

function parseMathSegments(input: string): Segment[] {
  const regex = /(\$\$[\s\S]*?\$\$)|(\$[^$\n]+\$)/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = regex.exec(input);

  while (match) {
    const full = match[0];
    const start = match.index;

    if (start > lastIndex) {
      segments.push({ type: "text", value: input.slice(lastIndex, start) });
    }

    if (full.startsWith("$$") && full.endsWith("$$")) {
      segments.push({ type: "block", value: full.slice(2, -2).trim() });
    } else {
      segments.push({ type: "inline", value: full.slice(1, -1).trim() });
    }

    lastIndex = start + full.length;
    match = regex.exec(input);
  }

  if (lastIndex < input.length) {
    segments.push({ type: "text", value: input.slice(lastIndex) });
  }

  return segments;
}

function renderMathError(err: Error): ReactNode {
  return <span>{err.message}</span>;
}

export default function MathText({ text, className, block = false }: MathTextProps) {
  const segments = parseMathSegments(text);

  if (segments.length === 1 && segments[0].type === "text") {
    if (block) {
      return <p className={className}>{text}</p>;
    }
    return <span className={className}>{text}</span>;
  }

  const content = (
    <>
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <Fragment key={index}>{segment.value}</Fragment>;
        }
        if (segment.type === "block") {
          return <BlockMath key={index} math={segment.value} renderError={renderMathError} />;
        }
        return <InlineMath key={index} math={segment.value} renderError={renderMathError} />;
      })}
    </>
  );

  if (block) {
    return <div className={className}>{content}</div>;
  }
  return <span className={className}>{content}</span>;
}
