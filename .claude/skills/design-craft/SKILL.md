# Design Craft Skill

Creating apps users _love_, not just _use_. This skill covers the emotional and aesthetic elements that transform functional software into delightful experiences.

## The Delight Gap

shadcn/ui + Tailwind gives you a professional foundation. But "professional" ≠ "loved".

| Level          | What It Looks Like   | User Reaction |
| -------------- | -------------------- | ------------- |
| **Functional** | Works correctly      | "It works"    |
| **Usable**     | Easy to navigate     | "It's fine"   |
| **Beautiful**  | Visually polished    | "It's nice"   |
| **Delightful** | Emotionally resonant | "I love this" |

This skill focuses on the jump from Beautiful → Delightful.

---

## 1. Empty States

Empty states are your biggest opportunity to build connection. Users see them first.

### Anti-Patterns

```tsx
// ❌ Lazy empty state
{
  items.length === 0 && <p>No items found.</p>;
}

// ❌ Depressing empty state
<div className="text-gray-500">Nothing here yet.</div>;
```

### Delight Patterns

```tsx
// ✅ Inviting empty state
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

1. **Illustration** — Visual that matches the emotional context
2. **Headline** — Positive framing (not "nothing here")
3. **Explanation** — What will appear here
4. **Action** — Clear next step

### Contextual Empty States

| Context         | Tone                   | Example Headline                            |
| --------------- | ---------------------- | ------------------------------------------- |
| First time user | Welcoming, exciting    | "Let's build something great"               |
| No results      | Helpful, guiding       | "No matches — try adjusting your filters"   |
| Completed state | Celebratory            | "All done! You're a productivity machine"   |
| Error/failure   | Empathetic, actionable | "Something went wrong — here's what to try" |

---

## 2. Loading States

Loading states are moments to reduce perceived wait time and maintain engagement.

### Anti-Patterns

```tsx
// ❌ Generic spinner
{
  loading && <Spinner />;
}

// ❌ Blank screen
{
  loading && null;
}
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
    setItems(prev => prev.map(i =>
      i.id === item.id ? saved : i
    ))
  } catch {
    // Rollback on failure
    setItems(prev => prev.filter(i => i.id !== item.id))
    toast.error("Failed to add item")
  }
}
```

### Loading Principles

1. **Show content shape** — Skeletons > spinners
2. **Set expectations** — Tell users what's happening
3. **Be optimistic** — Show success before confirmation when safe
4. **Entertain if long** — Progress indicators, tips, fun animations

---

## 3. Micro-Interactions

Small animations that provide feedback and create polish.

### Essential Micro-Interactions

```tsx
// Button press feedback
<button className="active:scale-95 transition-transform">

// Hover lift
<div className="hover:-translate-y-1 hover:shadow-lg transition-all">

// Success checkmark animation
<motion.svg
  initial={{ pathLength: 0 }}
  animate={{ pathLength: 1 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
>
  <motion.path d="M5 13l4 4L19 7" />
</motion.svg>

// Number counting up
<motion.span
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  {useCountUp({ end: value, duration: 1 })}
</motion.span>
```

### Framer Motion Patterns

```tsx
// Page transitions
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>

// Staggered list
<motion.ul>
  {items.map((item, i) => (
    <motion.li
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.1 }}
    />
  ))}
</motion.ul>

// Drag to reorder
<Reorder.Group values={items} onReorder={setItems}>
  {items.map(item => (
    <Reorder.Item key={item.id} value={item}>
      {item.name}
    </Reorder.Item>
  ))}
</Reorder.Group>
```

### When to Animate

| Action               | Animation        | Duration |
| -------------------- | ---------------- | -------- |
| Button click         | Scale down       | 100ms    |
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

<motion.div
  animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }}
>
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

### Illustration Sources

| Source                                                   | Best For                   | Cost     |
| -------------------------------------------------------- | -------------------------- | -------- |
| [unDraw](https://undraw.co)                              | Generic illustrations      | Free     |
| [Storyset](https://storyset.com)                         | Animated illustrations     | Free     |
| [Humaaans](https://humaaans.com)                         | People illustrations       | Free     |
| [Blush](https://blush.design)                            | Customizable illustrations | Freemium |
| [Icons8 Illustrations](https://icons8.com/illustrations) | Variety of styles          | Freemium |
| Custom (AI-generated)                                    | Brand-specific             | Time     |

### AI Image Generation for Apps

Use AI to generate custom illustrations, backgrounds, and imagery.

**Prompt Template for App Illustrations:**

```
[Style]: Flat illustration, soft colors, minimal detail
[Subject]: [What you need - e.g., person working at desk]
[Mood]: [Emotion - e.g., productive, calm, excited]
[Colors]: Match brand palette - primary: [hex], accent: [hex]
[Composition]: Centered, white/transparent background
[Format]: PNG, 1024x1024, suitable for web
```

**Example Prompts:**

```
Empty inbox illustration:
"Flat illustration of an organized empty inbox with a small plant,
soft blue and white colors, minimal style, calm and clean mood,
white background, suitable for web app empty state"

Onboarding welcome:
"Flat illustration of diverse people waving hello, warm and
welcoming mood, vibrant but not overwhelming colors,
white background, friendly minimal style"

Error state:
"Flat illustration of a friendly robot looking confused with
a question mark, soft colors, apologetic but not sad mood,
minimal detail, white background"

Success celebration:
"Flat illustration of confetti and a trophy, celebratory mood,
gold and brand colors, minimal style, white background"
```

**Tools:**

- **Midjourney** — Best quality for illustrations
- **DALL-E 3** — Good for specific compositions
- **Stable Diffusion** — Free, customizable
- **Ideogram** — Good for text in images

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

// Color contrast
<Button className="bg-primary text-white">Primary CTA</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost" className="text-gray-500">Tertiary</Button>

// Whitespace isolation
<div className="py-16"> {/* Important section gets more space */}
  <ImportantContent />
</div>

// Visual weight (borders, shadows)
<Card className="border-2 border-primary shadow-lg">
  <FeaturedItem />
</Card>
<Card className="border border-gray-200">
  <RegularItem />
</Card>
```

### F-Pattern and Z-Pattern

```tsx
// F-Pattern for text-heavy pages (articles, dashboards)
// Users scan: top → left side → across interesting points

// Z-Pattern for landing pages
// Users scan: top-left → top-right → bottom-left → bottom-right
<div className="grid grid-cols-2">
  <Logo /> {/* Top-left: Brand */}
  <Nav /> {/* Top-right: Navigation */}
  <Hero /> {/* Diagonal: Main content */}
  <CTA /> {/* Bottom-right: Action */}
</div>
```

---

## 6. Emotional Design Patterns

### Celebration Moments

When users achieve something, celebrate with them.

```tsx
// Confetti on achievement
import confetti from "canvas-confetti";

function onGoalComplete() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
}

// Progress milestone
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring", bounce: 0.5 }}
>
  <Badge variant="success">🎉 Level Up! You reached 100 points</Badge>
</motion.div>;
```

### Personality Injection

Add brand voice to UI copy:

```tsx
// ❌ Generic
<Label>Password</Label>
<p className="text-sm text-gray-500">Must be 8+ characters</p>

// ✅ With personality
<Label>Secret passphrase</Label>
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
// Subtle sound feedback for key moments
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

## 7. Dark Mode Done Right

### Not Just Inverted Colors

```tsx
// ❌ Bad: Simple inversion
.dark { filter: invert(1); }

// ✅ Good: Thoughtful palette
const darkTheme = {
  background: '#0f0f0f',      // Not pure black
  surface: '#1a1a1a',         // Elevated surfaces lighter
  text: '#e5e5e5',            // Not pure white (easier on eyes)
  textMuted: '#a3a3a3',
  border: '#2a2a2a',
  primary: '#60a5fa',         // Lighter primary for contrast
}
```

### Dark Mode Checklist

- [ ] Backgrounds use dark grays, not pure black
- [ ] Text uses off-white, not pure white
- [ ] Shadows become glows or borders
- [ ] Images have appropriate contrast
- [ ] Charts/graphs adapt colors
- [ ] Primary colors lighten slightly
- [ ] Reduce overall contrast ratio slightly

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
// Pull to refresh
<PullToRefresh onRefresh={handleRefresh}>
  <Content />
</PullToRefresh>

// Swipe actions
<SwipeableListItem
  swipeLeft={{ action: archive, color: 'green' }}
  swipeRight={{ action: delete, color: 'red' }}
>
  <ListItem />
</SwipeableListItem>

// Bottom sheet instead of modal
<Sheet>
  <SheetTrigger>Open</SheetTrigger>
  <SheetContent side="bottom">
    <MobileMenu />
  </SheetContent>
</Sheet>
```

### Haptic Feedback

```tsx
// Vibrate on important actions (mobile web)
function triggerHaptic(type: "light" | "medium" | "heavy") {
  if ("vibrate" in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30, 50, 30],
    };
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
- [ ] No orphaned text (single words on new lines)

### Interaction Polish

- [ ] All interactive elements have hover states
- [ ] Focus states visible and consistent
- [ ] Loading states for all async operations
- [ ] Empty states designed, not just text
- [ ] Error states helpful, not scary
- [ ] Success feedback present

### Responsive Polish

- [ ] Works on 320px width (smallest phones)
- [ ] Touch targets ≥44px
- [ ] Text readable without zooming
- [ ] No horizontal scroll
- [ ] Images scale appropriately

### Animation Polish

- [ ] Animations respect reduced-motion preference
- [ ] No janky or stuttering animations
- [ ] Durations feel natural (150-500ms typically)
- [ ] Animations don't block interaction

---

## 10. Resources

### Animation Libraries

- **Framer Motion** — React animations
- **React Spring** — Physics-based animations
- **Lottie** — After Effects animations
- **Auto Animate** — Zero-config animations

### Illustration Resources

- [unDraw](https://undraw.co) — Free illustrations
- [Storyset](https://storyset.com) — Animated illustrations
- [Blush](https://blush.design) — Customizable
- [Humaaans](https://humaaans.com) — People illustrations

### Inspiration

- [Dribbble](https://dribbble.com) — UI inspiration
- [Mobbin](https://mobbin.com) — Mobile app patterns
- [Page Flows](https://pageflows.com) — User flow examples
- [Really Good Emails](https://reallygoodemails.com) — Email design

### Tools

- **Figma** — Design tool
- **Spline** — 3D for web
- **Rive** — Interactive animations
- **Lottie Files** — Animation marketplace
