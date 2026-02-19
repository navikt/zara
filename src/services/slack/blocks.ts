import { Feedback } from '@navikt/syk-zara/feedback'

type PlainHeaderBlock = {
    type: 'header'
    text: {
        type: 'plain_text'
        text: string
        emoji: true
    }
}

const categoryEmoji = {
    FEIL: '🐛',
    FORSLAG: '💡',
    ANNET: '💬',
}

export function createFeedbackHeader(feedback: Feedback): PlainHeaderBlock {
    const sentimentText = feedback.sentiment ? ` - ${feedback.sentiment}/5 ⭐` : ''

    switch (feedback.type) {
        case 'IN_SITU':
            return {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `In situ: ${feedback.variant}${sentimentText}`,
                    emoji: true,
                },
            }
        case 'CONTACTABLE':
            return {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${categoryEmoji[feedback.category]} ${feedback.category}${sentimentText}`,
                    emoji: true,
                },
            }
    }
}
