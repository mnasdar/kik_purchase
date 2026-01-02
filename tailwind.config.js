const colors = require('tailwindcss/colors');

module.exports = {
    content: [
        "node_modules/@frostui/tailwindcss/**/*.js",
        './storage/framework/views/*.php',
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.vue',
    ],
    darkMode: ['class', '[data-mode="dark"]'],
    theme: {

        container: {
            center: true,
        },

        fontFamily: {
            'base': ['Inter', 'sans-serif'],
        },

        extend: {
            colors: {
                'primary': '#3073F1',
                'secondary': '#68625D',
                'success': '#1CB454',
                'warning': '#E2A907',
                'info': '#0895D8',
                'danger': '#E63535',
                'light': '#eef2f7',
                'dark': '#313a46',

                // Enable shorthand 'bg-cyan' and full palette variants like 'bg-cyan-600'
                cyan: {
                    DEFAULT: colors.cyan[500],
                    ...colors.cyan,
                },
            },
        },
    },

    plugins: [
        require('@frostui/tailwindcss/plugin'),
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
        require('@tailwindcss/aspect-ratio'),

    ],

    // Ensure dynamically generated color utilities are included even if not statically present in templates
    safelist: [
        {
            pattern: /^(bg|text|border|ring|fill|stroke)-(cyan|sky|blue|amber|rose|red|orange|yellow|green|lime|emerald|teal|indigo|violet|purple|fuchsia|pink|slate|gray|neutral|stone|zinc)-(50|100|200|300|400|500|600|700|800|900|950)$/,
            variants: ['hover', 'focus', 'active', 'disabled', 'dark'],
        },
        // Shorthand without shade, e.g. 'bg-cyan', 'text-slate'
        {
            pattern: /^(bg|text|border|ring|fill|stroke)-(cyan|sky|blue|amber|rose|slate|zinc)$/,
            variants: ['hover', 'dark'],
        },
    ],
}
