'use client'

import { useTheme } from 'next-themes'
import { ReactElement } from 'react'
import { ActionMenu, Button, HStack, Tooltip } from '@navikt/ds-react'
import { CheckmarkIcon, MonitorIcon, MoonIcon, SunIcon, ThemeIcon } from '@navikt/aksel-icons'

export function ThemeToggler(): ReactElement {
    const { theme, setTheme } = useTheme()

    return (
        <ActionMenu>
            <Tooltip content="Bytt fargetema" placement="bottom">
                <ActionMenu.Trigger>
                    <Button variant="secondary-neutral" data-color="neutral" icon={<ThemeIcon aria-hidden />} />
                </ActionMenu.Trigger>
            </Tooltip>

            <ActionMenu.Content>
                <ActionMenu.Label>Velg fargetema</ActionMenu.Label>
                <ActionMenu.Group aria-label="Velg fargetema">
                    <ActionMenu.Item
                        icon={<MonitorIcon />}
                        aria-current={theme === 'system'}
                        onSelect={() => setTheme('system')}
                    >
                        <HStack gap="space-24" align="center">
                            System
                            {theme === 'system' && <CheckmarkIcon aria-hidden fontSize="1.25rem" />}
                        </HStack>
                    </ActionMenu.Item>

                    <ActionMenu.Item
                        icon={<SunIcon />}
                        aria-current={theme === 'light'}
                        onSelect={() => setTheme('light')}
                    >
                        <HStack gap="space-24" align="center">
                            Lyst
                            {theme === 'light' && <CheckmarkIcon aria-hidden fontSize="1.25rem" />}
                        </HStack>
                    </ActionMenu.Item>
                    <ActionMenu.Item
                        icon={<MoonIcon />}
                        aria-current={theme === 'dark'}
                        onSelect={() => setTheme('dark')}
                    >
                        <HStack gap="space-24" align="center">
                            Mørkt
                            {theme === 'dark' && <CheckmarkIcon aria-hidden fontSize="1.25rem" />}
                        </HStack>
                    </ActionMenu.Item>
                </ActionMenu.Group>
            </ActionMenu.Content>
        </ActionMenu>
    )
}
