import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [
        tsconfigPaths({ root: import.meta.dirname, projects: ['../../tsconfig.base.json'] }),
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
        root: import.meta.dirname,
        include: ['src/**/*.spec.ts'],
        testTimeout: 30000,
        hookTimeout: 30000,
    },
});
