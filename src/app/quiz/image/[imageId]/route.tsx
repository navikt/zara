import { validateUserSession } from '#services/auth/auth'
import { getImage } from '#services/quiz/quiz-image-store'

/**
 * Serves a quiz question image. Auth-gated to TEAM_MEMBER; streams the decrypted bytes
 * with the stored content type. 404 when the image doesn't exist.
 */
export async function GET(request: Request, { params }: RouteContext<'/quiz/image/[imageId]'>): Promise<Response> {
    await validateUserSession('TEAM_MEMBER')

    const { imageId } = await params
    // An image's bytes never change for a given id, so it's immutable + revalidatable by id.
    // Answering 304 before the DB read skips a fetch + AES-GCM decrypt on every revalidation.
    const etag = `"${imageId}"`
    if (request.headers.get('if-none-match') === etag) return new Response(undefined, { status: 304 })

    const image = await getImage(imageId)
    if (!image) return new Response(undefined, { status: 404 })

    // Wrap in a fresh Uint8Array so the body is an ArrayBuffer-backed BufferSource
    // (Node's Buffer<ArrayBufferLike> isn't assignable to BodyInit).
    return new Response(new Uint8Array(image.bytes), {
        headers: {
            'Content-Type': image.contentType,
            'Cache-Control': 'private, max-age=31536000, immutable',
            ETag: etag,
        },
    })
}
