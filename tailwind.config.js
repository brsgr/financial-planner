/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#0a0a0a",
          bgLight: "#151515",
          text: "#d4d4d4",
          amber: "#ff9800",
          amberDim: "#cc7a00",
          green: "#4caf50",
          greenDim: "#2d6b2f",
          border: "#333333",
        },
      },
      fontFamily: {
        mono: [
          "IBM Plex Mono",
          "Consolas",
          "Monaco",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
