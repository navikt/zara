import { expect, test, vi } from 'vitest'

import { hashIdents } from './hash-idents-actions'

vi.mock('#lib/env', () => ({
    getServerEnv: () => ({ tsmIdentHashSecret: 'test-secret' }),
}))

vi.mock('#services/auth/auth', () => ({
    validateUserSession: vi.fn<() => Promise<object>>().mockResolvedValue({}),
}))

test('cleans line-separated idents and matches the production BigQuery hash', async () => {
    const result = await hashIdents(' 12098312309, \r\n\r\n\t12098312309 ,,,\t\n')

    expect(result).toEqual({
        results: Array(2).fill({
            ident: '12098312309',
            sha: '17399c6cdf164d65a88aadbe872f08912a21224cc353217d1bdd7f242aa1a918',
        }),
    })
})

test('rejects blank input', async () => {
    expect(await hashIdents(' \r\n\t\n')).toEqual({ error: expect.any(String) })
})

test('rejects malformed idents without returning partial results', async () => {
    expect(await hashIdents('12098312309\n12345')).toEqual({ error: expect.any(String) })
})
