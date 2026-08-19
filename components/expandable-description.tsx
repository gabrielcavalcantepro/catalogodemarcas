"use client";

import { useState } from "react";

const TRUNCATE_THRESHOLD = 280;

export function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > TRUNCATE_THRESHOLD;

  return (
    <div>
      <p className={`mt-3 text-sm whitespace-pre-line text-mist ${!expanded && isLong ? "line-clamp-6" : ""}`}>
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 cursor-pointer text-sm font-semibold text-gold hover:underline"
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      )}
    </div>
  );
}
