import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        root: import.meta.dirname,
        include: ['src/**/*.spec.ts'],
        testTimeout: 20000,
    },
});
