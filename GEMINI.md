# Gemini Frontend Assistant Configuration

## Core Tech Stack
- **Framework:** React (Vite / TypeScript preferred)
- **Styling:** Tailwind CSS (Utility-first, responsive, semantic colors)
- **Icons:** Lucide React

## Coding & Design Conventions
- **Tailwind Only:** Build entirely with Tailwind utility classes. Do not generate custom or external CSS files unless explicitly requested.
- **Mobile-First:** Implement layouts with a mobile-first philosophy, utilizing Tailwind's breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
- **TypeScript Strictness:** Always define strict TypeScript interfaces/types for component props. **NEVER** use `any` or `@ts-ignore` to bypass the type system.
- **Image Optimization:** Always use the Next.js `<Image />` component. For dynamic external photos from the `/api/media/photo` route, use the `unoptimized` prop to avoid local pattern limitations.
- **URL-Driven State:** Workspace navigation (active categories, selected IDs) should be stored in URL query parameters (`?category=...&id=...`) to enable deep-linking and persistent navigation.
- **Modular Architecture:** Keep workspace components small and modular. Store sub-components in dedicated subdirectories (e.g., `src/components/travel/discover/`). The main workspace file should act as a clean orchestrator.
- **Interactive UI:** Include states for user interactions (`hover:`, `focus:`, `active:`, `disabled:`).
- **Output:** Write clean, modular, production-ready code. Minimize conversational filler.

## Progressive Web App (PWA)
- The app is configured as a PWA. The manifest is located at `src/app/manifest.ts`.
- Maintain standalone mobile behavior and prevent viewport zooming in `src/app/layout.tsx`.