import { useState } from "react";
import { cn } from "@/components/ui/utils";

interface ProductImageProps {
  src: string;
  alt: string;
  /** Product name used by the fallback so it never looks broken. */
  productName?: string;
  className?: string;
  loading?: "lazy" | "eager";
}

/**
 * Wraps `<img>` with a brand-quality fallback when the source 404s.
 *
 * The catalog uses Unsplash photo IDs — some may rotate out or become
 * unavailable. Rather than show the browser's broken-image glyph, we
 * render the canonical Apex chevron on `#0A0F14` with the product
 * name beneath. Failure mode looks intentional, not broken.
 */
export function ProductImage({
  src,
  alt,
  productName,
  className,
  loading = "lazy",
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 bg-[#0A0F14] p-4 text-center",
          className,
        )}
        aria-label={alt}
      >
        <svg viewBox="0 0 512 512" className="w-1/3 max-w-[80px]" aria-hidden="true">
          <defs>
            <linearGradient id="apex-fallback-mark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#009E5F" />
              <stop offset="50%" stopColor="#4EC983" />
              <stop offset="100%" stopColor="#009E5F" />
            </linearGradient>
          </defs>
          <path
            d="M256 96 L408 400 L352 400 L256 208 L160 400 L104 400 Z"
            fill="url(#apex-fallback-mark)"
          />
        </svg>
        {productName && (
          <span className="text-[10px] font-medium tracking-wide text-white/60">
            {productName}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
