// Runs in the admin (browser) before upload: converts iPhone HEIC photos to JPEG,
// keeps the photo upright and shrinks large images so they upload quickly and stay under the size limit.
const MAX_EDGE = 2000;
const QUALITY = 0.86;

const isHeic = (f: File) => /image\/hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name);

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  } catch (e) {
    if (!isHeic(file)) throw e;
    // Most browsers outside Safari can't read HEIC, so convert it first.
    const heic2any = (await import("heic2any")).default;
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: QUALITY });
    const blob = Array.isArray(out) ? out[0] : out;
    return await createImageBitmap(blob);
  }
}

export async function prepareImage(file: File): Promise<File> {
  const heic = isHeic(file);
  const isRaster = heic || /^image\/(jpeg|png|webp)$/.test(file.type);
  if (!isRaster) return file; // PDFs and anything else pass straight through
  const bitmap = await decode(file);
  const { width, height } = bitmap;
  const needsResize = Math.max(width, height) > MAX_EDGE;
  // Small, already-supported images are uploaded untouched.
  if (!heic && !needsResize && file.size <= 1.5 * 1024 * 1024) { bitmap.close(); return file; }
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't process images.");
  const keepPng = file.type === "image/png";
  if (!keepPng) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const type = keepPng ? "image/png" : "image/jpeg";
  const blob: Blob = await new Promise((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error("Could not convert the image."))), type, QUALITY));
  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.${keepPng ? "png" : "jpg"}`, { type, lastModified: Date.now() });
}
