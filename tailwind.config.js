/** Tailwind на пресете дизайн-токенов BRICK (все значения — var(--…) из tokens.css). */
const preset = require('./packages/design-tokens/tailwind-preset.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
    presets: [preset],
    content: [
        './apps/**/*.{html,ts}',
        './packages/ui-kit/**/*.{html,ts}',
        './packages/feature/**/*.{html,ts}',
    ],
    theme: { extend: {} },
    plugins: [],
};
