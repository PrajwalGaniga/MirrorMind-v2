# UI Reference

## 1. Purpose and Scope

This document describes the **visual design system** of the supplied
dashboard reference. Use it as a styling and layout guide when
implementing a different product.

**Reference only:** reproduce the visual language, layout principles,
spacing, proportions, component styling, and interaction states. Do
**not** copy the reference's brand name, wording, metrics, employee
details, labels, calendar entries, or other product-specific content.
Replace those with the actual content and information architecture of
the target product.

The screenshot is a desktop dashboard presented inside a large, softly
rounded application canvas. Its overall character is **premium, calm,
minimal, warm, and softly dimensional**.

## 2. Overall Visual Direction

-   **Aesthetic:** modern editorial dashboard; minimal, refined, and
    approachable.
-   **Composition:** dense enough to support many dashboard modules, but
    separated into clear, rounded panels.
-   **Contrast:** near-black elements anchor the interface; warm yellow
    provides emphasis; pale neutral surfaces keep the page light.
-   **Depth:** subtle shadows, tonal separation, and overlapping-looking
    panel edges rather than strong borders.
-   **Geometry:** large rounded outer shell, rounded cards, pill-shaped
    controls, circular icon buttons, and thin separators.
-   **Texture:** mostly flat surfaces, with a very restrained warm
    gradient and occasional fine-line or striped treatments.
-   **Typography:** clean sans-serif with large, light-weight headings
    and restrained small labels.

Avoid turning the design into a generic bright-white admin template. The
signature look comes from the combination of **warm ivory, pale grey,
charcoal, muted yellow, generous radii, and tightly aligned modules**.

## 3. Color System

The values below are **approximate starting tokens inferred visually
from the screenshot**, not sampled source values. Tune them against the
target implementation and display.

  -----------------------------------------------------------------------
  Token                   Approximate value       Intended use
  ----------------------- ----------------------- -----------------------
  `--page-backdrop`       `#AEB5C0`               Cool grey-blue area
                                                  outside the dashboard
                                                  shell

  `--shell-base`          `#F2F1E8`               Main dashboard canvas /
                                                  neutral base

  `--surface`             `#FAFAF7`               Main cards and raised
                                                  content panels

  `--surface-soft`        `#F0F0EC`               Secondary panels and
                                                  subtle neutral regions

  `--surface-muted`       `#E5E6E3`               Disabled areas, soft
                                                  tracks, low-emphasis
                                                  blocks

  `--text-primary`        `#171817`               Main headings and
                                                  important values

  `--text-secondary`      `#5F605C`               Supporting labels and
                                                  secondary copy

  `--text-muted`          `#898A84`               Tertiary information,
                                                  timestamps, inactive
                                                  labels

  `--accent`              `#F7D45B`               Primary highlight,
                                                  progress, active
                                                  status, selected
                                                  segments

  `--accent-soft`         `#FBE9A1`               Pale accent surfaces
                                                  and warm gradient tones

  `--charcoal`            `#292A29`               High-contrast buttons,
                                                  selected navigation,
                                                  dark panels

  `--border-subtle`       `#D8D9D3`               Hairline dividers and
                                                  restrained outlines

  `--white`               `#FFFFFF`               Small highlights and
                                                  icon contrast
  -----------------------------------------------------------------------

### Color application rules

1.  Keep the majority of the screen light and neutral.
2.  Use charcoal for a small number of high-contrast anchors, not for
    every card.
3.  Reserve yellow for meaningful emphasis: progress, selected states,
    status markers, or one important action.
4.  Use low-contrast borders. Avoid heavy outlines around every card.
5.  Secondary text should remain readable against ivory and white
    surfaces.
6.  Avoid adding unrelated saturated colors. Status colors should be
    muted and used sparingly.
7.  The outer page background should contrast with the application shell
    without competing with it.

## 4. Background and Application Shell

### Outer backdrop

-   Use a muted grey-blue background around the main application.
-   Keep the background visually quiet and mostly uniform.
-   Leave a visible inset around the dashboard so the application shell
    feels like a contained workspace.

### Main shell

-   Use a large, nearly full-width rounded rectangle.
-   At the screenshot's proportions, the shell has approximately
    **20--30 px of outer inset** on a 1100 px-wide canvas.
-   Use a very large corner radius, roughly **36--48 px** at desktop
    size.
-   The shell is warm off-white with a subtle horizontal or diagonal
    gradient: cooler, slightly grey ivory on the left, transitioning to
    pale buttery yellow on the right.
-   Keep the gradient soft; it should be noticed as atmosphere rather
    than as a graphic effect.
-   Do not use a strong drop shadow. A faint ambient shadow or tonal
    contrast against the outer backdrop is enough.

## 5. Layout and Alignment

### Main structure

The screen follows a compact dashboard composition:

1.  A top navigation row.
2.  A page introduction and summary area.
3.  A main workspace made of multiple cards in a grid.
4.  A visually prominent side module that extends down alongside the
    central content.

The reference uses a **multi-column desktop layout**, with modules
aligned to a consistent grid rather than positioned independently.

### Grid principles

-   Use a small, consistent gap between cards: approximately **4--8 px**
    in the dense dashboard area.
-   Keep card edges aligned horizontally and vertically wherever
    possible.
-   Use a larger gap between the application shell and its contents than
    between adjacent cards.
-   Let card widths reflect importance, but keep the overall grid
    balanced.
-   A right-side module can span multiple rows to create a strong
    vertical anchor.
-   Avoid excessive whitespace between modules; the design is compact
    but not cramped.
-   Align headings, numeric values, labels, and icons to predictable
    internal baselines.

### Responsive behavior

On narrower screens:

-   Collapse the multi-column grid into fewer columns.
-   Allow the long side module to move below the main content.
-   Preserve the same spacing rhythm, radii, typography hierarchy, and
    palette.
-   Keep primary controls usable and avoid shrinking labels to
    unreadable sizes.
-   Allow navigation to become a compact menu rather than forcing all
    items into one row.
-   Do not preserve the screenshot's exact desktop geometry at the cost
    of usability.

## 6. Spacing System

Use a consistent spacing scale rather than choosing arbitrary values per
component.

  Token          Value Typical use
  ------------ ------- -------------------------------------------
  `space-1`       4 px Icon-to-label gap, tiny internal spacing
  `space-2`       8 px Compact control spacing, card-to-card gap
  `space-3`      12 px Small card padding and grouped elements
  `space-4`      16 px Standard card padding
  `space-5`      20 px Larger internal sections
  `space-6`      24 px Shell inset and section separation
  `space-8`      32 px Major layout separation
  `space-10`     40 px Large heading or shell spacing

These values are a practical implementation scale, not exact
measurements from the image.

### Spacing rules

-   Prefer **16--24 px** padding inside normal cards.
-   Use less padding for compact utility panels.
-   Maintain even space between icon and label pairs.
-   Keep section headings closer to their content than to the next
    section.
-   Use whitespace to group related elements rather than adding more
    divider lines.

## 7. Corner Radii and Shapes

Rounded geometry is one of the strongest visual characteristics.

  Component                          Recommended radius
  -------------------------------- --------------------
  Outer application shell                     36--48 px
  Large feature cards                         24--32 px
  Standard dashboard cards                    20--28 px
  Compact inset panels                        14--20 px
  Buttons and segmented controls          999 px / pill
  Circular icon buttons                             50%
  Small status dots                                 50%

-   Use large radii consistently; do not mix sharp-cornered cards into
    the design without a functional reason.
-   Pills should be fully rounded, with enough horizontal padding to
    feel intentional.
-   Keep inner cards and controls rounded, but generally less rounded
    than the outer shell.
-   Circular icon controls should have consistent dimensions and
    centered icons.

## 8. Typography

### Typeface direction

Use a contemporary, neutral sans-serif. Good implementation choices
include **Inter**, **Manrope**, or **DM Sans**. Choose one family and
use it consistently; the reference's exact font cannot be established
from the screenshot alone.

### Type hierarchy

  -------------------------------------------------------------------------
  Role                  Suggested size               Weight Treatment
  --------------- -------------------- -------------------- ---------------
  Main page                  32--38 px             400--500 Large, calm,
  heading                                                   near-black

  Major KPI /                38--48 px             300--400 Large and
  metric                                                    light, with
                                                            minimal
                                                            decoration

  Card heading               17--21 px             500--600 Compact and
                                                            clear

  Body / primary             13--15 px             400--500 Comfortable and
  card text                                                 restrained

  Supporting                 11--13 px                  400 Muted secondary
  label                                                     color

  Tiny metadata              10--11 px                  400 Use sparingly;
                                                            maintain
                                                            legibility

  Button / nav               11--13 px             400--500 Short, clean
  label                                                     labels
  -------------------------------------------------------------------------

### Typography rules

-   Use regular or medium weights rather than bolding everything.
-   Use large type to create hierarchy, not decoration.
-   Keep headings short enough to breathe within cards.
-   Use tabular numerals for counters, timers, and metrics when
    available.
-   Keep line-height comfortable: around **1.2--1.35** for headings and
    **1.35--1.55** for supporting text.
-   Avoid overly tight letter spacing or all-caps labels as a default.
-   Ensure small labels remain readable at actual display size.

## 9. Navigation and Top Bar

The top bar is visually light and sits directly on the main shell.

-   Place the brand area at the far left and the navigation group across
    the upper-right portion.
-   Keep the navigation compact, with short labels and even spacing.
-   Show the active navigation item as a **charcoal pill with light
    text**.
-   Keep inactive items transparent or very lightly tinted, using dark
    grey text.
-   Place settings, notification, and account actions at the end of the
    row.
-   Use small, consistent line icons inside subtle circular or
    pill-shaped containers.
-   Keep the bar vertically centered and aligned to the shell's content
    margins.
-   Do not draw a heavy horizontal divider beneath the navigation.

### Navigation states

-   **Default:** transparent/light background, muted dark text.
-   **Hover:** slightly darker or brighter neutral surface; a short,
    smooth transition.
-   **Active:** charcoal pill, high-contrast text.
-   **Keyboard focus:** clearly visible outline or ring, not color
    change alone.
-   **Disabled:** reduced contrast, but still legible where appropriate.

## 10. Cards and Surface Treatments

### Standard cards

-   Use warm white or very pale grey surfaces.
-   Separate cards primarily through background contrast and spacing,
    not heavy borders.
-   Apply a large corner radius.
-   Use subtle shadows only where a card needs to feel elevated above
    its neighbors.
-   Keep internal content aligned to a common padding rhythm.

### Feature cards

-   A feature card may contain a chart, progress visualization, timer,
    or other distinct interactive element.
-   Give the feature a clear heading and one dominant visual.
-   Avoid crowding multiple equally prominent elements into one card.
-   Use the accent color for the key data point or active portion, with
    the rest in muted neutral tones.

### Dark inset panels

-   Use charcoal surfaces for a focused, high-priority panel or compact
    task area.
-   Use white or pale grey primary text and muted grey secondary text.
-   Use yellow for completed/selected indicators.
-   Use light circular icon backgrounds when an icon must stand out from
    the dark surface.
-   Maintain the same generous radius as the light cards.

### Borders and dividers

-   Prefer very subtle 1 px borders only when necessary to distinguish
    adjacent surfaces.
-   Use low-contrast dotted or dashed separators for secondary lists or
    metadata groups if needed.
-   Avoid strong gridlines and thick outlines.

## 11. Buttons, Pills, and Icon Controls

### Primary / high-emphasis button

-   Charcoal fill.
-   Light text or icon.
-   Pill-shaped silhouette.
-   Medium-weight label.
-   No heavy border.
-   Use for a small number of primary actions.

### Accent button or selected segment

-   Warm yellow fill.
-   Dark text.
-   Fully rounded shape.
-   Reserve for a meaningful selected state or important secondary
    action.

### Secondary button

-   Light surface or transparent background.
-   Dark text.
-   Optional subtle outline.
-   Use for lower-priority actions.

### Icon button

-   Circular or softly rounded shape.
-   Consistent size, usually **34--42 px** for compact dashboard
    controls.
-   Center a simple line icon.
-   Keep the icon stroke clean and visually light.
-   Give every icon-only button an accessible name and tooltip where
    useful.

### Interaction states

-   **Hover:** small tonal change and/or subtle lift; do not scale
    dramatically.
-   **Pressed:** slightly darker/lighter fill or a tiny reduction in
    elevation.
-   **Focus:** visible keyboard focus ring with adequate contrast.
-   **Disabled:** lower contrast and no hover lift.
-   **Loading:** preserve button dimensions and prevent repeated
    activation.

## 12. Shadows and Elevation

Depth should be restrained.

Suggested starting values:

``` css
--shadow-shell: 0 8px 28px rgba(30, 32, 35, 0.06);
--shadow-card: 0 3px 12px rgba(30, 32, 35, 0.035);
--shadow-hover: 0 7px 18px rgba(30, 32, 35, 0.075);
```

-   These are optional starting points, not exact screenshot values.
-   Use the shell shadow only if needed to separate it from the
    backdrop.
-   Most cards can rely on surface contrast and rounded edges alone.
-   Apply stronger hover elevation only to interactive cards.
-   Avoid dark, blurry, or oversized shadows that make the dashboard
    look heavy.

## 13. Charts, Progress, and Data Visualizations

The reference uses compact visualizations rather than large, full-width
charting surfaces.

### Progress indicators

-   Use yellow for the active or completed portion.
-   Use charcoal for a contrasting segment or selected state.
-   Use light grey for inactive tracks.
-   Prefer rounded ends on horizontal progress bars.
-   Keep labels and percentages close to the visual they describe.

### Circular progress / timer visuals

-   Use a thin circular track with a highlighted yellow arc.
-   Keep the central value prominent and the supporting label small.
-   Use tiny ticks or dots sparingly to provide detail without clutter.
-   Ensure the arc has sufficient contrast against the card surface.

### Small bar charts

-   Use thin vertical bars with rounded ends.
-   Use charcoal for most bars and yellow to highlight a current or
    selected value.
-   Keep axis labels small and muted.
-   Avoid unnecessary gridlines, legends, or chart borders.

### General data visualization rules

-   Color must have consistent meaning throughout the application.
-   Do not rely on color alone to convey completion or status; add
    labels, icons, or other cues.
-   Keep chart elements visually secondary to the primary value or
    insight.

## 14. Lists, Rows, and Compact Information Groups

-   Use consistent row heights and align icons, labels, and status
    indicators.
-   Use subtle separators between groups rather than between every item
    when the content is tightly related.
-   Align secondary metadata beneath or beside the primary label in a
    predictable pattern.
-   Use circular icon containers for compact list actions where
    appropriate.
-   For completion states, use a small, clear marker rather than a large
    colored badge.
-   Keep the content hierarchy obvious: primary label first, supporting
    information second.

## 15. Forms and Inputs

Even if the target product has different form content, preserve the same
visual language.

-   Use rounded inputs with light neutral surfaces.
-   Prefer subtle borders over dark outlines.
-   Use charcoal for entered text and muted grey for placeholders.
-   Use yellow sparingly for selected controls, toggles, or active
    progress.
-   Keep labels outside or clearly above inputs; do not rely on
    placeholders as the only label.
-   Make input focus obvious with a border or ring that meets contrast
    requirements.
-   Match input heights and corner radii across the application.
-   Use clear validation text and iconography; do not communicate errors
    through color alone.

## 16. Hover and Motion

Keep transitions subtle and fast. The interface should feel responsive,
not animated for its own sake.

Suggested timing:

-   Color / background transition: **140--200 ms**
-   Shadow / elevation transition: **160--220 ms**
-   Small position transition: **160--220 ms**
-   Use an ease-out or standard ease curve.

Suggested behavior:

-   Interactive cards may lift by **1--2 px** on hover.
-   Buttons can change surface tone slightly.
-   Navigation pills can transition smoothly between neutral and active
    styling.
-   Icons may shift tone or opacity; avoid unnecessary spinning or
    bouncing.
-   Non-interactive cards should not look clickable merely because they
    receive a hover effect.
-   Respect `prefers-reduced-motion` and provide an equivalent
    reduced-motion experience.

Example:

``` css
.interactive-surface {
  transition:
    background-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.interactive-surface:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-hover);
}

.interactive-surface:focus-visible {
  outline: 2px solid #292A29;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Use the lift only on genuinely interactive surfaces; do not apply it to
every panel by default.

## 17. Icons and Graphic Details

-   Prefer simple outline icons with consistent stroke weight.
-   Use a single icon family throughout the interface.
-   Icons should be supporting elements, not the dominant visual
    feature.
-   Keep icon sizes proportionate to nearby labels.
-   Place icons inside circular or softly rounded backgrounds only when
    that helps grouping or hit-area clarity.
-   Avoid mixing filled, outlined, and multicolored icon styles without
    a deliberate system.
-   Decorative stripes, tiny dots, and fine rules can add texture, but
    should remain rare and low contrast.

## 18. Accessibility and Usability

The reference is a visual target, not permission to compromise
usability.

-   Maintain readable contrast for text, icons, and controls.
-   Do not make tiny metadata essential to completing a task.
-   Provide visible keyboard focus.
-   Make interactive hit areas large enough for reliable use.
-   Give icon-only controls accessible labels.
-   Use semantic headings, buttons, navigation, and form labels.
-   Communicate statuses with text or symbols in addition to color.
-   Test the layout at zoomed and narrow viewport sizes.
-   Ensure hover is not the only way to discover an action.

## 19. Implementation Guidance

### Suggested CSS token foundation

``` css
:root {
  --page-backdrop: #AEB5C0;
  --shell-base: #F2F1E8;
  --surface: #FAFAF7;
  --surface-soft: #F0F0EC;
  --surface-muted: #E5E6E3;

  --text-primary: #171817;
  --text-secondary: #5F605C;
  --text-muted: #898A84;

  --accent: #F7D45B;
  --accent-soft: #FBE9A1;
  --charcoal: #292A29;
  --border-subtle: #D8D9D3;
  --white: #FFFFFF;

  --radius-shell: 42px;
  --radius-card: 26px;
  --radius-inner: 18px;
  --radius-pill: 999px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  --shadow-shell: 0 8px 28px rgba(30, 32, 35, 0.06);
  --shadow-card: 0 3px 12px rgba(30, 32, 35, 0.035);
  --shadow-hover: 0 7px 18px rgba(30, 32, 35, 0.075);
}
```

### Build order

1.  Establish the outer backdrop and rounded application shell.
2.  Define typography, color, spacing, radius, and shadow tokens.
3.  Build the top navigation and main grid.
4.  Implement reusable light cards, dark inset panels, pills, and icon
    buttons.
5.  Add chart/progress components using the same neutral-plus-yellow
    palette.
6.  Add hover, pressed, focus, disabled, and loading states.
7.  Test responsive layouts and accessibility before fine-tuning
    decoration.

Keep the design system reusable. Avoid hardcoding different radii,
padding, or colors for each individual card.

## 20. Design QA Checklist

-   [ ] The outer shell is warm, softly graded, and heavily rounded.
-   [ ] The outer backdrop is a muted grey-blue, not pure white.
-   [ ] The palette is mostly ivory, light grey, charcoal, and muted
    yellow.
-   [ ] The page has a clear heading / content / utility hierarchy.
-   [ ] Cards align to a consistent grid and share a spacing rhythm.
-   [ ] Most cards have rounded corners and very subtle surface
    separation.
-   [ ] Dark panels are used selectively as visual anchors.
-   [ ] Yellow is reserved for emphasis rather than used everywhere.
-   [ ] Typography uses a consistent sans-serif family and restrained
    weights.
-   [ ] Buttons and navigation use clean pill-shaped states.
-   [ ] Hover effects are subtle and limited to interactive elements.
-   [ ] Keyboard focus is visible.
-   [ ] Responsive layouts preserve the visual language without forcing
    desktop geometry.
-   [ ] All original screenshot content has been replaced with the
    target product's actual content.

## 21. Final Design Principle

**Recreate the design language, not the screenshot's content.** The key
elements are the muted grey-blue backdrop, warm ivory shell with a
gentle yellow tint, charcoal anchors, selective yellow accents, soft
rounded cards, compact grid alignment, light sans-serif typography, and
subtle interaction feedback. The target product's content and features
should be designed independently within this visual system.
