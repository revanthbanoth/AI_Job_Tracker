/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: "#6366f1", // Indigo
                secondary: "#8b5cf6", // Purple
                success: "#10b981",
                warning: "#f59e0b",
                danger: "#ef4444",
                background: "rgb(var(--color-background) / <alpha-value>)",
                card: "rgb(var(--color-card) / <alpha-value>)",
                text: "rgb(var(--color-text) / <alpha-value>)",
                border: "rgb(var(--color-border) / <alpha-value>)",
                muted: "rgb(var(--color-muted) / <alpha-value>)"
            }
        },
    },
    plugins: [],
}
