# MirrorMind v2 --- UI Upgrade Prompt

## Objective

Act as a senior UI/UX designer and frontend engineer. Carefully inspect
the **entire existing MirrorMind v2 frontend** and upgrade its visual
quality, layout, alignment, responsiveness, readability, and information
hierarchy.

The goal is to make the existing application feel polished, consistent,
and production-ready **without changing its established visual theme,
identity, product content, or core functionality**.

Treat the existing application and supplied screenshots as the source of
truth. Improve what is already there; do not redesign it into a
different product.

------------------------------------------------------------------------

## 1. Non-negotiable requirement: preserve the existing theme

The current MirrorMind interface has a distinctive warm, editorial
dashboard aesthetic. Preserve this visual language throughout every page
and component.

### Core palette

Use these existing theme colors as the foundation:

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

These values are the baseline. Reuse the existing project tokens if
equivalent tokens already exist rather than duplicating them.

### Visual rules

-   Keep the main application canvas warm ivory with a very subtle
    warm/neutral gradient.
-   Preserve the muted grey-blue outer backdrop and the softly rounded
    application shell.
-   Use warm white and pale grey for most content cards.
-   Use charcoal for the header or selected navigation treatments only
    where consistent with the current interface, primary actions, and a
    small number of strong visual anchors.
-   Use muted yellow selectively for important actions, selected tabs,
    progress indicators, key metrics, and emphasis.
-   Preserve subtle shadows, delicate borders, generous rounded corners,
    and pill-shaped controls.
-   Keep the interface calm, refined, warm, and softly dimensional.
-   Use the existing restrained visual effects. Do not introduce
    unrelated saturated colors or a completely new visual system.
-   Status colors may be used sparingly where functionally necessary,
    but must remain readable and consistent.

### Do not do any of the following

-   Do not convert the interface into a dark navy, neon blue, cyberpunk,
    or glowing futuristic dashboard.
-   Do not replace the warm ivory, charcoal, grey-blue, and muted yellow
    palette with a different palette.
-   Do not apply gradients, glassmorphism, glow effects, or heavy
    shadows everywhere.
-   Do not make every card charcoal or fill the page with dark
    backgrounds.
-   Do not change the brand identity, product name, existing
    terminology, or content just to match a generic template.
-   Do not replace the current design with a generic bright-white admin
    dashboard.
-   Do not remove existing features or simplify away important
    functionality.

**The design must look like a better-organized, more polished version of
the current MirrorMind UI---not a different application.**

------------------------------------------------------------------------

## 2. First inspect the entire project before editing

Before writing code:

1.  Inspect the complete frontend folder and identify all routes/pages,
    shared layouts, reusable components, stylesheets, assets, and
    responsive breakpoints.
2.  Identify the framework, routing approach, styling method, icon
    library, charting library, and existing component conventions.
    Continue using the project's existing stack.
3.  Inspect every page, not only the dashboard or login screen.
4.  Identify the root causes of the current layout problems:
    inconsistent container widths, arbitrary margins, misaligned
    headers, conflicting CSS, fixed widths, overflow, broken images,
    low-contrast text, inconsistent card sizes, and poor responsive
    behavior.
5.  Trace shared components before changing them so that a fix does not
    unintentionally break other pages.
6.  Preserve working business logic, API calls, authentication, database
    integration, voice functionality, charts, model inference, uploads,
    and navigation.
7.  Build a concise page/component inventory and a prioritized repair
    plan, then implement the fixes rather than stopping at analysis.

Do not rewrite the application from scratch when targeted improvements
to the existing code are appropriate. Avoid unnecessary dependencies and
duplicate CSS systems.

------------------------------------------------------------------------

## 3. Establish a consistent application frame

### Outer background and shell

-   Use the muted grey-blue page backdrop around a large warm-ivory
    application shell.
-   Keep a consistent inset around the shell on larger screens.
-   Use large, soft shell corner radii, approximately 36--48 px on
    desktop.
-   Keep the shell shadow subtle; rely mainly on tonal separation.
-   Prevent horizontal overflow and accidental page-level scrolling in
    the wrong direction.
-   Make the shell fluid at smaller widths so it does not retain
    oversized desktop margins.

### Content container

-   Establish a consistent maximum content width and shared horizontal
    alignment for all pages.
-   Align page titles, descriptions, cards, tabs, charts, and actions to
    the same content grid.
-   Use consistent page padding and section spacing.
-   Avoid independent, arbitrary margins that cause sections to drift
    out of alignment.
-   Keep content compact enough to scan, but not cramped.

------------------------------------------------------------------------

## 4. Rebuild the header and navigation alignment

The header should be clean, balanced, and consistently aligned on every
page.

### Desktop header

Organize the header into a predictable horizontal structure:

-   **Left:** MirrorMind brand mark, product name, and a short existing
    product descriptor if present.
-   **Center/right:** Main navigation with clear labels and consistent
    icon alignment.
-   **Far right:** Existing theme toggle, notifications, account/avatar
    menu, or other current account controls where available.

Use the actual navigation items already present in the application, such
as Dashboard, Career Dossier/Profile, Projects & Internships, ML
Visualizer, Public Portfolio, and Voice Studio. Do not invent routes
that do not exist.

### Header requirements

-   Vertically center all elements.
-   Keep the logo, navigation, and account actions on a common alignment
    line.
-   Give navigation items consistent height, horizontal padding, icon
    size, and spacing.
-   Use a charcoal pill with high-contrast text for the active
    navigation item, consistent with the current theme.
-   Keep inactive items restrained, using dark secondary text on a light
    or transparent surface.
-   Avoid wrapping desktop navigation awkwardly or squeezing labels into
    unreadable sizes.
-   Use subtle hover and focus states.
-   Do not add a heavy divider under the header unless the existing
    layout requires it.
-   Ensure dropdowns, menus, and popovers remain within the viewport and
    work with keyboard navigation.

### Responsive navigation

-   At tablet/mobile widths, replace the crowded full navigation row
    with a compact menu or appropriate existing mobile navigation
    pattern.
-   Keep the logo and the most important account/action control
    accessible.
-   Do not solve narrow-screen layout by shrinking every label or
    allowing horizontal scrolling across the entire page.

------------------------------------------------------------------------

## 5. Dashboard hierarchy: make the AI Voice Co-Pilot the hero

The current dashboard feels unbalanced because the content is compressed
into one side while the voice assistant occupies a separate narrow
column. Correct this hierarchy.

### New dashboard order

1.  Consistent global header.
2.  Full-width AI Voice Co-Pilot hero section.
3.  Compact academic/profile summary metrics.
4.  Organized dashboard content grid with clearly separated sections.
5.  Additional details and secondary insights.

### AI Voice Co-Pilot hero

Create a prominent, full-width feature card immediately below the
header. Keep its styling consistent with the warm, light, rounded
MirrorMind theme.

The hero should include, where supported by existing functionality:

-   A short greeting and a clear heading identifying the AI Voice
    Co-Pilot.
-   One brief supporting sentence describing what the assistant can help
    with.
-   A clear primary **Start Voice** action.
-   A visible voice activity/listening state.
-   The existing audio waveform, voice orb, microphone control, or
    equivalent visual feedback.
-   Existing audio/mute controls and studio shortcut where available.
-   A compact conversation transcript or assistant greeting, if
    supported.
-   Clear states for idle, connecting, listening, processing, speaking,
    muted, and error.
-   A visible indication when microphone permission is required or
    denied.
-   An accessible keyboard-operable way to start, stop, mute, or resume
    the voice interaction.

Use restrained soft gradients, subtle tonal highlights, and a gentle
accent treatment only where they fit the current theme. Do not turn the
hero into a neon/glowing dark panel.

The voice orb/waveform must reflect real application state if that state
is available. Do not create misleading animations that imply the
microphone or AI is active when it is not.

On mobile, stack the heading, voice visual, transcript, and controls
naturally. Keep the main action easy to reach without letting the hero
consume the entire screen.

------------------------------------------------------------------------

## 6. Use the full available width for dashboard content

Below the voice hero, replace the unbalanced left-column/right-column
composition with a coherent grid.

### Suggested desktop grid

Use a responsive 12-column grid or an equivalent layout system. Let
section widths reflect their importance and content density.

Possible arrangement:

-   **Profile/Academic Overview:** a medium-width card with the
    student's name, course, institution, CGPA, semester, and other
    existing profile facts.
-   **Quick Access:** a compact card for existing shortcuts such as
    resume, career dossier, portfolio, and voice studio.
-   **Recent Activity:** a clear, compact list of existing activity or
    progress entries.
-   **Projects & Internships:** a substantial section with a dedicated
    grid of project and experience cards.
-   **ML/DL & Career Insights:** a separate area for career prediction,
    skill distribution, model results, or relevant AI modules.
-   **Skills:** a dedicated area for technical skills, grouped and easy
    to scan.
-   **Academic/Experience details:** separate sections when their
    content is too dense to combine without hurting readability.

This is a layout recommendation, not a requirement to invent data or
features. Use the modules and data that actually exist in the codebase.

### Grid behavior

-   Align card edges and headings to a shared grid.
-   Use consistent gaps, generally around 12--20 px for standard
    dashboard cards; use tighter gaps only for compact related elements.
-   Avoid excessive blank space between modules.
-   Avoid making one column extremely narrow while another has a large
    amount of unused space.
-   Do not force every card to have the same height if that creates
    unnecessary whitespace.
-   Use consistent card padding and a clear relationship between each
    section heading and its content.
-   Use CSS Grid/Flexbox or the project's existing layout conventions
    rather than fragile absolute positioning.

------------------------------------------------------------------------

## 7. Make Projects and Internships unmistakably distinct

The current project and internship content is difficult to understand
because the cards and descriptions do not establish a strong enough
hierarchy.

Create a clearly labeled **Projects & Internships** section. Projects
and internships must be visually distinguishable, not blended into a
long block of text.

### Project cards

Each project card should display the data available in the application:

-   Project title.
-   Project category or technology/domain tag.
-   A concise, readable description.
-   Existing status or project type, if present.
-   Relevant technologies as compact tags, without allowing tags to
    overwhelm the card.
-   Existing links or actions such as View Details, GitHub, Demo, or
    Open Project when those actions are genuinely supported.

Use examples already present in the user's data, such as MediBridge,
Smart Classroom, FocusLy, Immenza True Care, or other actual stored
projects. Do not fabricate descriptions, status labels, dates, or links.

### Internship and experience cards

Give internships, training, hackathons, and achievements their own clear
visual grouping or category filters.

Where available, show:

-   Organization/event name.
-   Role or program.
-   Duration/date.
-   One concise summary of the work or outcome.
-   Existing skills, technologies, or achievement metadata.
-   An appropriate detail action if supported.

### Card visual hierarchy

-   Use a clear title at the top.
-   Put category and status metadata in restrained pills.
-   Keep descriptions readable with comfortable line height.
-   Align action controls consistently near the bottom where card
    layouts allow.
-   Avoid excessive text truncation; provide a detail view or expansion
    where appropriate.
-   Use subtle borders, pale surfaces, and selective yellow emphasis.
-   Make the difference between project cards and internship cards
    apparent through headings and labels, not through unrelated colors
    or decorative effects.

On tablet, reduce the number of columns. On mobile, use a single-column
layout or a carefully tested compact arrangement with no clipped text.

------------------------------------------------------------------------

## 8. Improve profile and Career Dossier pages

Preserve all existing profile fields and functions, but improve the
layout and form usability.

-   Create a clear page title and concise introduction.
-   Group related fields into logical sections such as Identity & Online
    Presence, Education, Skills, Projects, Internships, Achievements,
    and Resume, according to the actual existing data model.
-   Use a consistent field grid with aligned labels and controls.
-   Keep labels above inputs and maintain consistent input heights,
    radii, and spacing.
-   Use warm light input surfaces with readable dark text.
-   Make disabled or read-only fields visibly distinct while keeping
    their content legible.
-   Ensure focus, validation, error, success, and upload states have
    adequate contrast and clear text labels.
-   Keep resume upload and parsing feedback in a clear status panel.
-   Ensure avatar upload, preview, and fallback states work correctly;
    broken image placeholders must not remain visible.
-   Preserve existing validation, saved data, upload behavior, and
    profile actions.
-   At narrow widths, collapse multi-column forms into one column
    without clipping labels or buttons.

------------------------------------------------------------------------

## 9. Improve Career Recommendations and Skills

### Career recommendation matrix

-   Give the recommendation section a clear heading and a short
    explanation of what the result represents.
-   Make the strongest predicted role visually prominent without
    overwhelming the rest of the page.
-   Display the role name, score/confidence value, and progress bar
    together.
-   Use charcoal for the track or contrast and muted yellow for the key
    progress portion.
-   List other ranked roles as clean, consistently aligned rows.
-   Keep role names, percentages, and progress bars aligned.
-   Preserve the model's actual output and existing inference logic. Do
    not change scores or imply that a prediction is a guaranteed
    outcome.

### Skills and proficiency

-   Group skills logically where the existing data supports it, such as
    programming languages, ML/DL, web development, databases, and tools.
-   Keep skill chips consistent in size, spacing, and shape.
-   If proficiency data exists, show it with readable labels and compact
    bars or charts.
-   If proficiency data does not exist, do not invent percentages or
    proficiency levels.
-   Ensure long skill names wrap gracefully and do not push the page
    wider than the viewport.

### Academic metrics

-   Present metrics such as CGPA, semester, projects, internships, and
    class rank as compact, easy-to-scan values with labels.
-   Keep metric cards aligned and avoid oversized decorative number
    blocks.
-   Use tabular numerals where appropriate.

------------------------------------------------------------------------

## 10. Improve the ML Visualizer page

The ML Visualizer must remain technically informative, but its layout
should be easier to scan and understand.

### Page structure

-   A clear title and short explanation.
-   A visible primary action for re-running inference, if supported.
-   A concise top prediction/result summary.
-   A consistently aligned step/stage navigation row.
-   A main content panel for the selected pipeline stage.
-   Supporting metrics, charts, input features, and explanatory content
    grouped logically.

### Pipeline stages

Preserve the existing stages and their real functionality. If the
current pipeline includes text serialization, embedding space, PyTorch
forward pass, top-5 roles, skill proficiency, or strategic insight,
present them as clearly numbered or labeled stages.

-   Make the active stage obvious using the established charcoal/yellow
    treatment.
-   Keep inactive stages readable.
-   Prevent stage labels from overflowing or becoming unreadable at
    smaller widths.
-   Allow stage navigation to wrap or scroll within its own controlled
    container if necessary; never create accidental page-wide horizontal
    overflow.
-   Ensure the content shown corresponds to the selected stage.

### Charts and metrics

-   Give every chart a descriptive title and readable axis/legend labels
    where applicable.
-   Use charcoal and muted yellow as the primary chart colors, with
    neutral tones for secondary data.
-   Use subtle gridlines and avoid unnecessary chart decoration.
-   Ensure labels and values contrast with the card background.
-   Keep charts responsive and legible at smaller widths.
-   Include text labels or values so color is not the only way to
    interpret data.
-   Preserve actual model output and inference behavior.
-   Use an appropriate loading, empty, success, and error state.
-   Do not fabricate model metrics, pipeline results, or data.

### Text contrast

Remove the current issue where grey text appears on a similarly dark
grey panel. Use dark primary text on light panels, or pale primary text
only when a genuinely dark inset panel is intentionally used. Do not
place low-contrast text on disabled-looking surfaces.

------------------------------------------------------------------------

## 11. Color contrast and readability audit

Perform a dedicated contrast audit across all pages and components.

The current interface contains text that becomes difficult to read
against some filled backgrounds. Correct this systematically.

-   Primary text should use `--text-primary` on light surfaces.
-   Secondary copy should use `--text-secondary`.
-   Muted text should use `--text-muted` only for genuinely secondary
    information, and must still be legible.
-   On intentional charcoal panels, use white or pale neutral primary
    text and a suitable lighter secondary color.
-   Do not use charcoal text on charcoal backgrounds.
-   Do not use pale grey text on pale grey backgrounds.
-   Do not make disabled fields so faint that their values cannot be
    read.
-   Do not use yellow as the color for long paragraphs or small body
    text.
-   Make links recognizable and provide a clear hover/focus state.
-   Check buttons, badges, pills, chart labels, placeholders, helper
    text, tooltips, and status messages.
-   Aim for WCAG AA contrast for normal text wherever feasible.
-   Use iconography and labels together for status and validation rather
    than relying on color alone.

Create or reuse semantic color tokens so that fixes are consistent
instead of being applied as isolated overrides.

------------------------------------------------------------------------

## 12. Reusable components and design consistency

Audit and standardize shared components, including:

-   Application shell and page container.
-   Header and navigation.
-   Page headings and section headings.
-   Cards and nested panels.
-   Buttons and icon buttons.
-   Pills, tags, and status indicators.
-   Form fields and validation messages.
-   Profile/avatar display.
-   Progress bars and metric tiles.
-   Project and internship cards.
-   Charts and chart containers.
-   Tabs, step navigation, dropdowns, and modals.
-   Loading, empty, success, and error states.

Use a consistent set of design tokens for color, spacing, radii,
typography, and shadows. Avoid duplicated styles and page-specific
exceptions unless a real functional difference requires them.

Keep the current icon library if one already exists. Use a consistent
icon family, size, stroke weight, and alignment. Avoid mixing unrelated
emoji, filled icons, and outline icon styles without a clear reason.

------------------------------------------------------------------------

## 13. Responsive behavior

The application must work at desktop, tablet, and mobile sizes while
retaining the same visual theme.

### Desktop

-   Use the full content width effectively.
-   Keep the hero prominent and the dashboard grid balanced.
-   Align headings, cards, and content edges consistently.
-   Avoid excessive outer margins and avoid cards that stretch too far
    to remain readable.

### Tablet

-   Reduce the number of grid columns gracefully.
-   Allow the header to collapse when needed.
-   Stack secondary panels below primary content.
-   Keep charts and forms within their containers.
-   Preserve comfortable touch targets.

### Mobile

-   Use a compact navigation pattern.
-   Stack the hero content and its controls logically.
-   Use a single-column card layout where needed.
-   Keep buttons comfortably tappable.
-   Prevent horizontal page overflow, clipped text, overlapping
    controls, and tiny unreadable labels.
-   Let long titles, URLs, tags, and descriptions wrap safely.
-   Ensure modal dialogs and dropdowns fit the viewport.
-   Preserve adequate side padding without wasting screen width.

Test at widths around 320 px, 375 px, 430 px, 768 px, 1024 px, 1280 px,
and 1440 px, plus any important sizes already supported by the project.
Do not rely only on one desktop screenshot.

------------------------------------------------------------------------

## 14. Interaction states, motion, and accessibility

-   Use subtle transitions, typically around 140--220 ms, for color,
    shadow, and small position changes.
-   Restrict hover elevation to genuinely interactive surfaces.
-   Avoid dramatic scaling, unnecessary bouncing, spinning, or constant
    decorative animation.
-   Respect `prefers-reduced-motion`.
-   Provide visible keyboard focus indicators.
-   Use semantic headings, navigation, buttons, form labels, and status
    regions.
-   Ensure every icon-only control has an accessible name.
-   Ensure actions are keyboard accessible.
-   Do not rely on hover alone to reveal essential information.
-   Maintain appropriate focus handling for menus, dialogs, and voice
    controls.
-   Make loading, disabled, error, success, and empty states clear and
    readable.

------------------------------------------------------------------------

## 15. Technical safety and preservation of functionality

This is a UI upgrade, not permission to break the application.

-   Preserve existing routes, page behavior, API contracts,
    authentication, database operations, and stored data.
-   Preserve the real AI voice integration, microphone permissions,
    audio handling, WebSocket behavior, transcript flow, and start/stop
    behavior.
-   Preserve resume upload and parsing, avatar uploads, profile updates,
    and project actions.
-   Preserve ML inference, chart data, model output, and pipeline
    navigation.
-   Do not replace functional features with static mockups.
-   Do not hardcode dynamic user data that should come from the backend.
-   Do not add fake buttons or controls that look functional but do
    nothing.
-   Do not remove error handling or loading states.
-   Avoid adding dependencies unless necessary and compatible with the
    existing stack.
-   Do not introduce a new styling framework or replace the current
    component architecture without a strong technical reason.
-   Avoid broad CSS selectors that unexpectedly change unrelated
    components.
-   Remove obsolete conflicting styles when safe, instead of stacking
    more overrides on top of them.
-   Keep code maintainable and reuse the project's existing conventions.

------------------------------------------------------------------------

## 16. Implementation workflow

Follow this sequence.

### Phase 1 --- Audit

-   Map the frontend pages, shared components, and styles.
-   Identify layout, spacing, typography, contrast, responsiveness, and
    interaction issues.
-   Check for broken assets, console errors, CSS conflicts, and
    overflow.
-   Identify the components that should be fixed once and reused
    everywhere.

### Phase 2 --- Design foundation

-   Define or consolidate the existing theme tokens.
-   Standardize the shell, page width, spacing scale, typography, card
    surfaces, radii, shadows, and button styles.
-   Do not change the existing palette or visual identity.

### Phase 3 --- Shared layout

-   Fix the application shell and global header.
-   Standardize navigation states and responsive behavior.
-   Create consistent page containers and section-heading patterns.

### Phase 4 --- Dashboard

-   Move the AI Voice Co-Pilot into the prominent full-width hero
    position.
-   Reorganize the content below it into a balanced, responsive grid.
-   Improve profile metrics, quick access, recent activity, career
    recommendations, projects, internships, and skills.

### Phase 5 --- Remaining pages

-   Apply the same design system to Profile/Career Dossier, Projects &
    Internships, ML Visualizer, Public Portfolio, Voice Studio, and all
    other routes found during the audit.
-   Fix each page's unique layout and contrast issues without changing
    its functionality.

### Phase 6 --- Responsive and accessibility QA

-   Test the specified viewport sizes.
-   Check keyboard navigation, focus states, readable contrast, form
    usability, and voice interaction states.
-   Verify that no page has horizontal overflow or overlapping elements.

### Phase 7 --- Regression testing

-   Run the project's existing lint, type-check, build, and test
    commands where available.
-   Check browser console errors.
-   Verify navigation, authentication, uploads, API interactions, voice
    functions, and ML visualizations.
-   Confirm that the final UI uses the existing warm
    ivory/grey-blue/charcoal/yellow theme consistently.

------------------------------------------------------------------------

## 17. Definition of done

The work is complete only when all of the following are true:

-   [ ] The original MirrorMind theme is preserved.
-   [ ] The application shell and page margins are consistent.
-   [ ] The header and navigation are aligned and responsive.
-   [ ] The AI Voice Co-Pilot is a prominent full-width dashboard hero.
-   [ ] Dashboard content uses the available width in a balanced grid.
-   [ ] Projects and internships are clearly separated and easy to
    understand.
-   [ ] Career recommendations, skills, academic information, and ML
    content have clear hierarchy.
-   [ ] Text is readable against every background.
-   [ ] Cards, buttons, tags, inputs, and headings share consistent
    styling.
-   [ ] All existing pages have been inspected and improved where
    needed.
-   [ ] Desktop, tablet, and mobile layouts work without overflow or
    clipping.
-   [ ] Interactive states and keyboard accessibility are addressed.
-   [ ] Existing backend connections and application functionality still
    work.
-   [ ] No fake data, fake controls, or invented functionality has been
    introduced.
-   [ ] Build/lint/tests pass where configured, or any pre-existing
    failures are clearly documented.

------------------------------------------------------------------------

## 18. Final instruction

Work like a careful senior frontend engineer who respects an established
product design system.

**First understand the existing code and visual identity. Then fix the
underlying layout and styling issues systematically. Preserve the warm
ivory canvas, muted grey-blue outer backdrop, charcoal anchors, muted
yellow accents, rounded cards, subtle shadows, and refined typography.
Make the AI Voice Co-Pilot the full-width hero, organize all other
dashboard information into a clear grid, make projects and internships
understandable, fix contrast problems, and make every page responsive.**

Do not stop after producing recommendations or a mockup. Implement the
changes in the actual existing frontend, verify the result, and
summarize the files changed, the improvements made, the checks
performed, and any issues that remain.
