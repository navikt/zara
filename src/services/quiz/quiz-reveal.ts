/**
 * The podium ceremony: after a quiz ends the host unmasks the anonymous leaderboard one place at
 * a time, from the bottom of the podium up — 3rd, then 2nd, then 1st — and finally everyone else.
 *
 * Pure functions, shared by the server-side projection (which decides whose real name is allowed
 * into the payload) and by the host UI (which labels the reveal button). Keep them in sync by
 * construction rather than by duplicating the rules on the client.
 */

/** The podium places in reveal order (lowest place first), trimmed to the number of players. */
export function podiumRanks(totalPlayers: number): number[] {
    return [3, 2, 1].filter((rank) => rank <= totalPlayers)
}

/**
 * The step at which every remaining name is unmasked. The podium takes one step per place, plus a
 * final "reveal the rest" step — which is skipped entirely when the podium already covers everyone.
 */
export function maxRevealStep(totalPlayers: number): number {
    const podium = podiumRanks(totalPlayers)
    return podium.length + (totalPlayers > podium.length ? 1 : 0)
}

/**
 * Which ranks are unmasked after `step` reveals. `'all'` means every player, including the ones
 * below the podium. A step of 0 (or fewer players than 1) unmasks nobody.
 */
export function unmaskedRanks(step: number, totalPlayers: number): Set<number> | 'all' {
    if (totalPlayers <= 0) return new Set()
    if (step >= maxRevealStep(totalPlayers)) return 'all'
    return new Set(podiumRanks(totalPlayers).slice(0, Math.max(0, step)))
}

/**
 * The label for the host's reveal button at `step`, or null when there is nothing left to reveal.
 * Mirrors {@link unmaskedRanks}: each podium step names the place it is about to show.
 */
export function revealButtonLabel(step: number, totalPlayers: number): string | null {
    const podium = podiumRanks(totalPlayers)
    if (step >= maxRevealStep(totalPlayers)) return null
    if (step < podium.length) return `Vis ${podium[step]}. plass`
    return 'Vis alle navn'
}
