import { expect, test } from 'vitest'

import { AliasSchema } from '#services/quiz/quiz-schema'

test('an alias is trimmed and its inner whitespace collapsed', () => {
    expect(AliasSchema.parse('  Grusom   elg  ')).toBe('Grusom elg')
})

test('an alias must survive trimming to be long enough', () => {
    expect(AliasSchema.safeParse('  a  ').success).toBe(false)
    expect(AliasSchema.safeParse('     ').success).toBe(false)
})

test('alias length bounds are enforced', () => {
    expect(AliasSchema.safeParse('ab').success).toBe(true)
    expect(AliasSchema.safeParse('a').success).toBe(false)
    expect(AliasSchema.safeParse('a'.repeat(20)).success).toBe(true)
    expect(AliasSchema.safeParse('a'.repeat(21)).success).toBe(false)
})

test('an alias may contain emoji and non-ascii letters', () => {
    expect(AliasSchema.parse('Blåbær 🫐')).toBe('Blåbær 🫐')
})

test('a rejected alias explains itself in Norwegian', () => {
    const result = AliasSchema.safeParse('x')
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('minst 2 tegn')
})
