import { vi, test, expect } from 'vitest'

import { userInfo } from '@services/auth/auth'
import { userHasAccess } from '@services/auth/access-control'

vi.mock('@services/auth/auth', () => ({
    userInfo: vi.fn(),
}))

const mockedUserInfo = vi.mocked(userInfo)

test('user with all roles should have access to all features', async () => {
    mockedUserInfo.mockResolvedValue({
        oid: 'test-oid',
        name: 'Test User',
        userId: 'test-user',
        groups: [
            '74d71639-b6e1-487b-86e4-ca902a433f7c',
            '95f6101c-0cd4-4d4a-9435-6b1a7775782c',
            '8510a25e-2c26-4088-a8ff-a4a2a9de3d21',
            '35c70ac7-e8e6-4cec-933b-86106a97c0d4',
        ],
    })

    expect(await userHasAccess('ANY')).toBe(true)
    expect(await userHasAccess('UTVIKLER')).toBe(true)
    expect(await userHasAccess('BRUKSVILKÅR')).toBe(true)
    expect(await userHasAccess('TILBAKEMELDINGER')).toBe(true)
    expect(await userHasAccess('TEAM_MEMBER')).toBe(true)
})

test('user with only team member role should only have access to team member features', async () => {
    mockedUserInfo.mockResolvedValue({
        oid: 'test-oid',
        name: 'Test User',
        userId: 'test-user',
        groups: ['74d71639-b6e1-487b-86e4-ca902a433f7c'],
    })

    expect(await userHasAccess('ANY')).toBe(true)
    expect(await userHasAccess('UTVIKLER')).toBe(false)
    expect(await userHasAccess('BRUKSVILKÅR')).toBe(false)
    expect(await userHasAccess('TILBAKEMELDINGER')).toBe(false)
    expect(await userHasAccess('TEAM_MEMBER')).toBe(true)
})
