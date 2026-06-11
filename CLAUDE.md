# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Railly Hugo built with Astro 5, React 19, and Tailwind CSS 4. The site showcases projects, blog posts, achievements, and uses a grayscale CSS custom property palette for theming with Vesper syntax highlighting themes.

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
- **Styling**: Tailwind CSS 4 with grayscale CSS custom property color system
- **Content**: MDX for blog posts with Astro content collections
- **Deployment**: Vercel (configured via @astrojs/vercel adapter)
- **Analytics**: Vercel Web Analytics enabled
- **Database**: Vercel KV for blog post view counts

### Project Structure
- `src/pages/` - File-based routing: about, agents, ai-tools-spectrum, bookshelf, flights, gallery, index, meet, mentoring, people, projects, uses, writing; plus `blog/[...slug]`, `blog/index`, `til/index`, `drafts/[id]`
- `src/content/blog/` - MDX blog posts managed via content collections (schema in `src/content/config.ts`)
- `src/components/` - Organized into subdirectories:
  - `brand/` - Logo components (Elements, Tinte, Clerk, etc.)
  - `content/` - Blog content components (CodeBlock, TableOfContents, etc.)
  - `ui/` - Reusable UI components (Card variants, etc.)
  - `layout/` - Layout components (Navigation, Footer, PageLayout, HeroSection)
- `src/layouts/` - Page layouts with meta tags, SEO, and view transitions
- `src/styles/` - Global styles split into modular CSS files (global.css, fonts.css, code.css, reset.css)
- `src/config/site.ts` - Centralized site configuration (name, description, social links, theme colors)
- `public/themes/` - Vesper syntax themes (vesper-dark.json, vesper-light.json) used for Shiki highlighting

### Key Features

**Design System**
- Grayscale color palette via CSS custom properties in `src/styles/global.css`: `--color-primary`, `--color-background`, `--color-background-2`, `--color-foreground`, `--color-foreground-2`, `--color-foreground-3`, `--color-ui`, `--color-ui-2`, `--color-ui-3`; light/dark via `@media (prefers-color-scheme: dark)`
- IBM Plex font family (Sans, Serif, Mono) via @fontsource
- Syntax highlighting uses Vesper themes (`public/themes/vesper-dark.json`, `vesper-light.json`) configured in `astro.config.mjs`

**Content System**
- Blog posts are MDX files with frontmatter schema validation
- Support for math rendering (remark-math + rehype-katex)
- Post statuses: draft, published, archived
- Custom code blocks with Vesper theme integration
- Shiki syntax highlighting with custom transformers for line numbering

**API Routes**
- `/api/views.ts` - GET; blog post view tracking via Vercel KV (`id`, optional `incr` query params); returns `{slug, views}`
- `/api/claps.ts` - GET/POST; clap counts per post via Vercel KV
- `/api/comments.ts` - GET/POST; draft comments via Vercel KV
- `/api/og.ts` - GET; generates Open Graph images via @vercel/og
- `/api/projects.json.ts` - GET; returns projects list as JSON (prerendered)
- `/api/subscribe.ts` - POST; newsletter subscribe via Resend (`RESEND_API_KEY`, `RESEND_SEGMENT_ID`)
- `/api/newsletter/send.ts` - POST; send newsletter broadcast via Resend; Bearer auth (`NEWSLETTER_API_SECRET`)
- `/api/cron/rebuild.ts` - GET; triggers a Vercel deploy hook; Bearer auth (`CRON_SECRET`); uses `VERCEL_DEPLOY_HOOK`

**View Transitions**
- Astro view transitions enabled via `<ClientRouter />`
- Custom blur-scale animations for page transitions
- Respects `prefers-reduced-motion`

**Navigation**
- Sticky sidebar navigation on desktop (lg+)
- Mobile navigation with horizontal layout
- 14 top-level page routes: home, about, writing, blog, til, drafts, gallery, people, flights, meet, agents, ai-tools-spectrum, bookshelf, mentoring, projects, uses (plus dynamic `blog/[...slug]` and `drafts/[id]`)

**Component Patterns**
- Data objects defined in page files (heroData, projectsData, achievementsData, presentData)
- Icon mapping pattern: `iconMap` object maps string keys to component imports
- Cards use color prop system matching the site palette
- Astro slots for flexible content injection (`<slot name="icon">`)

### Environment Variables
Required for production (see `.env.example` for the full list):
- `KV_REST_API_URL` - Vercel KV database URL
- `KV_REST_API_TOKEN` - Vercel KV auth token
- `KV_REST_API_READ_ONLY_TOKEN` - Vercel KV read-only token
- `RESEND_API_KEY` - Resend API key for newsletter
- `RESEND_SEGMENT_ID` - Resend audience segment for newsletter
- `NEWSLETTER_API_SECRET` - Bearer secret for `/api/newsletter/send`
- `CRON_SECRET` - Bearer secret for `/api/cron/rebuild`
- `DRAFT_SECRET` - HMAC key for draft preview URLs
- `VERCEL_DEPLOY_HOOK` - Deploy hook URL used by `/api/cron/rebuild`

### Astro Configuration
- MDX integration with math plugins enabled
- React integration for interactive components
- Vercel adapter with web analytics
- Shiki configured with dual Vesper themes (light: vesper-light.json, dark: vesper-dark.json)
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

- All colors use the grayscale palette via `--color-primary`, `--color-background`, `--color-foreground-*`, `--color-ui-*` CSS custom properties defined in `src/styles/global.css`
- Light/dark mode values must always be paired in theme definitions
- React components (.tsx) are only for client-side interactivity; prefer Astro (.astro) for static content
- Never import from `node_modules` directly for fonts; use @fontsource packages
