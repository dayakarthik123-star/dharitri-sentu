/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Master GovTech Forest Green Palette
        'forest-primary': '#092F24',
        'forest-deep': '#103D30',
        'forest-surface': '#164B3A',
        'forest-action': '#147D4A',
        'forest-accent': '#35A66B',
        'forest-soft': '#E9F2EC',
        'page-bg': '#F7F9F6',
        'card-bg': '#FFFFFF',
        'text-main': '#15251F',
        'text-muted': '#66736D',
        'border-subtle': '#E5EBE7',
        'alert-amber': '#F2A900',
        'alert-amber-bg': '#FFF9E8',
        'alert-red': '#D94B58',

        // Legacy Aliases for seamless backward compatibility
        evergreen: '#092F24',
        teagreen: '#103D30',
        leafgreen: '#35A66B',
        mistyblue: '#E9F2EC',
        palesky: '#F7F9F6',
        warmivory: '#F7F9F6',
        cream: '#E9F2EC',
        earthaccent: '#F2A900',
        maintext: '#15251F',
        secondarytext: '#66736D',
        sapphire: '#147D4A',
        forestmist: '#E9F2EC',
        forestline: '#E5EBE7',
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans Bengali"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
        serif: ['"Plus Jakarta Sans"', '"Noto Sans Bengali"', '"Noto Sans Devanagari"', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Noto Sans Bengali"', '"Noto Sans Devanagari"', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', '"Noto Sans Bengali"', '"Noto Sans Devanagari"', 'sans-serif'],
      },
      boxShadow: {
        'forest': '0 24px 80px rgba(9, 47, 36, 0.18)',
        'soft': '0 4px 20px rgba(9, 47, 36, 0.05)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
      },
      letterSpacing: {
        tightest: '-0.035em',
        editorial: '0.12em',
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(18px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'slow-zoom': { '0%': { transform: 'scale(1.04)' }, '100%': { transform: 'scale(1.12)' } },
      },
      animation: { 'fade-up': 'fade-up .7s cubic-bezier(.22,1,.36,1) both', 'slow-zoom': 'slow-zoom 24s ease-in-out alternate infinite' },
    },
  },
  plugins: [],
}
