import { defineConfig } from 'oxlint'

export default defineConfig({
    plugins: [
        'nextjs',
        'import',
        'vitest',
        'jsx-a11y',
        'promise',
        'typescript',
        'react',
        'react-perf',
        'oxc',
        'node',
        'unicorn',
    ],
    options: { typeCheck: true, typeAware: true },
    rules: {
        'react/rules-of-hooks': 'error',
        'no-console': 'warn',
        'no-unused-expressions': 'warn',
        'no-array-constructor': 'warn',
        'typescript/no-explicit-any': 'warn',
        'typescript/no-require-imports': 'warn',
        'typescript/ban-ts-comment': ['warn', { 'ts-expect-error': 'allow-with-description' }],
        'typescript/no-non-null-assertion': 'warn',
        'typescript/no-unsafe-function-type': 'warn',
        'typescript/no-empty-object-type': 'warn',
        'typescript/no-unnecessary-type-constraint': 'warn',
        'typescript/explicit-function-return-type': ['warn', { allowExpressions: true }],
        'react/jsx-curly-brace-presence': 'warn',
        // TODO: Consider turning on
        'typescript/no-misused-spread': 'off',
    },
    overrides: [
        {
            files: ['libs/*-mock/**/*.{ts,tsx}'],
            rules: {
                // TODO: Consider turning on
                'typescript/no-base-to-string': 'off',
                'typescript/no-non-null-assertion': 'off',
            },
        },
        {
            files: ['**/*.{test,integration}.{ts,tsx}'],
            rules: {
                'typescript/no-non-null-assertion': 'off',
            },
        },
    ],
})
