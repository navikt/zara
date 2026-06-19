import { pgClient } from '@services/db/postgres/production-pg'

/**
 * Stores an image attached to a quiz question. Bytes are kept as plain base64 — images aren't
 * secret (unlike quiz content), only auth-gated behind TEAM_MEMBER. Returns the new image id.
 */
export async function saveImage(ownerUserId: string, contentType: string, base64Bytes: string): Promise<string> {
    const client = await pgClient()
    const result = await client.query<{ id: string }>(
        `INSERT INTO quiz_image (owner_user_id, content_type, bytes_base64)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [ownerUserId, contentType, base64Bytes],
    )

    return result.rows[0].id
}

/** Reads an image, decoding the stored base64 to bytes. Returns null if not found. */
export async function getImage(id: string): Promise<{ contentType: string; bytes: Buffer } | null> {
    const client = await pgClient()
    const result = await client.query<{ content_type: string; bytes_base64: string }>(
        `SELECT content_type, bytes_base64 FROM quiz_image WHERE id = $1`,
        [id],
    )

    const row = result.rows[0]
    if (!row) return null

    return { contentType: row.content_type, bytes: Buffer.from(row.bytes_base64, 'base64') }
}
