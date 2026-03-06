---
name: design-craft
description: "Emotional design and polish for delightful user experiences. Load this skill when polishing empty states, loading states, error states, adding celebrations and personality, implementing dark mode as a system, adding illustrations, or doing a final polish pass before shipping. Covers empty state quality ladders, loading state psychology, micro-interactions, illustration strategy, visual hierarchy, emotional design patterns, dark mode architecture, and mobile delight. Use alongside interaction-motion (animation) and visual-design (foundations)."
version: 2.0.0
---

# Design Craft

Creating apps users _love_, not just _use_. This skill covers the emotional and aesthetic elements that transform functional software into delightful experiences.

## The Delight Gap

shadcn/ui + Tailwind gives you a professional foundation. But "professional" ≠ "loved."

| Level          | What It Looks Like   | User Reaction |
| -------------- | -------------------- | ------------- |
| **Functional** | Works correctly      | "It works"    |
| **Usable**     | Easy to navigate     | "It's fine"   |
| **Beautiful**  | Visually polished    | "It's nice"   |
| **Delightful** | Emotionally resonant | "I love this" |

This skill focuses on the jump from Beautiful → Delightful. Research shows the aesthetic-usability effect is real — users perceive beautiful interfaces as more functional. But delight goes beyond aesthetics into emotional connection.

---

## 1. Empty States

Empty states are your biggest opportunity to build connection. Users see them first. An empty screen creates decision paralysis and increases time-to-value.

### The Quality Ladder

Not all empty states are equal. Aim for level 3-4:

1. **Basic** — assures nothing is broken. "No items yet." Acceptable for internal tools, insufficient for products.
2. **Informative** — explains the state. "This is where your contacts will appear after you import them." Users understand the purpose.
3. **Actionable** — guides the user with a specific CTA. "Create your first project" with a button. Users know what to do next.
4. **Delightful** — creates satisfaction with illustration, personality, and clear action. Users feel invited rather than confronted with emptiness.

Best practice: combine levels 2-4. Pre-load demo data instead of showing empty states wherever possible.

### Anti-Patterns

```tsx
// ❌ Lazy empty state (Level 0)
{items.length === 0 && <p>No items found.</p>}

// ❌ Depressing empty state
<div className="text-gray-500">Nothing here yet.</div>
```

### Delight Patterns

```tsx
// ✅ Inviting empty state (Level 4)
<div className="flex flex-col items-center py-12 text-center">
  <IllustrationEmptyInbox className="w-48 h-48 mb-6" />
  <h3 className="text-xl font-semibold mb-2">Your inbox is clear!</h3>
  <p className="text-gray-600 mb-6 max-w-sm">
    When you receive messages, they'll show up here. Ready to get started?
  </p>
  <Button>
    <Plus className="w-4 h-4 mr-2" />
    Send your first message
  </Button>
</div>
```

### Empty State Formula

1. **Illustration** — visual that matches the emotional context
2. **Headline** — positive framing (not "nothing here")
3. **Explanation** — what will appear here
4. **Action** — clear next step (specific CTA, not generic "Get started")

### Contextual Empty States

| Context              | Tone                   | Example Headline                            |
| -------------------- | ---------------------- | ------------------------------------------- |
| First time user      | Welcoming, exciting    | "Let's build something great"               |
| No results           | Helpful, guiding       | "No matches — try adjusting your filters"   |
| Completed state      | Celebratory            | "All done! You're a productivity machine"   |
| Error/failure        | Empathetic, actionable | "Something went wrong — here's what to try" |
| New feature area     | Educational            | "Track your team's progress here"           |
| Post-completion      | Encouraging rest       | GitHub's Octocat strolling through a forest |

### New Feature Education

When users encounter an unused feature, the empty state should explain what it does and why they'd want it. Linear does this well — the empty state for a new feature doubles as its best marketing.

---

## 2. Loading States

Loading states are moments to reduce perceived wait time and maintain engagement. Research shows skeleton screens feel approximately 20% faster than spinners for identical wait times.

### Anti-Patterns

```tsx
// ❌ Generic spinner
{loading && <Spinner />}

// ❌ Blank screen
{loading && null}
```

### Delight Patterns

```tsx
// ✅ Skeleton that matches content shape
<div className="space-y-4">
  <Skeleton className="h-8 w-3/4" />  {/* Title */}
  <Skeleton className="h-4 w-full" /> {/* Line 1 */}
  <Skeleton className="h-4 w-5/6" />  {/* Line 2 */}
</div>

// ✅ Progressive loading with context
<div className="flex flex-col items-center py-8">
  <LoadingAnimation type="analyzing" />
  <p className="text-sm text-gray-600 mt-4">
    Analyzing your data...
  </p>
  <p className="text-xs text-gray-400 mt-1">
    This usually takes about 5 seconds
  </p>
</div>

// ✅ Optimistic UI
const [items, setItems] = useState(data)

async function addItem(item) {
  // Show immediately
  setItems([...items, { ...item, isPending: true }])
  try {
    const saved = await api.create(item)
    setItems(prev => prev.map(i => i.id === item.id ? saved : i))
  } catch {
    setItems(prev => prev.filter(i => i.id !== item.id))
    toast.error("Failed to add item")
  }
}
```

### Loading Principles

1. **Show content shape** — skeletons > spinners, always
2. **Set expectations** — tell users what's happening and how long
3. **Be optimistic** — show success before confirmation when safe
4. **Meaningful delays** — for AI/analysis operations, a slight delay with animation suggests thoroughness. A 0ms "deep analysis" feels fake. 800ms with a meaningful animation feels like the system is working.
5. **Progress bars that accelerate** — bars with slight acceleration at the end feel faster than consistent ones

---

## 3. Micro-Interactions

Small animations that provide feedback and create polish. See interaction-motion skill for detailed motion principles.

### Essential Micro-Interactions

```tsx
// Button press feedback (squash & stretch)
<button className="active:scale-[0.97] transition-transform duration-100">

// Hover lift
<div className="hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">

// Success checkmark animation
<motion.svg initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
  transition={{ duration: 0.5, ease: "easeOut" }}>
  <motion.path d="M5 13l4 4L19 7" />
</motion.svg>
```

### When to Animate

| Action               | Animation        | Duration |
| -------------------- | ---------------- | -------- |
| Button click         | Scale down       | 50-100ms |
| Modal open           | Fade + slide     | 200ms    |
| Page transition      | Fade + y         | 300ms    |
| Success confirmation | Checkmark draw   | 500ms    |
| Celebrating          | Confetti, bounce | 1000ms+  |

### When NOT to Animate

- Repeated actions (typing, scrolling)
- High-frequency updates (real-time data)
- Critical paths where speed matters
- When user has reduced-motion preference

```tsx
// Respect reduced motion
const prefersReducedMotion = useReducedMotion()
<motion.div animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }}>
```

---

## 4. Illustrations & Imagery

### When to Use Illustrations

| Scenario             | Best Choice           |
| -------------------- | --------------------- |
| Empty states         | Custom illustration   |
| Error pages          | Friendly illustration |
| Feature explanations | Spot illustrations    |
| Hero sections        | Photo or 3D render    |
| Backgrounds          | Abstract patterns     |
| Onboarding steps     | Instructional illustration |

### Illustration Sources

| Source                                                   | Best For                   | Cost     |
| -------------------------------------------------------- | -------------------------- | -------- |
| [unDraw](https://undraw.co)                              | Generic illustrations      | Free     |
| [Storyset](https://storyset.com)                         | Animated illustrations     | Free     |
| [Humaaans](https://humaaans.com)                         | People illustrations       | Free     |
| [Blush](https://blush.design)                            | Customizable illustrations | Freemium |
| [Icons8 Illustrations](https://icons8.com/illustrations) | Variety of styles          | Freemium |
| Custom (AI-generated)                                    | Brand-specific             | Time     |

**Important note on generic illustrations:** Default Humaaans-style illustrations are now overplayed and signal "generic SaaS." If using illustration libraries, customize the colors to match your brand palette. Better yet, invest in a distinctive illustration style that becomes part of your visual identity.

### AI Image Generation for Apps

Use AI to generate custom illustrations, backgrounds, and imagery.

**Prompt Template for App Illustrations:**
```
[Style]: Flat illustration, soft colors, minimal detail
[Subject]: [What you need]
[Mood]: [Emotion - productive, calm, excited]
[Colors]: Match brand palette - primary: [hex], accent: [hex]
[Composition]: Centered, white/transparent background
[Format]: PNG, 1024x1024, suitable for web
```

**Tools:** Midjourney (best quality), DALL-E 3 (specific compositions), Stable Diffusion (free, customizable), Ideogram (text in images).

### Background Patterns

```tsx
// Subtle grid pattern (CSS)
<div className="bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px]">

// Gradient mesh
<div className="bg-gradient-to-br from-primary/10 via-transparent to-secondary/10">

// Noise texture overlay
<div className="relative">
  <div className="absolute inset-0 bg-noise opacity-5" />
  {children}
</div>
```

---

## 5. Visual Hierarchy

Guide the eye to what matters.

### The Squint Test

Squint at your screen. Can you tell:
1. What the page is about?
2. What the primary action is?
3. Where to look first?

If not, hierarchy needs work.

### Hierarchy Tools

```tsx
// Size difference
<h1 className="text-4xl font-bold">Primary</h1>
<h2 className="text-xl">Secondary</h2>
<p className="text-base text-gray-600">Supporting</p>

// Color contrast for action hierarchy
<Button className="bg-primary text-white">Primary CTA</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost" className="text-gray-500">Tertiary</Button>

// Whitespace isolation (isolation effect: 40% more memorable)
<div className="py-16">
  <ImportantContent />
</div>

// Visual weight (borders or surface shifts, not always shadows)
<Card className="border-2 border-primary bg-primary/5">
  <FeaturedItem />
</Card>
<Card className="border border-gray-200">
  <RegularItem />
</Card>
```

---

## 6. Emotional Design Patterns

### Celebration Moments

When users achieve something, celebrate with them. But calibrate to the achievement.

```tsx
// Confetti on milestone achievement
import confetti from "canvas-confetti";

function onGoalComplete() {
  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
}

// Subtle success for routine operations
<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
  transition={{ type: "spring", bounce: 0.5 }}>
  <Badge variant="success">✓ Saved</Badge>
</motion.div>
```

**Calibration rule:** confetti for milestones (completed onboarding, reached a goal, first sale). A checkmark for routine saves. Over-celebrating routine operations ("Congratulations! Your settings have been saved!") is patronizing.

### Personality Injection

Add brand voice to UI copy. This is where the product stops feeling like a template.

```tsx
// ❌ Generic
<Label>Password</Label>
<p className="text-sm text-gray-500">Must be 8+ characters</p>

// ✅ With personality
<Label>Password</Label>
<p className="text-sm text-gray-500">
  Make it strong — at least 8 characters, mix it up
</p>

// ❌ Generic error
<p className="text-red-500">Invalid input</p>

// ✅ Helpful and human
<p className="text-red-500">
  Hmm, that doesn't look quite right. Need a valid email like you@example.com
</p>
```

### Sound Design (Use Sparingly)

```tsx
const playSuccess = () => {
  const audio = new Audio("/sounds/success.mp3");
  audio.volume = 0.3;
  audio.play();
};

// Only play if user hasn't disabled
if (!prefersReducedMotion && userSettings.soundEnabled) {
  playSuccess();
}
```

---

## 7. Dark Mode as a Design System

Dark mode is not inverted light mode. It requires its own design system with different rules for elevation, contrast, saturation, and typography weight.

### The Elevation Principle

In light mode, elevated surfaces cast shadows. In dark mode, **elevated surfaces get lighter.** Define 3-5 elevation levels:

```tsx
const darkElevation = {
  base:     '#0f0f0f',     // Deepest background
  surface1: '#1a1a1a',     // Cards, sidebars
  surface2: '#222222',     // Elevated cards, popovers
  surface3: '#2a2a2a',     // Modals, dropdowns
  surface4: '#333333',     // Tooltips, highest elevation
}
```

Never use pure black (#000) for surfaces — it creates excessive contrast and makes shadows invisible. Use dark gray or custom tinted near-blacks.

### Text Contrast

Never use pure white for body text. Bright text on dark backgrounds appears heavier than the same weight on light backgrounds.

```tsx
const darkText = {
  primary:  'rgba(255, 255, 255, 0.87)',  // High emphasis
  secondary: 'rgba(255, 255, 255, 0.60)', // Medium emphasis
  disabled: 'rgba(255, 255, 255, 0.38)',  // Disabled
  // Consider reducing body font weight by one step in dark mode
  // and slightly increasing letter spacing
}
```

### Saturation Tolerance

Key insight: darker surfaces are highly tolerant of saturated colors while still reading as neutral. This is why Linear and Raycast can use vibrant gradients against dark surfaces effectively. Dark mode naturally supports richer, more opinionated color choices without looking garish.

However: saturated colors that work on light backgrounds can look neon on dark ones. Desaturate standard semantic colors (success, error, warning) by 10-20% for dark mode.

### Dark Mode Checklist

- [ ] Surfaces use tinted dark grays, not pure black
- [ ] Text uses opacity-controlled white, not pure white
- [ ] Elevation expressed through surface lightness, not shadows
- [ ] Body text weight reduced by one step (or letter spacing increased)
- [ ] Semantic colors desaturated 10-20%
- [ ] Primary/accent colors tested for contrast on dark surfaces
- [ ] Images have appropriate contrast
- [ ] Charts/graphs adapt colors
- [ ] Take advantage of saturation tolerance for brand expression

---

## 8. Mobile Delight

### Touch Targets

```tsx
// Minimum 44x44px touch targets
<button className="min-h-[44px] min-w-[44px] p-3">

// Generous tap areas
<Link className="block py-4 -mx-4 px-4">
  <div className="flex items-center gap-3">
    <Icon />
    <span>Menu Item</span>
  </div>
</Link>
```

### Mobile-Specific Interactions

```tsx
// Bottom sheet instead of modal on mobile
<Sheet>
  <SheetTrigger>Open</SheetTrigger>
  <SheetContent side="bottom">
    <MobileMenu />
  </SheetContent>
</Sheet>
```

### Haptic Feedback

```tsx
function triggerHaptic(type: "light" | "medium" | "heavy") {
  if ("vibrate" in navigator) {
    const patterns = { light: [10], medium: [20], heavy: [30, 50, 30] };
    navigator.vibrate(patterns[type]);
  }
}
```

---

## 9. Design QA Checklist

Before shipping any UI:

### Visual Polish

- [ ] Consistent spacing (multiples of 4px)
- [ ] Typography hierarchy clear
- [ ] Color contrast accessible (4.5:1 minimum)
- [ ] Icons consistent size and stroke
- [ ] Images optimized and properly sized
- [ ] No orphaned text (single words on new lines in hero text)

### Interaction Polish

- [ ] All interactive elements have hover states
- [ ] Focus states visible and consistent
- [ ] Loading states for all async operations (skeletons, not spinners)
- [ ] Empty states designed at Level 3+ (actionable or delightful)
- [ ] Error states helpful, not scary
- [ ] Success feedback calibrated to importance

### Responsive Polish

- [ ] Works on 320px width (smallest phones)
- [ ] Touch targets ≥44px
- [ ] Text readable without zooming
- [ ] No horizontal scroll
- [ ] Images scale appropriately

### Animation Polish

- [ ] Animations respect reduced-motion preference
- [ ] No janky or stuttering animations
- [ ] Durations feel natural (50-500ms typically)
- [ ] Animations don't block interaction
- [ ] Spring physics used for interactive elements

### Dark Mode Polish

- [ ] Elevation via surface lightness, not shadows
- [ ] No pure black or pure white
- [ ] Semantic colors tested and adjusted
- [ ] Text weight/spacing considered

---

## 10. Resources

### Animation Libraries
- **Framer Motion** — React animations (standard)
- **React Spring** — Physics-based animations
- **Lottie** — After Effects animations (dotLottie for 90% smaller)
- **Auto Animate** — Zero-config animations

### Illustration Resources
- [unDraw](https://undraw.co) — Free illustrations
- [Storyset](https://storyset.com) — Animated illustrations
- [Blush](https://blush.design) — Customizable
- [Humaaans](https://humaaans.com) — People illustrations

### Inspiration
- [Godly](https://godly.website) — Curated striking web designs
- [Mobbin](https://mobbin.com) — 400K+ real app screenshots and flows
- [SaaSFrame](https://saasframe.io) — SaaS-specific UI patterns
- [DesignSpells](https://designspells.com) — Micro-interactions and delightful details
- [Page Flows](https://pageflows.com) — User flow examples
- [Really Good Emails](https://reallygoodemails.com) — Email design

### Design Engineering References
- [animations.dev](https://animations.dev) — Emil Kowalski's animation course
- [devouringdetails.com](https://devouringdetails.com) — Rauno Freiberg's interaction design course
- [lawsofux.com](https://lawsofux.com) — UX principles backed by psychology
- [shapeof.ai](https://shapeof.ai) — AI UX pattern taxonomy
