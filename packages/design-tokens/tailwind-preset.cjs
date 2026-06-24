/**
 * Tailwind-пресет BRICK. Все значения ссылаются на CSS-переменные из tokens.css,
 * поэтому правка tokens.json (→ перегенерация tokens.css) меняет и Tailwind-классы,
 * и Angular Material (через material-bridge.css) одновременно.
 */
const channel = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

const colorNames = [
    'brick-orange',
    'brick-orange-hover',
    'brick-orange-soft',
    'brick-peach',
    'neutral-950',
    'neutral-900',
    'neutral-850',
    'neutral-800',
    'neutral-750',
    'neutral-700',
    'neutral-600',
    'white',
    'text-primary',
    'text-secondary',
    'text-tertiary',
    'text-on-accent',
    'text-inverse',
    'danger',
    'success',
    'warning',
    'bg-app',
    'bg-deep',
    'surface-card',
    'surface-card-alt',
    'surface-chip',
    'accent',
    'accent-hover',
    'link',
    'price',
];

const colors = Object.fromEntries(colorNames.map((name) => [name, channel(name)]));

module.exports = {
    theme: {
        extend: {
            colors,
            borderRadius: {
                sm: 'var(--radius-sm)',
                md: 'var(--radius-md)',
                lg: 'var(--radius-lg)',
                xl: 'var(--radius-xl)',
                '2xl': 'var(--radius-2xl)',
                pill: 'var(--radius-pill)',
            },
            spacing: {
                1: 'var(--space-1)',
                2: 'var(--space-2)',
                3: 'var(--space-3)',
                4: 'var(--space-4)',
                5: 'var(--space-5)',
                6: 'var(--space-6)',
                8: 'var(--space-8)',
                10: 'var(--space-10)',
                12: 'var(--space-12)',
                16: 'var(--space-16)',
                18: 'var(--space-18)',
            },
            fontFamily: {
                display: 'var(--font-display)',
                body: 'var(--font-body)',
                input: 'var(--font-input)',
            },
            fontSize: {
                11: 'var(--fs-11)',
                12: 'var(--fs-12)',
                14: 'var(--fs-14)',
                16: 'var(--fs-16)',
                18: 'var(--fs-18)',
                20: 'var(--fs-20)',
                24: 'var(--fs-24)',
                32: 'var(--fs-32)',
                40: 'var(--fs-40)',
                48: 'var(--fs-48)',
                64: 'var(--fs-64)',
            },
            boxShadow: {
                glass: 'var(--shadow-glass)',
                'glass-hover': 'var(--shadow-glass-hover)',
                panel: 'var(--shadow-panel)',
                inset: 'var(--shadow-inset)',
                accent: 'var(--shadow-accent)',
                float: 'var(--shadow-float)',
            },
            backdropBlur: {
                glass: '36px',
                'glass-sm': '4px',
            },
            transitionTimingFunction: {
                out: 'var(--ease-out)',
                soft: 'var(--ease-soft)',
            },
            transitionDuration: {
                fast: '140ms',
                base: '220ms',
                slow: '360ms',
            },
            maxWidth: {
                container: 'var(--container-max)',
                content: 'var(--content-max)',
            },
        },
    },
};
