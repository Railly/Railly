# Components

## Purpose

Reusable UI components for the portfolio site. This directory owns all visual building blocks: cards, layouts, brand logos, and blog content rendering. It does NOT own page-level data or routing logic (those live in `src/pages/`).

## Entry Points

- `ui/Card.astro` - Base card with Flexoki color theming and hover effects
- `layout/PageLayout.astro` - Main page wrapper with 3-column grid layout
- `layout/Navigation.astro` - Sticky sidebar navigation
- `content/CustomCode.astro` - Code block wrapper for MDX posts

## Directory Structure

| Directory | Purpose | File Type |
|-----------|---------|-----------|
| `ui/` | Card variants (Project, Blog, Achievement, Present) | .astro |
| `layout/` | Page structure, navigation, sections | .astro |
| `brand/` | Logo components for projects/companies | .astro |
| `content/` | MDX content rendering (code blocks, ToC, quotes) | .astro |
| `blog/` | Blog-specific interactive components | .tsx |
| `flights/` | Flight tracking map visualizations | .tsx |

## Contracts & Invariants

- Cards accept a `color` prop matching Flexoki palette: `blue | teal | yellow | cyan | purple | magenta | orange`
- The `colorMap` object in `Card.astro` defines hover states, gradients, and shine effects per color
- All layout components expect to be used within `src/layouts/Layout.astro`
- React components (.tsx) exist only in `blog/` and `flights/` for client-side interactivity

## Patterns

### Adding a new Card variant

1. Create `ui/{Name}Card.astro`
2. Import and extend base `Card.astro`
3. Pass `color` prop for theming
4. Use `<slot>` for icon injection

### Adding a new brand logo

1. Create `brand/{Name}Logo.astro`
2. Export SVG as an Astro component
3. Accept optional `class` prop for sizing
4. Register in the `iconMap` of the page using it

### Adding a content component for MDX

1. Create `content/{Name}.astro`
2. Export from MDX config if needed for custom elements
3. Handle both light and dark theme rendering

## Anti-patterns

- Never put page data (heroData, projectsData) in components; define in `src/pages/`
- Don't use React for static content; only use .tsx when client-side JS is required
- Don't hardcode colors; always use Flexoki color props or CSS variables
- Don't import components across subdirectories (e.g., `ui/` importing from `content/`)

## Related Context

- Page routing: `src/pages/`
- Blog content: `src/content/blog/`
- Global styles: `src/styles/`
