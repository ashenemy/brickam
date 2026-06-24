import nx from '@nx/eslint-plugin';

export default [
    ...nx.configs['flat/base'],
    ...nx.configs['flat/typescript'],
    ...nx.configs['flat/javascript'],
    {
        ignores: [
            '**/dist',
            '**/out-tsc',
            '**/coverage',
            '**/.nx',
            '_input/**',
            'packages/api-kit/src/generated',
        ],
    },
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        rules: {
            // Границы Nx: app→feature|kit|domain, feature→kit|domain, kit→kit|domain, domain→domain.
            // feature НЕ может зависеть от другого feature напрямую (только через domain-kit).
            '@nx/enforce-module-boundaries': [
                'error',
                {
                    enforceBuildableLibDependency: true,
                    allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
                    depConstraints: [
                        {
                            sourceTag: 'type:app',
                            onlyDependOnLibsWithTags: ['type:feature', 'type:kit', 'type:domain'],
                        },
                        {
                            sourceTag: 'type:feature',
                            onlyDependOnLibsWithTags: ['type:kit', 'type:domain'],
                        },
                        {
                            sourceTag: 'type:kit',
                            onlyDependOnLibsWithTags: ['type:kit', 'type:domain'],
                        },
                        {
                            sourceTag: 'type:domain',
                            onlyDependOnLibsWithTags: ['type:domain'],
                        },
                    ],
                },
            ],
        },
    },
    {
        files: [
            '**/*.ts',
            '**/*.tsx',
            '**/*.cts',
            '**/*.mts',
            '**/*.js',
            '**/*.jsx',
            '**/*.cjs',
            '**/*.mjs',
        ],
        // Форматирование — единолично у Biome. В ESLint все стилистические/форматирующие
        // правила выключены: плагин @stylistic не подключён, core-стилистика обнулена.
        rules: {
            indent: 'off',
            quotes: 'off',
            semi: 'off',
            'comma-dangle': 'off',
            'max-len': 'off',
            'arrow-parens': 'off',
            'object-curly-spacing': 'off',
            'no-extra-semi': 'off',
            'linebreak-style': 'off',
            // any допускается в дженерик-базах и тестах (Biome noExplicitAny тоже off)
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
];
