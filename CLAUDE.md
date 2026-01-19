# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Railly Hugo built with Astro 5, React 19, and Tailwind CSS 4. The site showcases projects, blog posts, achievements, and uses the Flexoki color palette for theming with custom "One Hunter" syntax highlighting themes.

## Common Commands

### Development
```bash
bun dev              # Start dev server (default: localhost:4321)
bun run build        # Build for production
bun run preview      # Preview production build
```

## Architecture

### Stack
- **Framework**: Astro 5 with SSR/SSG hybrid rendering
- **UI Components**: Mix of Astro components (.astro) and React components (.tsx)
- **Styling**: Tailwind CSS 4 with custom Flexoki color system
- **Content**: MDX for blog posts with Astro content collections
- **Deployment**: Vercel (configured via @astrojs/vercel adapter)
- **Analytics**: Vercel Web Analytics enabled
- **Database**: Vercel KV for blog post view counts

### Project Structure
- `src/pages/` - File-based routing (index, about, writing, gallery, people, flights, meet, blog)
- `src/content/blog/` - MDX blog posts managed via content collections (schema in `src/content/config.ts`)
- `src/components/` - Organized into subdirectories:
  - `brand/` - Logo components (Elements, Tinte, Clerk, etc.)
  - `content/` - Blog content components (CodeBlock, TableOfContents, etc.)
  - `ui/` - Reusable UI components (Card variants, etc.)
  - `layout/` - Layout components (Navigation, Footer, PageLayout, HeroSection)
- `src/layouts/` - Page layouts with meta tags, SEO, and view transitions
- `src/styles/` - Global styles split into modular CSS files (flexoki.css, fonts.css, code.css, reset.css)
- `src/config/site.ts` - Centralized site configuration (name, description, social links, theme colors)
- `public/themes/` - Custom VS Code themes (one-hunter-dark.json, one-hunter-light.json) used for syntax highlighting

### Key Features

**Design System**
- Flexoki color palette with light/dark mode support via CSS custom properties
- Custom color mapping system: `--color-flexoki-{color}` maps to theme-aware values
- IBM Plex font family (Sans, Serif, Mono) via @fontsource

**Content System**
- Blog posts are MDX files with frontmatter schema validation
- Support for math rendering (remark-math + rehype-katex)
- Post statuses: draft, published, archived
- Custom code blocks with One Hunter theme integration
- Shiki syntax highlighting with custom transformers for line numbering

**API Routes**
- `/api/views.ts` - GET endpoint for blog post view tracking using Vercel KV
  - Query params: `id` (required), `incr` (optional for incrementing)
  - Returns JSON: `{slug, views}` or error

**View Transitions**
- Astro view transitions enabled via `<ClientRouter />`
- Custom blur-scale animations for page transitions
- Respects `prefers-reduced-motion`

**Navigation**
- Sticky sidebar navigation on desktop (lg+)
- Mobile navigation with horizontal layout
- Three main routes: home, about, writing

**Component Patterns**
- Data objects defined in page files (heroData, projectsData, achievementsData, presentData)
- Icon mapping pattern: `iconMap` object maps string keys to component imports
- Cards use color prop system matching Flexoki palette
- Astro slots for flexible content injection (`<slot name="icon">`)

### Environment Variables
Required for production:
- `KV_REST_API_URL` - Vercel KV database URL
- `KV_REST_API_TOKEN` - Vercel KV auth token

### Astro Configuration
- MDX integration with math plugins enabled
- React integration for interactive components
- Vercel adapter with web analytics
- Shiki configured with dual One Hunter themes (light/dark)
- Tailwind via Vite plugin

### Important Implementation Details
- Site uses view transitions - be mindful of client-side state persistence
- Blog view counter is a React component (`ViewCounter.tsx`) for client-side interactivity
- Custom CSS theme variables must maintain both light and dark mode values
- API routes require `export const prerender = false` for SSR

## Intent Layer

**Before modifying code in a subdirectory, read its AGENTS.md first** to understand local patterns and invariants.

- **Components**: `src/components/AGENTS.md` - UI component library (Astro + React)

### Global Invariants

- All colors use Flexoki palette via `--color-flexoki-{color}` CSS variables
- Light/dark mode values must always be paired in theme definitions
- React components (.tsx) are only for client-side interactivity; prefer Astro (.astro) for static content
- Never import from `node_modules` directly for fonts; use @fontsource packages
