/**
 * compressImage — pure client-side image compression via Canvas API.
 *
 * Resizes the image so neither dimension exceeds `maxDim`, then re-encodes
 * as WebP (falling back to JPEG if the browser doesn't support WebP output).
 *
 * Returns the compressed File and a stats object for display.
 */

export interface CompressionResult {
    file: File;
    originalBytes: number;
    compressedBytes: number;
    /** Percentage saved, e.g. 68 means "68% smaller" */
    savedPct: number;
    format: 'webp' | 'jpeg';
}

const MAX_DIM = 1200;   // px — longest side
const QUALITY = 0.82;  // 0-1

export async function compressImage(
    source: File,
    maxDim = MAX_DIM,
    quality = QUALITY,
): Promise<CompressionResult> {
    const originalBytes = source.size;

    // 1. Load the image into an HTMLImageElement
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = URL.createObjectURL(source);
    });

    // 2. Calculate output dimensions (maintain aspect ratio)
    let { naturalWidth: w, naturalHeight: h } = img;
    if (w > maxDim || h > maxDim) {
        if (w >= h) { h = Math.round((h / w) * maxDim); w = maxDim; }
        else         { w = Math.round((w / h) * maxDim); h = maxDim; }
    }

    // 3. Draw onto a canvas
    const canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);

    // Clean up object URL
    URL.revokeObjectURL(img.src);

    // 4. Attempt WebP first, fall back to JPEG
    const tryBlob = (mimeType: string): Promise<Blob | null> =>
        new Promise((resolve) => canvas.toBlob((b) => resolve(b), mimeType, quality));

    let blob = await tryBlob('image/webp');
    let format: 'webp' | 'jpeg' = 'webp';

    // If browser returned null or a blob that's actually PNG (some Safari versions
    // silently fall back), verify by checking the magic bytes.
    if (!blob || (await isBlobPng(blob))) {
        blob = await tryBlob('image/jpeg');
        format = 'jpeg';
    }

    if (!blob) throw new Error('Canvas compression failed');

    // 5. Only use the compressed result if it's actually smaller
    const finalBlob   = blob.size < originalBytes ? blob : source;
    const isCompressed = blob.size < originalBytes;

    const ext       = format === 'webp' ? '.webp' : '.jpg';
    const baseName  = source.name.replace(/\.[^.]+$/, '');
    const fileName  = isCompressed ? `${baseName}${ext}` : source.name;
    const mimeType  = isCompressed ? (format === 'webp' ? 'image/webp' : 'image/jpeg') : source.type;

    const compressedBytes = isCompressed ? blob.size : originalBytes;
    const savedPct        = Math.round((1 - compressedBytes / originalBytes) * 100);

    return {
        file: new File([finalBlob], fileName, { type: mimeType }),
        originalBytes,
        compressedBytes,
        savedPct: Math.max(0, savedPct),
        format,
    };
}

/** Quick check: does the blob start with the PNG signature 0x89504E47? */
async function isBlobPng(blob: Blob): Promise<boolean> {
    try {
        const buf = await blob.slice(0, 4).arrayBuffer();
        const bytes = new Uint8Array(buf);
        return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    } catch {
        return false;
    }
}
