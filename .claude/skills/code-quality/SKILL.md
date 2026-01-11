# Code Simplifier Skill

Keep code simple, readable, and maintainable. Complexity is the enemy. Reference this skill when writing or reviewing code.

## Core Principles

1. **YAGNI** — You Aren't Gonna Need It. Don't build for hypothetical futures.
2. **KISS** — Keep It Simple, Stupid. The simplest solution is usually best.
3. **DRY** — Don't Repeat Yourself. But don't over-abstract either.
4. **Single Responsibility** — Each function/component does one thing well.
5. **Readable > Clever** — Code is read 10x more than it's written.

---

## Complexity Limits

### Function Length
- **Target:** < 20 lines
- **Max:** 40 lines
- **If longer:** Split into smaller functions

### Function Parameters
- **Target:** 1-3 parameters
- **Max:** 5 parameters
- **If more:** Use an options object

```typescript
// ❌ Too many parameters
function createUser(name, email, age, role, team, department, manager) {}

// ✅ Options object
interface CreateUserOptions {
  name: string
  email: string
  age?: number
  role?: Role
  team?: string
}

function createUser(options: CreateUserOptions) {}
```

### Nesting Depth
- **Target:** 2 levels
- **Max:** 3 levels
- **If deeper:** Extract to functions or use early returns

```typescript
// ❌ Too nested
function processOrder(order) {
  if (order) {
    if (order.items) {
      if (order.items.length > 0) {
        for (const item of order.items) {
          if (item.inStock) {
            // do something
          }
        }
      }
    }
  }
}

// ✅ Early returns
function processOrder(order) {
  if (!order?.items?.length) return
  
  const inStockItems = order.items.filter(item => item.inStock)
  inStockItems.forEach(processItem)
}
```

### File Length
- **Target:** < 200 lines
- **Max:** 400 lines
- **If longer:** Split into modules

### Cyclomatic Complexity
- **Target:** < 5
- **Max:** 10
- **If higher:** Refactor conditionals

---

## Simplification Patterns

### Replace Conditionals with Maps

```typescript
// ❌ Long switch/if chain
function getStatusColor(status: string) {
  if (status === 'pending') return 'yellow'
  if (status === 'active') return 'green'
  if (status === 'paused') return 'gray'
  if (status === 'cancelled') return 'red'
  return 'gray'
}

// ✅ Lookup map
const STATUS_COLORS: Record<string, string> = {
  pending: 'yellow',
  active: 'green',
  paused: 'gray',
  cancelled: 'red',
}

function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? 'gray'
}
```

### Extract Boolean Logic

```typescript
// ❌ Complex inline condition
if (user.role === 'admin' || (user.role === 'editor' && user.teamId === resource.teamId)) {
  // allow
}

// ✅ Named boolean
const isAdmin = user.role === 'admin'
const isTeamEditor = user.role === 'editor' && user.teamId === resource.teamId
const canEdit = isAdmin || isTeamEditor

if (canEdit) {
  // allow
}
```

### Use Descriptive Variables

```typescript
// ❌ Magic numbers and unclear logic
if (items.length > 0 && total > 100 && user.createdAt < Date.now() - 86400000) {
  applyDiscount(0.1)
}

// ✅ Named constants and clear intent
const MIN_ITEMS_FOR_DISCOUNT = 1
const MIN_ORDER_VALUE = 100
const ACCOUNT_AGE_DAYS = 1
const DISCOUNT_RATE = 0.1

const hasItems = items.length >= MIN_ITEMS_FOR_DISCOUNT
const meetsMinimum = total >= MIN_ORDER_VALUE
const isEstablishedCustomer = daysSince(user.createdAt) >= ACCOUNT_AGE_DAYS

if (hasItems && meetsMinimum && isEstablishedCustomer) {
  applyDiscount(DISCOUNT_RATE)
}
```

### Avoid Over-Abstraction

```typescript
// ❌ Over-abstracted (only used once)
const ButtonFactory = createFactory(Button, defaultProps)
const StyledButton = withStyles(ButtonFactory, buttonStyles)
const EnhancedButton = withTracking(StyledButton, trackingConfig)

// ✅ Direct and simple
function PrimaryButton({ children, onClick }) {
  return (
    <button 
      className="btn-primary" 
      onClick={(e) => {
        trackClick('primary-button')
        onClick?.(e)
      }}
    >
      {children}
    </button>
  )
}
```

### Prefer Composition Over Inheritance

```typescript
// ❌ Complex inheritance
class Animal {}
class Mammal extends Animal {}
class Dog extends Mammal {}
class ServiceDog extends Dog {}

// ✅ Composition
interface Animal {
  name: string
}

interface CanBark {
  bark(): void
}

interface ServiceAnimal {
  certification: string
  assist(): void
}

type ServiceDog = Animal & CanBark & ServiceAnimal
```

---

## Code Smells to Avoid

### 1. Long Parameter Lists
**Smell:** Function takes 4+ parameters
**Fix:** Use options object or builder pattern

### 2. Feature Envy
**Smell:** Method uses more data from another class than its own
**Fix:** Move method to where the data lives

### 3. Shotgun Surgery
**Smell:** One change requires editing many files
**Fix:** Consolidate related logic

### 4. Dead Code
**Smell:** Commented-out code, unused functions
**Fix:** Delete it. Git remembers.

### 5. Speculative Generality
**Smell:** Abstractions for features that don't exist
**Fix:** Build for today, refactor for tomorrow

### 6. Primitive Obsession
**Smell:** Using strings/numbers where objects would be clearer
**Fix:** Create domain types

```typescript
// ❌ Primitive obsession
function processPayment(amount: number, currency: string, status: string) {}

// ✅ Domain types
type Currency = 'USD' | 'EUR' | 'GBP'
type PaymentStatus = 'pending' | 'completed' | 'failed'

interface Money {
  amount: number
  currency: Currency
}

function processPayment(money: Money, status: PaymentStatus) {}
```

---

## React-Specific Simplifications

### Component Size
- **Target:** < 100 lines
- **Max:** 200 lines
- **If larger:** Extract sub-components

### Props Count
- **Target:** 3-5 props
- **Max:** 8 props
- **If more:** Component does too much

### Hooks Count
- **Target:** 2-4 hooks
- **Max:** 6 hooks
- **If more:** Extract custom hook

### State Management

```typescript
// ❌ Too much local state
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState(null)
const [data, setData] = useState(null)
const [isRefetching, setIsRefetching] = useState(false)

// ✅ Combine related state or use reducer
interface FetchState<T> {
  data: T | null
  error: Error | null
  status: 'idle' | 'loading' | 'success' | 'error'
}

const [state, dispatch] = useReducer(fetchReducer, initialState)

// ✅ Or use a data fetching library
const { data, error, isLoading } = useSWR('/api/data', fetcher)
```

### Avoid Prop Drilling

```typescript
// ❌ Prop drilling through 4+ levels
<App user={user}>
  <Layout user={user}>
    <Sidebar user={user}>
      <UserAvatar user={user} />
    </Sidebar>
  </Layout>
</App>

// ✅ Context for widely-used data
const UserContext = createContext<User | null>(null)

function App() {
  return (
    <UserContext.Provider value={user}>
      <Layout>
        <Sidebar>
          <UserAvatar /> {/* Uses useContext internally */}
        </Sidebar>
      </Layout>
    </UserContext.Provider>
  )
}
```

---

## Refactoring Checklist

Before marking a ticket done:

- [ ] Functions under 20 lines (40 max)
- [ ] Max 3 levels of nesting
- [ ] No magic numbers (use named constants)
- [ ] Complex conditions extracted to named booleans
- [ ] No commented-out code
- [ ] No unused imports or variables
- [ ] No duplicate code blocks
- [ ] Clear, descriptive names
- [ ] Types instead of primitives for domain concepts

---

## When Complexity Is Okay

Some complexity is justified:
- **Performance-critical paths** — Sometimes optimization requires complexity
- **Domain complexity** — Business rules are inherently complex
- **Well-tested algorithms** — Complex but proven and tested

When keeping complex code:
1. Add comprehensive tests
2. Add detailed comments explaining WHY
3. Consider extracting to a dedicated module
4. Document in ADR if architectural

---

## Quick Wins

Fast simplifications with high impact:

1. **Delete dead code** — If it's not used, remove it
2. **Inline trivial functions** — One-liner wrappers with no reuse
3. **Flatten nested callbacks** — Use async/await
4. **Replace boolean parameters** — Use options object or separate functions
5. **Extract magic strings** — Move to constants file
6. **Remove unnecessary comments** — Code should be self-documenting
