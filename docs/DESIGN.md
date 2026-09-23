# X-29 Advance — Visual Design System Specification (DESIGN.md)

> **CRITICAL DIRECTIVE**: This document defines the **EXISTING, PRODUCTION-PROVEN VISUAL DESIGN** of X-29 Advance.
> Do NOT create a new design system.
> The existing HTML/CSS/JS application is the immutable visual source of truth.
> Every modernized React component must replicate these exact tokens, styles, and behaviors.

---

## 1. Brand Identity & Visual Language

X-29 Advance uses a high-contrast, dark cyber-academic aesthetic designed for immersion, sustained focus, and minimal eye strain during long study sessions.

- **Theme**: Dark mode primary (`#0b0f19` deep space background, `#0f172a` slate-900 surface, `#1e293b` slate-800 borders).
- **Surface Elevation**: Glassmorphism with hardware-accelerated backdrop blur (`backdrop-filter: blur(20px)`), subtle translucent borders (`rgba(255, 255, 255, 0.08)`), and deep ambient drop shadows.
- **Accents**: Neon glow highlights, vibrant multi-track subject color codings, and dynamic status progress bars.

---

## 2. Color System & Palettes

### 2.1. Base Theme Colors
| Token / Name | Hex Code | Purpose / Application |
|---|---|---|
| **Deep Space Background** | `#0b0f19` | Global root page background |
| **Surface Dark (Slate 900)** | `#0f172a` | Card surfaces, container panels, dialog bases |
| **Surface Elevated (Slate 800)** | `#1e293b` | Interactive card headers, input backgrounds, active pills |
| **Border Subtle** | `rgba(255, 255, 255, 0.08)` | Glass card edges, divider lines |
| **Border Active** | `#334155` | Focused borders, active tabs, modal borders |
| **Text Primary** | `#f8fafc` | Main headings, critical metrics, high-emphasis text |
| **Text Secondary** | `#94a3b8` | Subtitles, labels, timestamps, metadata |
| **Text Muted** | `#64748b` | Disabled labels, placeholder text, secondary icons |

### 2.2. Canonical 14-Subject Identification Palette (`js/utils/colors.js`)
Deterministic color hashing (`hashStringToColor`) maps any subject or track name consistently to one of these 14 vibrant hues:
```javascript
const SUBJECT_PALETTE_COLORS = [
    '#ef4444', // Red 500
    '#f97316', // Orange 500
    '#eab308', // Yellow 500
    '#84cc16', // Lime 500
    '#22c55e', // Green 500
    '#14b8a6', // Teal 500
    '#06b6d4', // Cyan 500
    '#3b82f6', // Blue 500
    '#6366f1', // Indigo 500
    '#8b5cf6', // Violet 500
    '#a855f7', // Purple 500
    '#d946ef', // Fuchsia 500
    '#ec4899', // Pink 500
    '#f43f5e'  // Rose 500
];
```

### 2.3. Route Indicator & Brand Button Styles (`router/router.js`)
| Route ID | Active Navigation Button Style | Hover Style |
|---|---|---|
| `dashboard` | `bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600 shadow-lg` | `hover:border-blue-400` |
| `spectra-analytics` | `bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white border-transparent shadow-lg shadow-fuchsia-500/20` | `hover:border-fuchsia-400` |
| `daily-actions` | `bg-orange-500 text-white border-orange-500 shadow-lg` | `hover:border-orange-400` |
| `subjects` | `bg-violet-600 text-white border-violet-600 shadow-lg` | `hover:border-violet-400` |
| `paces-management` | `bg-red-600 text-white border-red-600 shadow-lg` | `hover:border-red-400` |
| `master-config` | `bg-indigo-600 text-white border-indigo-600 shadow-lg` | `hover:border-indigo-400` |
| `outcome` | `bg-yellow-500 text-white border-yellow-500 shadow-lg` | `hover:border-yellow-400` |
| `timer` / `focus` | `bg-emerald-600 text-white border-emerald-600 shadow-lg` | `hover:border-emerald-400` |
| `schedule` | `bg-cyan-600 text-white border-cyan-600 shadow-lg` | `hover:border-cyan-400` |
| `exam` | `bg-rose-600 text-white border-rose-600 shadow-lg` | `hover:border-rose-400` |

### 2.4. Core Tailwind Color Map (`js/state.js`)
Pre-configured color schemes for progress cards and badges:
- **Indigo**: Hex `#6366f1` | Text `text-indigo-400` | Badge `bg-indigo-500/10`
- **Violet**: Hex `#8b5cf6` | Text `text-violet-400` | Badge `bg-violet-500/10`
- **Orange**: Hex `#f97316` | Text `text-orange-400` | Badge `bg-orange-500/10`
- **Purple**: Hex `#a855f7` | Text `text-purple-400` | Badge `bg-purple-500/10`
- **Emerald**: Hex `#10b981` | Text `text-emerald-400` | Badge `bg-emerald-500/10`
- **Rose**: Hex `#f43f5e` | Text `text-rose-400` | Badge `bg-rose-500/10`
- **Cyan**: Hex `#06b6d4` | Text `text-cyan-400` | Badge `bg-cyan-500/10`
- **Amber**: Hex `#f59e0b` | Text `text-amber-400` | Badge `bg-amber-500/10`

---

## 3. Typography Hierarchy

### 3.1. Font Families
- **Primary Body Font**: `'Inter', system-ui, -apple-system, sans-serif`
  - High legibility at 12px - 14px sizes, dense UI readability.
- **Headings & Display Font**: `'Outfit', 'Plus Jakarta Sans', sans-serif`
  - Geometric, clean modern curves used for page titles, modal headings, and hero cards.
- **Technical / Code Font**: `'JetBrains Mono', monospace`
  - Used for code blocks, JSON exports, schema definitions, and timestamps.
- **Timer & Countdown Font**: `'Outfit', 'Rajdhani', 'Chakra Petch', monospace`
  - Always rendered with `tabular-nums` (`font-feature-settings: "tnum" 1, "zero" 1"`) to prevent jittering when digits flip.

### 3.2. Type Scale & Styling
| Element | Class / Specifications | Weight | Typical Application |
|---|---|---|---|
| **Page Title (H1)** | `text-2xl md:text-3xl font-black tracking-tight` | 900 | Dashboard title, Section main header |
| **Section Header (H2)** | `text-lg md:text-xl font-bold tracking-tight` | 700 / 800 | Card group headers, Feature titles |
| **Card Title (H3)** | `text-sm md:text-base font-semibold text-slate-100` | 600 | KPI Card title, Widget name |
| **Eyebrow / Overline** | `text-[10px] md:text-[11px] font-black uppercase tracking-widest` | 900 | Category pills, System tags, Section labels |
| **Body Regular** | `text-xs md:text-sm text-slate-300` | 400 / 500 | Task descriptions, explanatory notes |
| **KPI Big Number** | `text-3xl md:text-4xl font-black font-countdown` | 900 | Total hours, global %, countdown days |
| **Small Metadata** | `text-[10px] md:text-[11px] text-slate-400 font-medium` | 500 | Timestamps, chapter counts, fraction badges |

---

## 4. Surfaces, Radii & Elevations

### 4.1. The Glassmorphism Architecture
```css
/* Glass Card Specification */
.glass-card {
    background: rgba(30, 41, 59, 0.45);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* Glowing Input Focus */
.glowing-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.25);
}
```

### 4.2. Border Radii
- **Badges & Pills**: `rounded-full` or `rounded-lg` (8px).
- **Inputs & Standard Buttons**: `rounded-xl` (12px).
- **Standard Cards & Modals**: `rounded-2xl` (16px) or `rounded-[1.5rem]` (24px).
- **Hero Containers & Dialog Overlays**: `rounded-[2rem]` (32px).

---

## 5. Layout Architecture & Responsive Breakpoints

### 5.1. Desktop Layout (> 1024px)
- **Persistent Header (64px)**: Logo sticker, system badge, live exam countdown with tabular digits, cloud sync status indicator, user avatar/logout button.
- **Sidebar (64px collapsed, 240px expanded)**: Vertical icon bar with route indicators and tooltips.
- **Main Viewport**: Multi-column responsive grid (3 to 4 columns for KPI cards, 2 columns for major study features, full width for timeline and analytics).
- **Scroll Containment**: Main viewport scrolls smoothly with custom sleek scrollbar (`width: 4px; background: #334155; border-radius: 10px`).

### 5.2. Tablet Layout (768px - 1024px)
- 2-column card layout.
- Compact sidebar or top navigation bar.
- Flexible card heights preventing clipping.

### 5.3. Mobile Layout (< 768px down to 360px)
- **Header**: Compact header with minimal brand logo and inline countdown badge.
- **Navigation**: Bottom navigation tab bar or slide-out drawer menu.
- **Card Grids**: Single-column vertical stack (100% width) with `px-3` or `px-4` side padding.
- **Touch Ergonomics**: All interactive buttons, checkboxes, and tabs have minimum touch targets of 44x44px.
- **No iOS Input Zoom**: All inputs, selects, and textareas set to `font-size: 16px` on screens `< 640px`.
- **Zero Horizontal Overflow**: `overflow-x: hidden` strictly enforced on root containers.

---

## 6. Components Catalog

### 6.1. Buttons
- **Primary Gradient Button**: `bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl shadow-lg active:scale-[0.98] transition-all`
- **Ghost Action Button**: `bg-slate-800/60 hover:bg-slate-700/60 border border-white/5 text-slate-300 hover:text-white rounded-xl py-2 px-4 transition-all text-xs font-bold`
- **Pill Filter Button**: `px-3 py-1.5 rounded-full text-xs font-bold border transition-all` (Active: colored background; Inactive: `border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700`)

### 6.2. Task Execution Checkbox
- Custom checkbox with smooth strike-through and opacity fade when toggled.
- Accent color left-border matching the subject's deterministic color.
- Instant optimistic state transition.

### 6.3. Chronograph Dial Component
- SVG circular gauge with rotating hands (seconds and minutes).
- Tick marks along the dial rim that light up when elapsed time passes them.
- Central digital readout with large tabular font (`00:00:00`).
- Start / Pause / Reset buttons in high-contrast emerald and slate.

---

## 7. Motion & Animation Standards

```css
/* Page Enter Animation */
@keyframes pageEnter {
    from {
        opacity: 0;
        transform: translateY(12px) scale(0.99);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
.animate-page-enter {
    animation: pageEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Ambient Radial Aura Pulse */
@keyframes auraPulse {
    0%, 100% { opacity: 0.65; transform: scale(1); }
    50% { opacity: 0.95; transform: scale(1.04); }
}
.animate-aura {
    animation: auraPulse 4s ease-in-out infinite;
}

/* Shimmer Progress Flow */
@keyframes shimmer-flow {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}
.shimmer-progress {
    background: linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #a855f7 100%);
    background-size: 200% 100%;
    animation: shimmer-flow 1.5s infinite linear;
}
```

---

## 8. DESIGN PRESERVATION DIRECTIVE

> **THE CURRENT X-29 INTERFACE IS THE IMMUTABLE VISUAL SOURCE OF TRUTH.**  
> Technical modernization must preserve the existing visual language unless the user explicitly requests a design change.
> When implementing React/Next.js components, reproduce the documented existing design down to the pixel rather than inventing a new one.
