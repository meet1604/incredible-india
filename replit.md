# Incredible India — Cinematic Travel Website

## Overview
A premium cinematic travel website hero banner inspired by myswitzerland.com, focused on India's most iconic destinations. The site features luxury editorial design, smooth GSAP animations, and immersive parallax effects.

## Architecture

### Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js (serving static frontend only)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: GSAP + ScrollTrigger, Framer Motion
- **Routing**: Wouter

### Key Files
- `client/src/pages/home.tsx` — Main cinematic hero page
- `client/src/App.tsx` — App router
- `client/src/index.css` — Global styles
- `tailwind.config.ts` — Design tokens (includes Cinzel, Cormorant Garamond, Inter, Montserrat fonts)

## Features
- **Cinematic Hero**: Full-screen slideshow with Ken Burns zoom effect and crossfade transitions between 6 Indian destinations
- **Smooth Animations**: GSAP-powered text reveal animations, scroll-triggered section reveals
- **Parallax Effects**: Framer Motion scroll-based parallax for hero section
- **Destinations Grid**: Editorial layout showcasing Taj Mahal, Udaipur, Kashmir, Ladakh, Lakshadweep, Statue of Unity
- **Experiences Section**: Hover-animated cards for Adventure, Heritage, Beaches, Spirituality
- **Responsive Design**: Works on all screen sizes (mobile, tablet, desktop)
- **Luxury Typography**: Cinzel for headings, Cormorant Garamond for elegant subtitles, Inter/Montserrat for UI

## Destinations Featured
1. Taj Mahal — Agra, Uttar Pradesh
2. Udaipur — Rajasthan
3. Kashmir — Jammu & Kashmir
4. Ladakh — Union Territory
5. Lakshadweep — Union Territory
6. Statue of Unity — Gujarat

## Design System
- Dark cinematic theme (`#0a0a0a` background)
- Amber/gold accents (`amber-400`)
- Luxury serif fonts (Cinzel, Cormorant Garamond)
- Minimal UI with maximum visual impact
- Clip-path button styling for premium feel
