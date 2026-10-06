"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useNativeDialog } from "@/components/ui/Dialog";
import { Plate } from "@/components/ui/Plate";
import { Cubby } from "@/components/product/ShelfTile/ShelfTile";

export interface GalleryImage {
  id: string;
  url: string;
  alt?: string | null;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
}

function ZoomDialog({ open, onClose, images, index, onIndex, productName }: { open: boolean; onClose: () => void; images: GalleryImage[]; index: number; onIndex: (i: number) => void; productName: string }) {
  const t = useTranslations("product");
  const closeRef = useRef<HTMLButtonElement>(null);
  const { ref, phase } = useNativeDialog(open, 260, closeRef);
  const [magnified, setMagnified] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const pressed = useRef(false);
  const image = images[index];
  const many = images.length > 1;

  useEffect(() => {
    setMagnified(false);
    setOrigin({ x: 50, y: 50 });
  }, [index, open]);

  const track = (e: PointerEvent<HTMLDivElement>) => {
    if (!magnified) return;
    if (e.pointerType !== "mouse" && !pressed.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)),
    });
  };

  const step = (delta: number) => onIndex((index + delta + images.length) % images.length);

  return (
    <dialog
      ref={ref}
      aria-label={t("zoomLabel", { name: productName })}
      aria-modal="true"
      data-phase={phase}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => {
        if (!many) return;
        if (e.key === "ArrowRight") step(1);
        if (e.key === "ArrowLeft") step(-1);
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-stage p-0 text-on-stage backdrop:bg-scrim data-[phase=open]:animate-fade-in data-[phase=closing]:opacity-0 transition-opacity duration-[260ms]"
    >
      {open || phase !== "closed" ? (
        <div className="relative flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between gap-4 px-4 sm:px-6">
            {many ? (
              <Plate variant="neutral" className="tabular">
                {t("imageCount", { current: index + 1, total: images.length })}
              </Plate>
            ) : (
              <span />
            )}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-ui-sm font-semibold text-on-stage [--color-focus:var(--color-on-stage)]"
            >
              <X size={20} aria-hidden="true" />
              {t("close")}
            </button>
          </div>
          <div
            className={cn("relative min-h-0 flex-1 touch-none overflow-hidden", magnified ? "cursor-zoom-out" : "cursor-zoom-in")}
            onPointerDown={(e) => {
              pressed.current = true;
              track(e);
            }}
            onPointerUp={() => {
              pressed.current = false;
            }}
            onPointerLeave={() => {
              pressed.current = false;
            }}
            onPointerMove={track}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setOrigin({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
              setMagnified((m) => !m);
            }}
          >
            {image ? (
              <div
                className="absolute inset-4 transition-transform duration-[260ms] ease-[var(--ease-furniture)] sm:inset-10"
                style={{ transform: magnified ? "scale(2.25)" : "scale(1)", transformOrigin: `${origin.x}% ${origin.y}%` }}
              >
                <Image src={image.url} alt={image.alt || productName} fill sizes="100vw" className="object-contain mix-blend-multiply dark:mix-blend-normal" />
              </div>
            ) : null}
          </div>
          <p className="meta shrink-0 px-4 py-3 text-center text-on-stage sm:px-6">{magnified ? t("zoomOutHint") : t("zoomInHint")}</p>
          {many ? (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={t("previousImage")}
                className="absolute left-2 top-1/2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center text-on-stage [--color-focus:var(--color-on-stage)] sm:left-4"
              >
                <ChevronLeft size={24} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={t("nextImage")}
                className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center text-on-stage [--color-focus:var(--color-on-stage)] sm:right-4"
              >
                <ChevronRight size={24} aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const t = useTranslations("product");
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const many = images.length > 1;

  const goTo = (i: number) => {
    setIndex(i);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: i * track.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !many) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        setIndex((cur) => (cur === i ? cur : Math.min(images.length - 1, Math.max(0, i))));
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [many, images.length]);

  if (images.length === 0) {
    return (
      <div data-gallery="" data-shelf-item="">
        <Cubby src={null} alt={productName} size="tile" />
      </div>
    );
  }

  return (
    <div data-gallery="" data-shelf-item="" className="min-w-0">
      <div className="relative">
        <div
          ref={trackRef}
          aria-roledescription={many ? t("galleryRole") : undefined}
          aria-label={many ? t("galleryLabel", { name: productName }) : undefined}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto lg:overflow-hidden"
        >
          {images.map((image, i) => (
            <div key={image.id} className="w-full shrink-0 snap-center" aria-hidden={many && i !== index ? true : undefined}>
              <button
                type="button"
                tabIndex={i === index ? 0 : -1}
                onClick={() => {
                  setIndex(i);
                  setZoomOpen(true);
                }}
                aria-label={t("openZoom", { name: image.alt || productName })}
                className="group block w-full cursor-zoom-in"
              >
                <Cubby src={image.url} alt={image.alt || productName} size="tile" priority={i === 0} sizes="(min-width: 1024px) 720px, 100vw" stageClassName="group-focus-visible:outline-2 group-focus-visible:-outline-offset-2 group-focus-visible:outline-focus">
                  <span aria-hidden="true" className="absolute right-3 top-3 z-[2] hidden text-on-stage opacity-0 transition-opacity duration-[160ms] group-hover:opacity-100 hover-device:block">
                    <ZoomIn size={20} />
                  </span>
                </Cubby>
              </button>
            </div>
          ))}
        </div>
        {many ? (
          <Plate variant="neutral" className="tabular absolute bottom-6 right-3 z-[2] lg:hidden" aria-hidden="true">
            {t("imageCount", { current: index + 1, total: images.length })}
          </Plate>
        ) : null}
      </div>

      {many ? (
        <div className="mt-6 hidden lg:block">
          <ul className="m-0 flex list-none flex-wrap gap-3 p-0" aria-label={t("thumbnails")}>
            {images.map((image, i) => (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={t("showImage", { current: i + 1, total: images.length })}
                  aria-current={i === index ? "true" : undefined}
                  className={cn("block w-[72px] cursor-pointer outline-offset-2", i === index ? "outline-2 outline-brand" : "outline-0")}
                >
                  <Cubby src={image.url} alt="" size="thumb" shelf={false} />
                </button>
              </li>
            ))}
          </ul>
          <span aria-hidden="true" className="shelf-rule mt-px w-full" />
        </div>
      ) : null}

      <ZoomDialog open={zoomOpen} onClose={() => setZoomOpen(false)} images={images} index={index} onIndex={goTo} productName={productName} />
    </div>
  );
}
