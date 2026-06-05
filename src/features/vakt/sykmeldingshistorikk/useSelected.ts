import { useQueryState, parseAsString } from 'nuqs'

type UseSelected = {
    selected: string | null
    setSelected: (value: string) => void
}

export function useSelected(): UseSelected {
    const [selected, setSelected] = useQueryState(
        'sykmelding',
        parseAsString.withDefault('').withOptions({
            shallow: true,
            clearOnDefault: true,
        }),
    )

    return { selected: selected || null, setSelected }
}
