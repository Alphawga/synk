# Synk Design System Rules

All UI development for the Synk web app MUST follow these rules. Figma reference screens are in `/synk/stitch_synk_main_dashboard 2/`.

## 1. Theme

- **Dark mode is default and primary**. All components must be designed dark-first.
- The `<html>` element has `class="dark"`.
- Never use white/light backgrounds for any section. All backgrounds use the dark palette.

## 2. Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#101922` | Page background |
| `--bg-card` | `#1c2630` | Cards, sidebar, panels |
| `--bg-elevated` | `#151f29` | Elevated surfaces within cards |
| `--primary` | `#2b8cee` | Buttons, links, active indicators |
| `--primary-glow` | `#2b8cee40` | Shadows, scrollbar thumb |
| `--border` | `slate-800` or `slate-800/50` | Card borders, dividers |
| `--text-primary` | `slate-100` | Headings, primary text |
| `--text-secondary` | `slate-400` | Labels, descriptions |
| `--text-muted` | `slate-500` | Metadata, timestamps |
| `--success` | `emerald-500` | Connected status, check icons |
| `--warning` | `amber-500` | Warning badges |
| `--danger` | `red-500` | Delete actions, danger zone |

## 3. Typography

- **Font family**: Inter (from Google Fonts), weights 300–700.
- **Sizes**: `text-xs` (metadata), `text-sm` (body/labels), `text-base` (titles), `text-xl`/`text-3xl` (headings).
- **Always** use `antialiased` and `tracking-tight` on headings.

## 4. Spacing & Layout

- **Sidebar**: Fixed `w-64`, full height, left-aligned.
- **Main content**: `flex-1`, no max-width constraint unless for centered content.
- **Card padding**: `p-4` to `p-6` depending on card size.
- **Section spacing**: `space-y-6` between major sections.
- **Border radius**: `rounded-lg` for cards, `rounded-xl` for modals/panels, `rounded-full` for badges/avatars.

## 5. Component Patterns

### Cards
```
bg-[#1c2630] border border-slate-800 rounded-xl
hover:border-slate-700 transition-colors
```

### Buttons
- **Primary**: `bg-[#2b8cee] hover:bg-[#2b8cee]/90 text-white rounded-xl shadow-lg shadow-[#2b8cee]/25`
- **Ghost**: `bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white`
- **Danger**: `text-red-500 hover:bg-red-500/10`

### Badges
- **Source badges** (TAB, X POST): `px-2 py-0.5 rounded text-[10px] font-semibold uppercase`
  - TAB: `bg-slate-700 text-slate-300`
  - X POST: `bg-slate-700 text-blue-400`
  - X THREAD: `bg-purple-500/20 text-purple-400`
- **Category badges**: `bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full`
- **Status badges**: FREE TIER = `border-blue-500 text-blue-400`, Active = `bg-emerald-500/20 text-emerald-400`

### Search Input
```
bg-[#1c2630] border border-slate-700 rounded-xl text-slate-100
placeholder:text-slate-500 focus:border-[#2b8cee] focus:ring-1 focus:ring-[#2b8cee]/50
```

### Toggle Switch
- Use standard toggle pattern with `bg-[#2b8cee]` when active, `bg-slate-600` when inactive.

## 6. Sidebar Navigation

Structure (top to bottom):
1. **Logo**: Blue `S` icon + "Synk" text
2. **LIBRARY** group: All Saves, Tab Groups, X Library (or X Content)
3. **COLLECTIONS** group: User-created folders (dynamic, colored icons)
4. **SOURCES** group: Browser Tabs, X Bookmarks
5. **TOOLS** group: History, Cleanup Suggestions
6. **SYSTEM** group: Settings & Integrations, Archive, Trash, Extensions
7. **Bottom**: User avatar + name + plan badge, Settings gear

Active nav item uses: `bg-[#2b8cee]/20 text-[#2b8cee]` with left blue border indicator.

## 7. Icons

- Use **Material Icons** (Google) via `<link>` or icon package.
- Supplement with inline SVGs for custom icons (folder, X logo).
- Icon size: `w-4 h-4` for nav, `w-5 h-5` for buttons, `w-8 h-8` for feature icons.

## 8. Animations & Effects

- **Glassmorphism**: `backdrop-blur-md bg-background-dark/80` for sticky headers.
- **Background blobs**: Blurred gradient circles (`blur-[120px]`) for ambient lighting.
- **Hover effects**: `transition-colors duration-200` on all interactive elements.
- **Shimmer animation**: For loading states and connection lines.
- **Custom scrollbar**: Thin, themed thumb with `#2b8cee40` color.

## 9. Responsive Rules

- Sidebar collapses to icon-only on screens < 1024px.
- Cards stack vertically on mobile.
- Search bar always full-width at the top.
- Bulk actions bar is fixed to bottom, always visible when items selected.

## 10. File Organization

- **Shared UI**: `src/components/ui/` — all reusable atoms (Button, Badge, Card, etc.)
- **Page components**: `src/app/dashboard/_components/` — page-specific components
- **Icons**: Either Material Icons CDN or `lucide-react` for consistency
- **No inline styles** — all styling via Tailwind classes
- **Max file size**: 200–300 lines per component
