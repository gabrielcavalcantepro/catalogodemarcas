"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ProductGallery({ photoUrls, alt }: { photoUrls: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const hasMultiple = photoUrls.length > 1;
  const current = photoUrls[index];

  function prev() {
    setIndex((i) => (i - 1 + photoUrls.length) % photoUrls.length);
  }
  function next() {
    setIndex((i) => (i + 1) % photoUrls.length);
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-mat">
        {current ? (
          <Image
            src={current}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 448px"
            priority
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink/40">Sem foto</div>
        )}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Foto anterior"
              className="absolute top-1/2 left-2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-ink/70 text-paper backdrop-blur-sm transition-colors duration-150 hover:bg-ink"
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Próxima foto"
              className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-ink/70 text-paper backdrop-blur-sm transition-colors duration-150 hover:bg-ink"
            >
              <ChevronRight size={20} strokeWidth={2} />
            </button>
          </>
        )}
      </div>
      {hasMultiple && (
        <div className="grid grid-cols-4 gap-3">
          {photoUrls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === index}
              className={`relative aspect-square cursor-pointer overflow-hidden rounded-[10px] bg-mat transition-opacity duration-150 ${
                i === index ? "ring-2 ring-gold" : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={url} alt={alt} fill sizes="25vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
