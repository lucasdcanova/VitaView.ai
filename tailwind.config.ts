import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Montserrat", "system-ui", "sans-serif"],
        body: ["Open Sans", "system-ui", "sans-serif"],
        sans: ["Open Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // VitaView Design Language Colors
        charcoal: "var(--charcoal-gray)", // Charcoal Gray
        mediumGray: "var(--medium-gray)", // Medium Gray
        lightGray: "var(--light-gray)", // Light Gray
        pureWhite: "var(--pure-white)", // Pure White
        backgroundGray: "var(--background-gray)", // Light Background Gray

        // Legacy/Compatibility maps
        gray: {
          50: "var(--background-gray)",
          100: "var(--light-gray)",
          200: "#BDBDBD",
          300: "var(--medium-gray)",
          400: "#757575",
          500: "#616161",
          600: "#424242",
          700: "var(--charcoal-gray)",
          800: "#1A1A1A",
          900: "#121212",
        },
        // System Colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "var(--background-gray)",
          100: "var(--light-gray)",
          200: "#BDBDBD",
          300: "var(--medium-gray)",
          400: "#757575",
          500: "#616161",
          600: "#424242",
          700: "var(--charcoal-gray)",
          800: "#1A1A1A",
          900: "#121212",
          950: "#0A0A0A",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "#212121",
          "2": "#424242",
          "3": "#616161",
          "4": "#9E9E9E",
          "5": "#BDBDBD",
        },
        sidebar: {
          DEFAULT: "var(--pure-white)",
          foreground: "var(--charcoal-gray)",
          primary: "var(--charcoal-gray)",
          "primary-foreground": "var(--pure-white)",
          accent: "var(--light-gray)",
          "accent-foreground": "var(--charcoal-gray)",
          border: "var(--light-gray)",
          ring: "var(--charcoal-gray)",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
