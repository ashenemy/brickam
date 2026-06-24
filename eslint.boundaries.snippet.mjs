// Фрагмент для корневого eslint.config.mjs (flat config).
// Теги на проектах (в project.json -> "tags"):
//   type:app | type:feature | type:kit | type:domain | type:tooling
//   scope:main | scope:vendor | scope:admin | scope:server | scope:shared
export const moduleBoundaries = {
    '@nx/enforce-module-boundaries': [
        'error',
        {
            enforceBuildableLibDependency: true,
            depConstraints: [
                {
                    sourceTag: 'type:app',
                    onlyDependOnLibsWithTags: ['type:feature', 'type:kit', 'type:domain'],
                },
                // feature НЕ может зависеть от другого feature напрямую:
                {
                    sourceTag: 'type:feature',
                    onlyDependOnLibsWithTags: ['type:kit', 'type:domain'],
                },
                { sourceTag: 'type:kit', onlyDependOnLibsWithTags: ['type:kit', 'type:domain'] },
                { sourceTag: 'type:domain', onlyDependOnLibsWithTags: ['type:domain'] },
            ],
        },
    ],
};
// ВАЖНО: в ESLint отключить все стилистические правила (формат — у Biome).
