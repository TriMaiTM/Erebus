/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0F1117", // Màu nền chính (rất tối, hơi xanh nhẹ)
                surface: "#1E2029",    // Màu nền card/sidebar
                border: "#2F3342",     // Màu viền mờ
                primary: "#5E6AD2",    // Màu tím chủ đạo của Linear
                "primary-hover": "#4E5AC0",
                text: {
                    primary: "#F7F8F8",
                    secondary: "#8A8F98",
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Linear dùng font Inter
            }
        },
    },
    plugins: [],
}