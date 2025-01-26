/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {

			fontFamily: {
				sans: ['Nunito Variable', 'sans-serif'], 
			  },
			  colors: {
				brand: {
				  primary: 'var(--brand-primary)', // Maps to --brand-primary
				  secondary: 'var(--brand-secondary)',
				  accent: 'var(--brand-accent)',
				  accent2: 'var(--brand-accent2)', // Maps to --brand-secondary
				  text: 'var(--text-color)', // Maps to --text-color
				   // Maps to --brand-accent
				},
			  },

		},
	},
	plugins: [],
}




