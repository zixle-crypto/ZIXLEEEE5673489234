import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				
				/* Game-specific colors */
				game: {
					bg: 'hsl(var(--game-bg))',
					surface: 'hsl(var(--game-surface))',
					border: 'hsl(var(--game-border))',
					text: 'hsl(var(--game-text))',
					'text-dim': 'hsl(var(--game-text-dim))',
					danger: 'hsl(var(--game-danger))',
					safe: 'hsl(var(--game-safe))',
					neutral: 'hsl(var(--game-neutral))',
					collect: 'hsl(var(--game-collect))'
				},
				perception: {
					DEFAULT: 'hsl(var(--perception-teal))',
					glow: 'hsl(var(--perception-teal-glow))',
					dark: 'hsl(var(--perception-teal-dark))'
				},
				hud: {
					bg: 'hsl(var(--hud-bg))',
					border: 'hsl(var(--hud-border))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				/* Game-specific animations */
				'perception-pulse': {
					'0%, 100%': { 
						boxShadow: '0 0 0 0 hsl(var(--perception-teal) / 0.7)' 
					},
					'70%': { 
						boxShadow: '0 0 0 10px hsl(var(--perception-teal) / 0)' 
					}
				},
				'tile-flip': {
					'0%': { transform: 'rotateY(0deg)' },
					'50%': { transform: 'rotateY(90deg)' },
					'100%': { transform: 'rotateY(0deg)' }
				},
				'shard-collect': {
					'0%': { 
						transform: 'scale(1) rotate(0deg)',
						opacity: '1'
					},
					'100%': { 
						transform: 'scale(1.5) rotate(180deg)',
						opacity: '0'
					}
				},
				'attention-glow': {
					'0%, 100%': { 
						filter: 'drop-shadow(0 0 5px hsl(var(--perception-teal) / 0.5))' 
					},
					'50%': { 
						filter: 'drop-shadow(0 0 20px hsl(var(--perception-teal) / 0.8))' 
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'perception-pulse': 'perception-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'tile-flip': 'tile-flip 0.3s ease-in-out',
				'shard-collect': 'shard-collect 0.4s ease-out forwards',
				'attention-glow': 'attention-glow 1.5s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
