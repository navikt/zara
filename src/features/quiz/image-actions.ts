'use server'

import { validateUserSession } from '#services/auth/auth'
import { saveImage } from '#services/quiz/quiz-image-store'

import { MAX_QUIZ_IMAGE_SIZE_BYTES } from './image-limits'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function uploadQuizImage(formData: FormData): Promise<{ imageId: string } | { error: string }> {
    const user = await validateUserSession('TEAM_MEMBER')

    const file = formData.get('file')
    if (!(file instanceof File)) {
        return { error: 'Fant ingen fil å laste opp.' }
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
        return { error: 'Ugyldig filtype. Bruk JPEG, PNG, WebP eller GIF.' }
    }
    if (file.size > MAX_QUIZ_IMAGE_SIZE_BYTES) {
        return { error: 'Bildet er for stort. Maks 2 MB.' }
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')
    const imageId = await saveImage(user.userId, file.type, base64)

    return { imageId }
}
