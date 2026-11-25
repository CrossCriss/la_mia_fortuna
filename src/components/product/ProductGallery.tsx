"use client";

import { useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { isOptimizableImage } from "@/lib/image";
import { SHOW_SIZE_CHART_EVENT, type GalleryImage } from "@/lib/product-gallery";

const SWIPE_THRESHOLD_PX = 40;

export function ProductGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = images[active];

  // Кнопка "Таблиця розмірів" біля вибору розміру: показати останній слайд
  // (таблицю) і прокрутити до галереї (на мобільному вона над опціями).
  useEffect(() => {
    function showLast() {
      if (!images.some((image) => image.contain)) return;
      setActive(images.length - 1);
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.addEventListener(SHOW_SIZE_CHART_EVENT, showLast);
    return () => window.removeEventListener(SHOW_SIZE_CHART_EVENT, showLast);
  }, [images]);

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD_PX) {
      setActive((prev) => {
        const next = delta < 0 ? prev + 1 : prev - 1;
        return Math.min(Math.max(next, 0), images.length - 1);
      });
    }
    touchStartX.current = null;
  }

  return (
    <div ref={rootRef} className="scroll-mt-4">
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-secondary/25"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {current ? (
          <NextImage
            src={current.url}
            alt={current.alt ?? ""}
            fill
            priority={active === 0}
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized={!isOptimizableImage(current.url)}
            className={current.contain ? "object-contain" : "object-cover"}
          />
        ) : (
          <PlaceholderImage />
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.url + index}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition",
                index === active ? "border-accent" : "border-transparent"
              )}
            >
              <NextImage
                src={image.url}
                alt=""
                fill
                sizes="80px"
                unoptimized={!isOptimizableImage(image.url)}
                className={image.contain ? "object-contain" : "object-cover"}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
