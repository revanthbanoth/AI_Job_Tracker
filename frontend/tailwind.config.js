/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                serif: ['Fraunces', 'Georgia', 'serif'],
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            },
            borderRadius: {
                'card': '16px',
            },
            boxShadow: {
                'warm-sm': '0 2px 6px -1px rgba(31, 27, 22, 0.04), 0 1px 3px -1px rgba(31, 27, 22, 0.02)',
                'warm': '0 8px 24px -4px rgba(31, 27, 22, 0.06), 0 3px 8px -2px rgba(31, 27, 22, 0.04)',
                'warm-lg': '0 16px 36px -6px rgba(31, 27, 22, 0.08), 0 6px 14px -3px rgba(31, 27, 22, 0.04)',
            },
            colors: {
                primary: "rgb(var(--color-primary) / <alpha-value>)",
                'primary-hover': "rgb(var(--color-primary-hover) / <alpha-value>)",
                secondary: "rgb(var(--color-secondary) / <alpha-value>)",
                success: "rgb(var(--color-success) / <alpha-value>)",
                warning: "rgb(var(--color-warning) / <alpha-value>)",
                danger: "rgb(var(--color-danger) / <alpha-value>)",
                background: "rgb(var(--color-background) / <alpha-value>)",
                card: "rgb(var(--color-card) / <alpha-value>)",
                'card-subtle': "rgb(var(--color-card-subtle) / <alpha-value>)",
                text: "rgb(var(--color-text) / <alpha-value>)",
                border: "rgb(var(--color-border) / <alpha-value>)",
                muted: "rgb(var(--color-muted) / <alpha-value>)",
                terracotta: {
                    DEFAULT: "#D4663A",
                    50: "#FCF6F3",
                    100: "#F9ECE6",
                    200: "#F2D5C7",
                    500: "#D4663A",
                    600: "#BD542B",
                    700: "#9A401E"
                },
                sage: {
                    DEFAULT: "#5B8C6A",
                    50: "#F2F7F4",
                    100: "#E3ECE6",
                    500: "#5B8C6A",
                    600: "#4D7659"
                },
                amber: {
                    DEFAULT: "#E08E45",
                    500: "#E08E45"
                }
            }
        },
    },
    plugins: [],
}
