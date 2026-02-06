'use server'

import { revalidatePath } from 'next/cache'

export async function feedbackUpdated(id: string): Promise<void> {
    revalidatePath(`/syk-inn/tilbakemeldinger/${id}`)
}
