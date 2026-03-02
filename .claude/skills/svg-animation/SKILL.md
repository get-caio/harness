# SVG Animation Reference

All animations use SMIL (Synchronized Multimedia Integration Language) — no JS animation libraries. Every animation is concept-driven: it must visually communicate the slide's idea.

---

## The Golden Rule

**If you removed the text from the slide, would the animation still communicate the core idea?**

If the answer is no, the animation is decorative, not communicative. Redesign it.

This aligns with the research: decorative graphics are neutral-to-negative for learning (Mayer's coherence principle, d=0.86). Only explanatory/transformational graphics produce large positive effects.

---

## Animation Strategy Decision

For each slide, choose ONE strategy:

### Strategy 1: SVG Background Animation
**Use when:** The concept has a strong spatial/visual metaphor (flow, journey, network, scale, transformation, constraint, growth).

The SVG sits behind text content as an ambient but meaningful illustration.

### Strategy 2: Content-as-Animation
**Use when:** The content IS the visual story — a list, comparison, or sequence that reveals through phased CSS animation.

No background SVG. Text elements animate through phases using CSS classes toggled by JS.

---

## SVG Background Design Principles

### Viewport & Positioning
- ViewBox: always `0 0 1440 900`
- `preserveAspectRatio="xMidYMid slice"`
- Position animation elements to complement text layout
- If text is centered: place SVG elements in corners, edges, or periphery
- Keep the center content zone (matching slide padding 60px 80px) relatively clear

### Opacity & Visibility
- Parent animation groups: opacity 0.35–0.6 (visible but not competing)
- Fill colors: `rgba()` with accent at 0.03–0.1 alpha
- Stroke colors: `rgba()` with accent at 0.2–0.6 alpha
- Never use pure white — always tint with the section's accent color
- Stroke widths: 1.5–3px primary, 0.5–1px secondary

### Structure

```xml
<svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
  <defs>
    <!-- Gradients, filters, reusable paths, clipPaths -->
  </defs>

  <!-- Layer 1: Landscape/zones (lowest) -->
  <g opacity="0.15">...</g>

  <!-- Layer 2: Structural elements (paths, connections) -->
  <g opacity="0.4">...</g>

  <!-- Layer 3: Moving elements (particles, travelers) -->
  <g opacity="0.5">...</g>

  <!-- Layer 4: Labels (highest, most subtle) -->
  <g opacity="0.4">...</g>
</svg>
```

---

## SMIL Animation Patterns

### 1. Traveling Particles Along Paths
**Use for:** Flow, process, data movement, transformation

```xml
<!-- Define path in defs -->
<path id="flowPath" d="M100,450 C400,200 800,600 1300,350" fill="none"/>

<!-- Particle traveling along path -->
<circle r="5" fill="#00E5FF" opacity="0.7">
  <animateMotion dur="8s" repeatCount="indefinite" rotate="auto">
    <mpath href="#flowPath"/>
  </animateMotion>
</circle>
```

### 2. Pulsing Nodes
**Use for:** Active concepts, destinations, emphasis points

```xml
<circle cx="720" cy="450" r="8" fill="rgba(0,229,255,0.15)" stroke="#00E5FF" stroke-width="2">
  <animate attributeName="r" values="8;14;8" dur="3s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite"/>
</circle>
```

### 3. Dashed Flowing Lines
**Use for:** Connections, data flow, streaming

```xml
<path d="M200,400 Q720,200 1240,400"
      fill="none" stroke="#00E5FF" stroke-width="2"
      stroke-dasharray="8,6" opacity="0.4">
  <animate attributeName="stroke-dashoffset" values="0;-28" dur="2s" repeatCount="indefinite"/>
</path>
```

**Note:** Use negative values (`0;-28`) for forward flow direction.

### 4. Orbiting Elements
**Use for:** Feedback loops, cycles, iteration

```xml
<path id="orbit" d="M720,450 m-100,0 a100,100 0 1,1 200,0 a100,100 0 1,1 -200,0" fill="none"/>

<circle r="4" fill="#B388FF">
  <animateMotion dur="6s" repeatCount="indefinite">
    <mpath href="#orbit"/>
  </animateMotion>
</circle>
```

### 5. Growing/Breathing Elements
**Use for:** Scale, importance, living systems

```xml
<circle cx="720" cy="450" fill="rgba(0,255,136,0.08)" stroke="none">
  <animate attributeName="r" values="40;55;40" dur="4s" repeatCount="indefinite"/>
</circle>
```

### 6. Converging Streams
**Use for:** Synthesis, integration, many-to-one

```xml
<!-- Multiple paths converging to a single point -->
<circle cx="300" cy="200" r="3" fill="#00E5FF">
  <animate attributeName="cx" values="300;720" dur="5s" repeatCount="indefinite"/>
  <animate attributeName="cy" values="200;450" dur="5s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0.8;0" dur="5s" repeatCount="indefinite"/>
</circle>
<!-- Repeat with different starting positions -->
```

### 7. Spark/Friction Effect
**Use for:** Constraint, waste, energy at contact points

```xml
<filter id="sparkGlow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="2" result="blur"/>
  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>

<circle cx="0" cy="0" r="2" fill="#FF6B35" filter="url(#sparkGlow)">
  <animate attributeName="cx" values="0;-30;-50" dur="0.6s" repeatCount="indefinite"/>
  <animate attributeName="cy" values="0;-10;-20" dur="0.6s" repeatCount="indefinite"/>
  <animate attributeName="r" values="2.5;1;0" dur="0.6s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="1;0.5;0" dur="0.6s" repeatCount="indefinite"/>
</circle>
```

### 8. SVG Text Labels
**Use for:** Contextual labels inside animation

```xml
<text x="100" y="50" text-anchor="middle"
      font-family="var(--mono)" font-size="10"
      fill="#00E5FF" opacity="0.5" letter-spacing="1">LABEL TEXT</text>
```

---

## Metaphor Design Process

When creating an animation for a slide:

1. **Identify the core concept** in one sentence
2. **Brainstorm 3-4 visual metaphors** that embody the concept without text
3. **Choose the one with clearest visual tension** — animations need conflict, transformation, or contrast
4. **Map elements to meaning:**
   - What represents the "before" state? (rose/orange, rigid geometry, constrained motion)
   - What represents the "after" state? (green/cyan, organic shapes, free motion)
   - What represents the transformation? (particles, sweeps, path changes)
5. **Layer the SVG:** background zones → structural elements → moving elements → labels
6. **Set opacity** so animation enriches but doesn't compete with text

### Cognitive Science Alignment

From the research:
- **Animation helps** when showing change over time, directing attention, or progressive revelation
- **Animation hurts** when decorative, when competing with narration, or when too fast
- **Instructive graphics** (organizational, explanatory) produce moderate-to-large learning gains
- **Decorative graphics** are neutral-to-negative

Every SVG animation should be an **explanatory/transformational graphic** — it shows how something works or changes, not just "looks cool."

---

## Content-as-Animation Pattern

For slides where content reveals in phases:

### Structure
```html
<div class="slide" id="slide-example">
  <div class="evo-row">
    <div class="evo-before">Old approach</div>
    <div class="evo-arrow">→</div>
    <div class="evo-after">New approach</div>
  </div>
  <!-- more rows -->
</div>
```

### JS Trigger (inside goTo function)
```javascript
if (slides[current].id === 'slide-example') {
  const rows = slides[current].querySelectorAll('.evo-row');
  rows.forEach(r => r.classList.remove('show', 'struck'));
  // Phase 1: rows appear
  setTimeout(() => rows.forEach(r => r.classList.add('show')), 200);
  // Phase 2: before gets struck, after slides in
  setTimeout(() => rows.forEach(r => r.classList.add('struck')), 2600);
}
```

### CSS
```css
.evo-row { opacity: 0; transform: translateY(20px); transition: all 0.5s ease; }
.evo-row.show { opacity: 1; transform: translateY(0); }
.evo-before { position: relative; }
.evo-row.struck .evo-before::after {
  content: '';
  position: absolute;
  left: 0; top: 50%;
  width: 100%; height: 2px;
  background: var(--accent-rose);
  animation: strikethrough 0.4s ease forwards;
}
.evo-arrow { opacity: 0; transform: scale(0); }
.evo-row.struck .evo-arrow { opacity: 1; transform: scale(1); transition: all 0.3s ease; }
.evo-after { opacity: 0; transform: translateX(20px); }
.evo-row.struck .evo-after { opacity: 1; transform: translateX(0); transition: all 0.4s ease; }
```

Stagger row animations with `transition-delay` based on row index.

---

## Common Pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| Animation feels decorative | No conceptual link to slide content | Start with concept, then design metaphor |
| SVG invisible | Opacity too low (0.05–0.15) | Parent groups should be 0.35–0.6 |
| SVG competes with text | Too high opacity or elements overlap text | Keep SVG at edges/corners, reduce opacity |
| Text unreadable | Animation behind text area | Position SVG away from center content zone |
| Animation generic | Abstract shapes with no meaning | Every element must map to something in the concept |
| Content-as-animation won't replay | CSS classes not reset | In goTo(), remove classes before re-adding with setTimeout |
| SMIL choppy | Too many simultaneous animations | Reduce particle count, simplify paths, stagger starts |
| Dashed lines wrong direction | Wrong dashoffset direction | Use negative: `values="0;-20"` for forward flow |