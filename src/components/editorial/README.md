# Editorial primitives

The site's look, first built for `/mentoring`, as server-rendered Astro components. Styles live in `src/styles/editorial.css` (imported by `global.css`). The home page (`src/pages/index.astro`) is the reference migration.

## Typography

| Use | Font | How |
| --- | --- | --- |
| Page titles (H1), section titles (H2), pull quotes, menu names, timeline titles, the home display sentence | Redaction (serif) | `PageHero`, `Section`, `PullQuote`, `MenuRow`, `Timeline`, `.ed-display` |
| Eyebrows, section numbers, captions, column notes, dates, counts, prices, stars | Commit Mono | `.ed-label` (11px, faded), `.ed-num` (12px, tabular) |
| Body, row titles, descriptions, buttons | Geist Sans | default |

Rules of thumb:

- Serif is for things you read as a headline. Never set body copy or UI controls in serif.
- Mono is for things you scan: numbers, dates, metadata. Keep it small (11-12px) and faded (`--color-foreground-3`). Large mono only for prices (`MenuRow`).
- Secondary text is the main ink faded: `text-foreground-2` for ledes and descriptions, `text-foreground-3` for meta.
- No uppercase labels and no tracking-wide caps. Italics only in Redaction.

## Spacing rhythm

- Page opener (`PageHero`): 1.5rem between eyebrow, title, lede and extras (`gap-5` for tighter pages).
- Between sections: 5rem (`Section` default). Use `class="mt-16"` for a short section or the first section after a tall hero.
- Inside a section: 1.25rem between the heading and content (`class="gap-6"` or `gap-2` to override).
- List rows: 0.875rem vertical padding, `dense` gives 0.5rem for long lists.
- Text column: 42rem (set by `PageLayout`).

## Tokens

Defined on `:root`, light and dark follow `--color-foreground`:

| Token | Use |
| --- | --- |
| `--ed-line` | hairline rules and tile borders (11% ink) |
| `--ed-line-2` | stronger rules, hover borders, dotted leaders (22%) |
| `--ed-shadow` / `--ed-shadow-2` | 3px offset shadow, resting and hover (8% / 16%) |
| `--ed-wash` | faint fill for a featured block (3.5%) |

In Tailwind, use them as arbitrary values: `border-[var(--ed-line)]`, `shadow-[3px_3px_0_var(--ed-shadow)]`, `bg-[var(--ed-wash)]`.

## Utility classes

Unlayered, so they beat Tailwind utilities on the same element. Safe in React islands too.

| Class | What |
| --- | --- |
| `.ed-label` | mono label; as a link it brightens on hover |
| `.ed-num` | mono tabular number |
| `.ed-link` | underlined inline link that darkens on hover |
| `.ed-tile` | hairline box + 3px offset shadow |
| `.ed-art` | dot-grid panel with a tile edge |
| `.ed-btn`, `.ed-btn-ink` | outline button that lifts and presses; ink variant is filled |
| `.ed-leader` | dotted leader inside a flex row |
| `.ed-rise` | short rise-in animation for values that change |
| `.ed-display` | the home's Redaction display sentence |

An editorial utility class beats a Tailwind utility that sets the same property on the same element. Example: `class="ed-label text-foreground-2"` stays `foreground-3`. Use a wrapper or inline style when you need a different color.

## Primitives

All accept `class`. Primitive internals sit in `@layer components`, so Tailwind utilities passed in `class` (margins, gaps, padding) override their defaults. Every root carries `.ed`.

### PageHero

Eyebrow, Redaction H1, lede. Extras (buttons, a `StatStrip`) go in the default slot. Use the `lede` slot for a lede with links. `srTitle` renders a screen-reader H1 when the visible opener is not a title.

```astro
<PageHero eyebrow={["1:1 mentoring", "Spanish or English", "from $59"]} title="Mentoring">
	<Fragment slot="lede">Most of them ask me the <a href="/blog/x" class="ed-link text-foreground">same three things</a>.</Fragment>
	<Button href="#options" variant="primary">See options</Button>
</PageHero>
```

### Eyebrow

Mono line of facts joined by middle dots. `PageHero` uses it; use it alone above any heading.

```astro
<Eyebrow items={["Your session", session.date]} />
```

### Section

Numbered Redaction heading plus content. `id` is the heading id (the section is labelled by it), `anchor` is the section's own id for `#links`. `note` is a mono note on the right; use the `note` slot for a link or badge, and `noteInline` to put it right after the title. `ink` hooks the heading into the InkReveal scroll effect.

```astro
<Section id="h-options" anchor="options" number={2} title="Ways to work together" note="Prices in USD">
	...
</Section>
```

### SectionTitle

Just the numbered heading, no wrapper. `layout/SectionHeader` renders it, so every legacy page heading already looks editorial.

```astro
<SectionTitle title="Sources" number={3} level={3} />
```

### StatStrip

Cells between hairlines. `variant="number"` (default) sets values in large Redaction; `variant="text"` sets short facts in medium sans. Columns default to one per stat; 4+ stats wrap to 2 columns on phones (`cols`, `mobileCols` to change).

```astro
<StatStrip stats={[{ label: "Devs mentored 1:1", value: 25 }, { label: "Upcoming", value: 0 }]} />
<StatStrip variant="text" stats={[{ label: "Date", value: "October 31, 2026" }]} />
```

### List and ListRow

Hairline-divided rows. A row has an optional `index` (letter or number), a `leading` mark (slot, rendered monochrome), `title` (or `title` slot) with an optional faded `titleSuffix`, `description`, `meta` (mono, right) and an arrow (default on for links without meta). Below 640px the description wraps under the title. `external` opens a new tab. Pass `meta=""` on rows without a value so descriptions still line up.

```astro
<List>
	{topics.map((t, i) => <ListRow href={t.href} index={`${String.fromCharCode(97 + i)}.`} title={t.title} description={t.description} />)}
</List>

<List>
	<ListRow dense href={e.url} title={e.role} titleSuffix={` at ${e.org}`} meta={e.when}>
		<BrandIcon slot="leading" name={e.icon} width={14} height={14} />
	</ListRow>
</List>
```

Use `as="div"` to render a row outside a `List`.

### MenuRow

Name, dotted leader, value. `size="lg"` (default) is the pricing row: Redaction name, large mono value, optional `index` and `meta` line, body in the slot. `size="sm"` is a compact sans line for specs or inventories.

```astro
<MenuRow index="02" name="Deep session" value="$89" meta="60 min · 1:1">
	<p class="text-[14.5px] text-foreground-2">One problem, properly.</p>
</MenuRow>
<MenuRow size="sm" name="Keyboard" value="Keychron K2" />
```

The interactive pricing table on `/mentoring` is a React island and uses the same classes (`.ed-leader`, `.ed-label`) directly.

### PullQuote

Large Redaction quote with an avatar and attribution.

```astro
<PullQuote quote="I saved myself 2 months of Claude tokens." name="Valentin Rodriguez" context="Cofounder of Avvy Talent" image="/mentoring/valentin-rodriguez.webp" />
```

### Tile

Hairline box with the offset shadow. With `href` it is a link that lifts on hover. Layout and padding come from `class`.

```astro
<Tile href="#download" class="group flex items-center gap-4 p-4">...</Tile>
```

### Button

`variant="primary"` (filled ink) or `"secondary"` (outline). With `href` it renders a link, otherwise a `<button>` (`type` defaults to `"button"`).

```astro
<Button href="#options" variant="primary">See options <span aria-hidden="true">&darr;</span></Button>
<Button type="submit">Send</Button>
```

### Timeline

Numbered markers joined by a dashed rule, each step with `when`, `title`, `description`. Static; use a ui-sdk island only if a step needs interaction.

```astro
<Timeline label="How a paid session works" steps={steps} />
```

## How it coexists with the legacy rules

`src/styles/system.css` still normalizes older pages (sans 15px h2s, no uppercase or italics, hairline borders, tile boxes). Every rule there skips `.ed` and its descendants, so anything inside a primitive renders as designed on any page, with no `bare` needed. Older markup around the primitives keeps its normalization until the page is migrated. Delete `system.css` once every page is on the primitives.

Inside `.ed`, form controls get `font: revert-layer`, which undoes `reset.css`'s unlayered `font: inherit` so Tailwind font utilities on buttons and inputs work.

## How to migrate a page (Phase 2 checklist)

1. Keep `Layout` + `PageLayout`. Drop `bare` unless the page has a reason to opt out of the legacy rules entirely.
2. Replace the page's opening block with `PageHero`. Build the eyebrow only from facts already on the page.
3. Wrap each block in `Section` with a `number` (01, 02, ...) and the existing heading text. Remove manual `<h2>` and `SectionHeader` calls inside it.
4. Turn row lists into `List` + `ListRow`; key/value specs into `MenuRow size="sm"`; counts into `StatStrip`; testimonials into `PullQuote`; cards into `Tile`; CTAs into `Button`.
5. Swap ad-hoc label styles (`font-mono text-xs uppercase tracking-wider text-foreground-3`) for `.ed-label` and inline links for `.ed-link`.
6. Use tokens (`var(--ed-line)`) instead of `border-ui` or literal colors for rules.
7. Do not change copy or numbers. Only presentation.
8. Check at 1280 and 375, light and dark: `document.documentElement.scrollWidth === innerWidth` at 375, and Redaction, Commit Mono and Geist all appear in `document.fonts` as loaded.
9. Run `bunx biome check <files>` and `bun run build`.
