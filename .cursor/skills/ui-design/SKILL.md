---
name: ui-design
description: Guide CSS/SCSS styling and responsive design for this Jekyll lab website. Use when the user asks to beautify, style, fix layout issues, improve responsiveness, or optimize visual design of any page or component.
---

# UI Design Guide for NEUIR Lab Website

## Tech Stack

- **Static site generator**: Jekyll
- **Styling**: SCSS (in `_styles/` folder, auto-imported)
- **Components**: Liquid templates (in `_includes/`)
- **Layout**: Flexbox-based, container queries for responsive

## Design Tokens (in `_styles/-theme.scss`)

```scss
// Colors
--primary: #0795d9;     // Main accent (blue)
--secondary: #7dd3fc;   // Secondary accent
--text / --background;  // Auto-switch for dark/light
--background-alt;       // Alternating section bg

// Typography
--title / --heading / --body: "Barlow", sans-serif;
--large: 1.2rem; --xl: 1.4rem; --xxl: 1.6rem;

// Effects
--rounded: 5px;
--shadow: 0 2px 12px 0 var(--overlay);
--transition: 0.2s ease;
```

## Design Principles

1. **Subtle interactions**: Use `translateY(-2px)` hover lifts with shadow enhancement
2. **Consistent spacing**: Use multiples of 4px (8, 12, 16, 20, 24, 40)
3. **Mobile-first images**: Never use `position: absolute` for content images; prefer flexbox centering with `object-fit: contain`
4. **Container queries**: Use `@container` instead of `@media` for component-level responsive behavior
5. **Dark mode safe**: Always use CSS variables, never hardcode colors
6. **No inline styles**: Move all styling to SCSS files; avoid `style=""` in HTML templates

## Component Patterns

### Card/Citation images (fixed pattern)

```scss
.component-image {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  padding: 16px;
  background: var(--background-alt);
}

.component-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
```

### Hover lift effect

```scss
.card-element {
  transition: transform var(--transition), box-shadow var(--transition);
}
.card-element:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px 0 var(--overlay);
}
```

### Badge/Tag styling

```scss
.badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 0.8em;
  font-weight: var(--semi-bold);
  // Use semi-transparent bg with solid text
  background: rgba($color, 0.12);
  color: $color;
}
```

## Responsive Breakpoints

| Size | Variable | Usage |
|------|----------|-------|
| Mobile | `max-width: 500px` | Single column |
| Tablet | `max-width: 750px` | Two columns |
| Desktop | `max-width: 800px` | Component wrap point |
| Content | `$page: 1000px` | Max content width |

## Common Pitfalls

- **Image offset**: Never add `margin-left` to absolutely positioned images
- **Overflow**: Always set `overflow: hidden` on cards with `border-radius`
- **Dark mode**: Test both modes; use `var()` tokens not raw hex
- **Mobile tap**: Ensure touch targets are at least 44x44px
- **Container queries**: Use `container-type: inline-size` on parent, `@container` on child

## File Structure

| Path | Purpose |
|------|---------|
| `_styles/-theme.scss` | Design tokens (colors, fonts, effects) |
| `_styles/citation.scss` | Paper list cards |
| `_styles/card.scss` | Project cards |
| `_styles/portrait.scss` | Team member photos |
| `_styles/feature.scss` | Homepage feature blocks |
| `_styles/post-excerpt.scss` | News/post cards |
| `_styles/header.scss` | Site header & nav |
| `_styles/section.scss` | Content sections |
