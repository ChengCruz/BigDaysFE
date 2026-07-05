// src/utils/imageResize.ts
// Client-side image preparation for the RSVP designer.
// Large camera photos are downscaled and re-encoded to WebP *before* they are
// cached and uploaded, so we never ship full-resolution files to storage.
// GIFs are intentionally rejected — animation can't survive a canvas re-encode.

/** Output settings — the real storage lever lives here, not in the upload size cap. */
const MAX_EDGE = 2000; // longest side, px — retina-safe for a phone-width RSVP
const WEBP_QUALITY = 0.82; // 0..1 lossy quality
const OUTPUT_TYPE = "image/webp";

/** Raster types we can decode + re-encode. */
const RESIZABLE = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Hard cap on the *original* file the user may pick (decode-memory safety net). */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_UPLOAD_MB = 25;

/** Validates a chosen image. Returns a human-readable error fragment, or null if OK. */
export function validateImageFile(file: File): string | null {
  if (file.type === "image/gif") return "GIFs aren't supported — use a JPG, PNG or WebP.";
  if (!RESIZABLE.has(file.type)) return "must be a JPG, PNG or WebP image.";
  if (file.size > MAX_UPLOAD_BYTES) return `is too large (max ${MAX_UPLOAD_MB}MB).`;
  return null;
}

/**
 * Downscales (if needed) and re-encodes an image to WebP.
 * Returns the original File untouched when: it's not a resizable raster type
 * (e.g. video), decoding/encoding fails, it's an already-small WebP, or the
 * re-encoded result isn't smaller. Safe to call on anything.
 */
export async function resizeImageToWebp(file: File): Promise<File> {
  if (!RESIZABLE.has(file.type)) return file;

  // `from-image` applies EXIF orientation so phone photos aren't sideways.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

  // Already-optimized WebP at native size — don't re-encode (avoids quality loss).
  if (file.type === OUTPUT_TYPE && scale === 1) {
    bitmap.close?.();
    return file;
  }

  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, OUTPUT_TYPE, WEBP_QUALITY));
  if (!blob || blob.size >= file.size) return file; // encode failed or didn't help → keep original

  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], name, { type: OUTPUT_TYPE, lastModified: Date.now() });
}
