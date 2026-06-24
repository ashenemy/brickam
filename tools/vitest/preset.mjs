import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * Общий пресет Vitest для серверных kit-пакетов.
 * SWC включает legacy-декораторы и emit метаданных — нужно для Nest DI в тестах.
 * vite-tsconfig-paths резолвит алиасы @brickam/* из tsconfig.base.json.
 */
export function vitestPreset(rootDir) {
    return {
        plugins: [
            tsconfigPaths({ root: rootDir, projects: ['../../tsconfig.base.json'] }),
            swc.vite({
                jsc: {
                    target: 'es2022',
                    parser: { syntax: 'typescript', decorators: true },
                    transform: { legacyDecorator: true, decoratorMetadata: true },
                },
            }),
        ],
        test: {
            globals: true,
            environment: 'node',
            root: rootDir,
            include: ['src/**/*.spec.ts'],
            passWithNoTests: false,
            // запас на холодный SWC-transform и тяжёлые Nest-импорты под параллельной нагрузкой
            testTimeout: 20000,
            hookTimeout: 20000,
            coverage: {
                provider: 'v8',
                reporter: ['text', 'text-summary', 'lcov'],
                reportsDirectory: './coverage',
                include: ['src/**/*.ts'],
                exclude: [
                    'src/**/*.spec.ts',
                    'src/@types/**',
                    'src/index.ts',
                    'src/browser/**',
                    'src/**/*.module.ts',
                    'src/**/*.decorator.ts',
                    'src/**/dto/**',
                ],
                thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
            },
        },
    };
}
