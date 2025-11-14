/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {

            colors: {
                light_primary: "#ECFAE5",
                secondary: "#DDF6D2",
                tertiary: "#B0DB9C",
                background: "#819A91",
                text: "#EEEFE0",
                light_accent: "#A7C1A8",
                error: "#F44336",
                success: "#4CAF50",
                warning: "#FF9800",
                primary: {
                    100: "#0061FF0A",
                    200: "#0061FF1A",
                    300: "#0061FF",
                },
                accent: {
                    100: "#FBFBFD",
                },
                black: {
                    DEFAULT: "#000000",
                    100: "#8C8E98",
                    200: "#666876",
                    300: "#191D31",
                },
                danger: "#F75555",
            },
        },
    },
    plugins: [],
};