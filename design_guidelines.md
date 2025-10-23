# eCFR Data Analyzer - Design Guidelines

## Design Approach

**Selected Approach:** Design System - Material Design & Data Dashboard Patterns  
**Justification:** This is a utility-focused, data-intensive application requiring clarity, professionalism, and efficient information architecture. Inspired by analytics platforms like Linear, Notion dashboards, and government data portals.

**Core Principles:**
1. Data clarity over decoration
2. Professional, trustworthy aesthetic for government data
3. Efficient information density without overwhelming users
4. Clear visual hierarchy between data types (tables, charts, metrics)

---

## Color Palette

**Primary Colors (Dark Mode - Default):**
- Background Base: 222 15% 8%
- Surface/Cards: 222 15% 12%
- Borders: 222 10% 18%
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 70%

**Primary Colors (Light Mode):**
- Background Base: 0 0% 98%
- Surface/Cards: 0 0% 100%
- Borders: 220 13% 91%
- Text Primary: 222 15% 15%
- Text Secondary: 222 10% 45%

**Accent & Data Visualization:**
- Primary Accent (Actions): 217 91% 60% (blue - data analysis standard)
- Success/Positive: 142 76% 36% (for updated/active status)
- Warning/Attention: 38 92% 50% (for changes detected)
- Error: 0 84% 60%
- Chart Colors (multi-series): Use distinct hues - 217 91% 60%, 282 70% 65%, 162 73% 46%, 32 95% 55%, 340 82% 52%

---

## Typography

**Font Families:**
- Primary (UI): Inter (via Google Fonts) - clean, highly legible for data
- Monospace (Data/Metrics): JetBrains Mono - for numerical data, checksums, timestamps

**Type Scale:**
- Hero/Page Headers: 2.5rem (40px), weight 700
- Section Headers: 1.5rem (24px), weight 600
- Card Titles: 1.125rem (18px), weight 600
- Body Text: 1rem (16px), weight 400
- Small/Meta: 0.875rem (14px), weight 400
- Data Tables: 0.9375rem (15px), weight 400 (slightly larger for readability)
- Large Metrics: 3rem (48px), weight 700, monospace

---

## Layout System

**Spacing Primitives:** Use Tailwind units 2, 4, 6, 8, 12, 16, 20, 24 consistently
- Component padding: p-6 or p-8
- Section spacing: mb-12 or mb-16
- Card gaps: gap-6
- Dashboard grid gaps: gap-8

**Container Strategy:**
- Dashboard: Full-width with max-w-7xl centered, px-6
- Content sections: max-w-6xl
- Data tables: Full container width with horizontal scroll if needed

**Grid Layouts:**
- Metric cards: 3-column grid on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Chart sections: 2-column for comparison views (grid-cols-1 lg:grid-cols-2)
- Single column for data tables and detailed analysis

---

## Component Library

**Navigation:**
- Top app bar: Full-width, sticky, h-16, with app title, last update timestamp, and refresh action button
- Simple horizontal nav with clear active states (underline accent)

**Dashboard Cards:**
- White/dark elevated cards with subtle shadow
- Rounded corners (rounded-lg)
- Clear card headers with icon + title
- Consistent padding (p-6)
- Hover state: subtle elevation increase

**Data Visualization:**
- Chart containers: Card-based with title, legend, and toolbar
- Use Recharts library: Bar charts for comparisons, line charts for trends, pie/donut for distribution
- Tooltip: Dark background with white text, shows precise values
- Legend: Horizontal below chart, clickable to toggle series
- Axes: Clear labels, grid lines subtle (opacity 20%)

**Metric Display Cards:**
- Large number (3rem, monospace) centered
- Label below (text-sm, text-secondary)
- Optional trend indicator (arrow icon + percentage)
- Colored accent border-top for category

**Data Tables:**
- Zebra striping for rows (subtle alternating background)
- Sticky header row
- Sortable columns with arrow indicators
- Hover row highlight
- Monospace for numerical columns
- Actions column (right-aligned) for row-level operations
- Pagination at bottom with results count

**Buttons:**
- Primary: Solid accent background, white text, medium size (px-6 py-2.5)
- Secondary: Outline style with border
- Icon buttons: Square, subtle hover background
- Refresh/Action: Icon + text combination

**Forms & Inputs:**
- Dark mode compatible inputs with proper contrast
- Labels above inputs
- Helper text below in text-secondary
- Consistent height (h-10 for inputs)
- Focus ring in accent color

**Status Indicators:**
- Badges with colored backgrounds (success, warning, error)
- Pills for tags/categories
- Timestamp displays in monospace, text-sm

**Export Section:**
- Action buttons for CSV and JSON export
- File icon + format label
- Grouped together in card

---

## Page-Specific Layouts

**Dashboard (Main View):**
- Hero section: Full-width banner with app title, subtitle explaining purpose, last refresh timestamp, and primary "Refresh Data" button
- Metrics row: 4 key metrics in cards (Total Agencies, Total Word Count, Last Updated, Data Integrity Checksum)
- Charts grid: 2x2 layout - Word Count by Agency (bar), RCI Comparison (bar), Changes Over Time (line), Agency Distribution (pie)
- Quick actions panel: Export buttons, view raw data link

**Analysis Detail Page:**
- Page header with agency name/filter
- Tabs for different analysis types (Overview, Word Count, Complexity, Changes)
- Large chart area
- Supporting data table below
- Filter sidebar (left) for agency selection

**Review Results Page:**
- Data table as primary element
- Filters and search above table
- Export actions in top-right toolbar
- Expandable rows for detailed metrics

---

## Images

**Hero Section:** No large hero image needed - this is a data tool. Instead use a subtle gradient background (from background-base to slightly lighter) with overlay pattern (dot grid or subtle lines at 5% opacity) to add visual interest without distraction.

**Icons:** Use Heroicons (outline style) for all UI icons - consistent throughout application.

---

## Animations

**Minimal, Purposeful Only:**
- Chart data: 300ms ease transition on load
- Card hover: 200ms elevation change
- Button interactions: Native browser states
- Table row hover: Instant background change
- Loading states: Subtle spinner, no complex animations
- Page transitions: None - instant for data tool efficiency

---

## Key Differentiators

- Professional data aesthetic, not consumer-facing
- Clear information hierarchy for complex regulatory data
- Monospace fonts for numerical/technical data increases credibility
- Ample whitespace between dense data sections prevents overwhelm
- Color used sparingly and meaningfully (status, data categories)
- Tables and charts are first-class citizens, not afterthoughts