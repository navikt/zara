export function feedbackToWordsByLines(message: string): string[][] {
    return message.split('\n').map((it) => it.split(' '))
}
