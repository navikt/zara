/** Returns a copy of `list` with the item at `from` moved to `to` (a no-op if `to` is out of range). */
export function move<T>(list: T[], from: number, to: number): T[] {
    if (to < 0 || to >= list.length) return list
    const copy = [...list]
    const [item] = copy.splice(from, 1)
    copy.splice(to, 0, item)
    return copy
}
