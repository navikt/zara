const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

/** A medal emoji for the top three ranks, otherwise the rank number as text. */
export function medalFor(rank: number): string {
    return MEDALS[rank] ?? String(rank)
}
