import { Pica } from 'pica'

/**
 * Browser-only image downscaling before upload.
 *
 * Large phone photos are easily 5–10 MB, which the upload action rejects (max 2 MB). We decode the
 * file, downscale it with pica so the longest edge fits {@link MAX_EDGE}px, and re-encode to WebP.
 * Anything that can't be safely resized (GIF animation, decode failure, etc.) is returned untouched
 * so resizing never blocks an upload that would otherwise succeed.
 */

/** Longest-edge cap. Plenty for displaying a quiz question image, tiny compared to a raw photo. */
const MAX_EDGE = 1600
/** WebP quality. 0.85 is visually lossless for photos while cutting size dramatically. */
const WEBP_QUALITY = 0.85
const WEBP_TYPE = 'image/webp'

let picaInstance: Pica | undefined

function getPica(): Pica {
    // Lazily construct so the worker/wasm setup only happens when a user actually picks a file.
    picaInstance ??= new Pica()
    return picaInstance
}

/** Decode a File into an ImageBitmap, releasing the intermediate object URL afterwards. */
async function decode(file: File): Promise<ImageBitmap> {
    // createImageBitmap handles orientation/format decode off the main thread where supported.
    return createImageBitmap(file)
}

/**
 * Downscale an image file so its longest edge is at most {@link MAX_EDGE}px and re-encode to WebP.
 * Returns the original file unchanged when resizing isn't applicable or fails.
 */
export async function resizeImageForUpload(file: File): Promise<File> {
    // GIFs may be animated; pica would flatten them to a single frame. Leave them alone.
    if (file.type === 'image/gif') return file
    if (typeof createImageBitmap !== 'function') return file

    try {
        const bitmap = await decode(file)
        const { width, height } = bitmap

        const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
        // Already small enough — don't re-encode, the original is likely smaller than a WebP pass.
        if (scale >= 1) {
            bitmap.close()
            return file
        }

        const toWidth = Math.round(width * scale)
        const toHeight = Math.round(height * scale)

        // Create the canvas ourselves rather than pica.createCanvas(): the latter gates on
        // capabilities that are only populated after pica.init() runs, so calling it before the
        // first resize() throws "Pica: cannot create canvas".
        const target = document.createElement('canvas')
        target.width = toWidth
        target.height = toHeight

        const pica = getPica()
        await pica.resize(bitmap, target, { quality: 3 })
        bitmap.close()

        const blob = await pica.toBlob(target, WEBP_TYPE, WEBP_QUALITY)

        // If the "optimized" output somehow ended up larger, keep the original.
        if (blob.size >= file.size) return file

        const newName = file.name.replace(/\.[^.]+$/, '') + '.webp'
        return new File([blob], newName, { type: WEBP_TYPE })
    } catch {
        // Decode/resize/encode can fail for exotic files — fall back to uploading the original.
        return file
    }
}
