"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

type Image = { url: string; alt: string | null };

const SWIPE_THRESHOLD_PX = 40;

export function ProductGallery({ images }: { images: Image[] }) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const current = images[active];

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
    <div>
      <div
        className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-secondary/25"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {current ? (
          <img src={current.url} alt={current.alt ?? ""} className="h-full w-full object-cover" />
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
                "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition",
                index === active ? "border-accent" : "border-transparent"
              )}
            >
              <img src={image.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
