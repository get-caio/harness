---
description: "Patterns for Playwright browser tests — critical flow coverage (auth, payments), visual regression snapshots, cross-browser validation, and automated a11y audits. Use for full browser/UI flows; for unit/component tests use testing instead."
---

# E2E Testing Skill

End-to-end testing with Playwright for CAIO incubator projects. Run real browser tests to catch UI regressions, broken flows, and accessibility issues before shipping.

## When to Use

- **Pre-ship validation** — Run full E2E suite before deploying
- **Critical flow protection** — Auth, payments, core user journeys
- **Visual regression** — Catch unintended UI changes
- **Cross-browser validation** — Ensure compatibility
- **Accessibility audits** — Automated a11y checks

---

## Setup

### 1. Install Playwright

```bash
bun add -d @playwright/test
bunx playwright install
```

### 2. Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    // Auth setup - runs once before all tests
    { name: "setup", testMatch: /.*\.setup\.ts/ },

    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      dependencies: ["setup"],
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      dependencies: ["setup"],
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 14"] },
      dependencies: ["setup"],
    },
  ],

  // Dev server
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### 3. Package.json Scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  }
}
```

### 4. File Structure

```
tests/
├── e2e/
│   ├── auth.setup.ts          # Auth state setup (runs once)
│   ├── auth.spec.ts           # Auth flow tests
│   ├── onboarding.spec.ts     # Onboarding flow tests
│   ├── dashboard.spec.ts      # Dashboard tests
│   └── [feature].spec.ts      # Feature-specific tests
├── fixtures/
│   ├── index.ts               # Custom fixtures
│   └── auth.ts                # Auth fixtures
├── pages/                     # Page Object Models
│   ├── base.page.ts
│   ├── login.page.ts
│   ├── dashboard.page.ts
│   └── onboarding.page.ts
└── utils/
    ├── test-data.ts           # Test data generators
    └── helpers.ts             # Test helpers
```

---

## Authentication Setup

### Global Auth State

```typescript
// tests/e2e/auth.setup.ts
import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../.auth/user.json");

setup("authenticate", async ({ page }) => {
  // Go to login
  await page.goto("/login");

  // Fill credentials
  await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel("Password").fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait for redirect to dashboard
  await page.waitForURL("/dashboard");

  // Verify logged in
  await expect(page.getByRole("button", { name: "Account" })).toBeVisible();

  // Save auth state
  await page.context().storageState({ path: authFile });
});
```

### Using Auth State

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from "@playwright/test";

// This test uses the authenticated state from setup
test.use({ storageState: "tests/.auth/user.json" });

test("shows user dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
```

### Multiple Auth States

```typescript
// tests/fixtures/auth.ts
import { test as base } from "@playwright/test";

type AuthFixtures = {
  adminPage: Page;
  userPage: Page;
};

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/admin.json",
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  userPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
```

---

## Page Object Model

### Base Page

```typescript
// tests/pages/base.page.ts
import { Page, Locator, expect } from "@playwright/test";

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Common elements
  get header() {
    return this.page.getByRole("banner");
  }
  get footer() {
    return this.page.getByRole("contentinfo");
  }
  get loadingSpinner() {
    return this.page.getByTestId("loading");
  }
  get toast() {
    return this.page.getByRole("alert");
  }

  // Common actions
  async waitForLoad() {
    await this.loadingSpinner.waitFor({ state: "hidden", timeout: 10000 });
  }

  async expectToast(message: string) {
    await expect(this.toast).toContainText(message);
  }

  async screenshot(name: string) {
    await this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true,
    });
  }
}
```

### Login Page

```typescript
// tests/pages/login.page.ts
import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
  readonly emailInput = this.page.getByLabel("Email");
  readonly passwordInput = this.page.getByLabel("Password");
  readonly submitButton = this.page.getByRole("button", { name: "Sign in" });
  readonly errorMessage = this.page.getByRole("alert");
  readonly forgotPasswordLink = this.page.getByRole("link", {
    name: "Forgot password",
  });

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectLoggedIn() {
    await this.page.waitForURL("/dashboard");
  }
}
```

### Dashboard Page

```typescript
// tests/pages/dashboard.page.ts
import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class DashboardPage extends BasePage {
  readonly heading = this.page.getByRole("heading", { name: "Dashboard" });
  readonly createButton = this.page.getByRole("button", { name: "Create" });
  readonly planCards = this.page.getByTestId("plan-card");
  readonly emptyState = this.page.getByTestId("empty-state");

  async goto() {
    await this.page.goto("/dashboard");
    await this.waitForLoad();
  }

  async createNewPlan() {
    await this.createButton.click();
    await this.page.waitForURL("/plans/new");
  }

  async selectPlan(name: string) {
    await this.page.getByRole("link", { name }).click();
  }

  async expectPlanCount(count: number) {
    await expect(this.planCards).toHaveCount(count);
  }

  async expectEmpty() {
    await expect(this.emptyState).toBeVisible();
  }
}
```

---

## Test Patterns

### Basic Flow Test

```typescript
// tests/e2e/onboarding.spec.ts
import { test, expect } from "@playwright/test";
import { OnboardingPage } from "../pages/onboarding.page";

test.describe("Onboarding Flow", () => {
  test("completes full onboarding", async ({ page }) => {
    const onboarding = new OnboardingPage(page);

    // Step 1: Goals
    await onboarding.goto();
    await onboarding.selectGoal("marathon");
    await onboarding.clickNext();

    // Step 2: Experience
    await onboarding.selectExperience("intermediate");
    await onboarding.clickNext();

    // Step 3: Schedule
    await onboarding.setDaysPerWeek(4);
    await onboarding.clickNext();

    // Step 4: Review & Submit
    await expect(onboarding.summary).toContainText("Marathon");
    await expect(onboarding.summary).toContainText("4 days/week");
    await onboarding.clickFinish();

    // Verify redirect to generated plan
    await page.waitForURL(/\/plans\/[a-z0-9-]+/);
    await expect(page.getByRole("heading")).toContainText("Your Training Plan");
  });

  test("validates required fields", async ({ page }) => {
    const onboarding = new OnboardingPage(page);

    await onboarding.goto();
    await onboarding.clickNext(); // Try to proceed without selection

    await expect(onboarding.errorMessage).toContainText("Please select a goal");
  });

  test("allows going back", async ({ page }) => {
    const onboarding = new OnboardingPage(page);

    await onboarding.goto();
    await onboarding.selectGoal("5k");
    await onboarding.clickNext();
    await onboarding.clickBack();

    // Should be back at step 1 with selection preserved
    await expect(onboarding.goalOption("5k")).toBeChecked();
  });
});
```

### Form Validation Test

```typescript
// tests/e2e/forms.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Plan Editor Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/plans/new");
  });

  test("validates plan name", async ({ page }) => {
    const submitBtn = page.getByRole("button", { name: "Create Plan" });
    const nameInput = page.getByLabel("Plan Name");
    const errorMsg = page.getByText("Name is required");

    // Empty submission
    await submitBtn.click();
    await expect(errorMsg).toBeVisible();

    // Too short
    await nameInput.fill("ab");
    await submitBtn.click();
    await expect(
      page.getByText("Name must be at least 3 characters"),
    ).toBeVisible();

    // Valid
    await nameInput.fill("My Marathon Plan");
    await submitBtn.click();
    await expect(errorMsg).not.toBeVisible();
  });

  test("prevents duplicate plan names", async ({ page }) => {
    await page.getByLabel("Plan Name").fill("Existing Plan Name");
    await page.getByRole("button", { name: "Create Plan" }).click();

    await expect(page.getByRole("alert")).toContainText("already exists");
  });
});
```

### API Mocking

```typescript
// tests/e2e/dashboard-states.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Dashboard States", () => {
  test("shows empty state for new user", async ({ page }) => {
    // Mock empty response
    await page.route("**/api/plans", async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto("/dashboard");

    await expect(page.getByTestId("empty-state")).toBeVisible();
    await expect(page.getByText("Create your first plan")).toBeVisible();
  });

  test("shows error state on API failure", async ({ page }) => {
    await page.route("**/api/plans", async (route) => {
      await route.fulfill({ status: 500, json: { error: "Server error" } });
    });

    await page.goto("/dashboard");

    await expect(page.getByRole("alert")).toContainText("Failed to load");
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  });

  test("shows loading state", async ({ page }) => {
    // Delay response
    await page.route("**/api/plans", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({ json: [{ id: "1", name: "Test Plan" }] });
    });

    await page.goto("/dashboard");

    await expect(page.getByTestId("loading")).toBeVisible();
    await expect(page.getByTestId("loading")).not.toBeVisible({
      timeout: 5000,
    });
  });
});
```

### Visual Regression

```typescript
// tests/e2e/visual.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Visual Regression", () => {
  test("dashboard matches snapshot", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("dashboard.png", {
      maxDiffPixels: 100,
    });
  });

  test("login page matches snapshot", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveScreenshot("login.png");
  });

  test("plan card component", async ({ page }) => {
    await page.goto("/dashboard");

    const card = page.getByTestId("plan-card").first();
    await expect(card).toHaveScreenshot("plan-card.png");
  });

  // Dark mode variant
  test("dashboard dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/dashboard");

    await expect(page).toHaveScreenshot("dashboard-dark.png");
  });
});
```

### Accessibility Testing

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test("login page has no a11y violations", async ({ page }) => {
    await page.goto("/login");

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test("dashboard has no a11y violations", async ({ page }) => {
    await page.goto("/dashboard");

    const results = await new AxeBuilder({ page })
      .exclude(".third-party-widget") // Exclude things we don't control
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("forms are keyboard navigable", async ({ page }) => {
    await page.goto("/plans/new");

    // Tab through form
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Plan Name")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Goal")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Create" })).toBeFocused();
  });

  test("modals trap focus", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Delete" }).first().click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // Focus should be trapped in modal
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
    await expect(modal).toContainText(
      (await focusedElement.textContent()) || "",
    );
  });
});
```

### Mobile Testing

```typescript
// tests/e2e/mobile.spec.ts
import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["iPhone 14"] });

test.describe("Mobile Experience", () => {
  test("navigation menu works", async ({ page }) => {
    await page.goto("/dashboard");

    // Menu should be collapsed on mobile
    await expect(page.getByRole("navigation")).not.toBeVisible();

    // Open hamburger menu
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("navigation")).toBeVisible();

    // Navigate
    await page.getByRole("link", { name: "Settings" }).click();
    await page.waitForURL("/settings");
  });

  test("touch gestures work", async ({ page }) => {
    await page.goto("/plans/123");

    // Swipe to delete workout
    const workout = page.getByTestId("workout-item").first();
    const box = await workout.boundingBox();

    if (box) {
      await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 20, box.y + box.height / 2);
      await page.mouse.up();
    }

    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  });
});
```

---

## Critical Flows to Always Test

### 1. Authentication

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";

test.describe("Authentication", () => {
  test("successful login", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login("test@example.com", "password123");
    await login.expectLoggedIn();
  });

  test("failed login shows error", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login("test@example.com", "wrongpassword");
    await login.expectError("Invalid credentials");
  });

  test("logout clears session", async ({ page }) => {
    // Start logged in
    await page.goto("/dashboard");

    // Logout
    await page.getByRole("button", { name: "Account" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();

    // Should redirect to login
    await page.waitForURL("/login");

    // Try to access protected route
    await page.goto("/dashboard");
    await page.waitForURL("/login"); // Should redirect back
  });

  test("session expiry redirects to login", async ({ page }) => {
    await page.goto("/dashboard");

    // Simulate expired session
    await page.evaluate(() => {
      localStorage.removeItem("auth-token");
    });

    // Next navigation should redirect
    await page.getByRole("link", { name: "Settings" }).click();
    await page.waitForURL("/login");
  });
});
```

### 2. Payment Flow (if applicable)

```typescript
// tests/e2e/payments.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Payment Flow", () => {
  test("completes subscription", async ({ page }) => {
    await page.goto("/pricing");

    await page.getByRole("button", { name: "Subscribe to Pro" }).click();

    // Stripe checkout (use test mode)
    const stripeFrame = page.frameLocator(
      'iframe[name^="__privateStripeFrame"]',
    );

    await stripeFrame.getByPlaceholder("Card number").fill("4242424242424242");
    await stripeFrame.getByPlaceholder("MM / YY").fill("12/30");
    await stripeFrame.getByPlaceholder("CVC").fill("123");

    await page.getByRole("button", { name: "Pay" }).click();

    // Wait for success
    await page.waitForURL("/dashboard?upgraded=true");
    await expect(page.getByRole("alert")).toContainText("Welcome to Pro!");
  });

  test("handles declined card", async ({ page }) => {
    await page.goto("/pricing");
    await page.getByRole("button", { name: "Subscribe to Pro" }).click();

    const stripeFrame = page.frameLocator(
      'iframe[name^="__privateStripeFrame"]',
    );

    // Use Stripe's test declined card
    await stripeFrame.getByPlaceholder("Card number").fill("4000000000000002");
    await stripeFrame.getByPlaceholder("MM / YY").fill("12/30");
    await stripeFrame.getByPlaceholder("CVC").fill("123");

    await page.getByRole("button", { name: "Pay" }).click();

    await expect(page.getByRole("alert")).toContainText("Card was declined");
  });
});
```

### 3. Data CRUD Operations

```typescript
// tests/e2e/plans-crud.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Plan CRUD", () => {
  test("creates a new plan", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Create Plan" }).click();

    await page.getByLabel("Plan Name").fill("My Test Plan");
    await page.getByLabel("Goal").selectOption("marathon");
    await page.getByRole("button", { name: "Create" }).click();

    await page.waitForURL(/\/plans\/[a-z0-9-]+/);
    await expect(page.getByRole("heading")).toContainText("My Test Plan");
  });

  test("edits an existing plan", async ({ page }) => {
    await page.goto("/plans/test-plan-id");

    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Plan Name").fill("Updated Name");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("heading")).toContainText("Updated Name");
    await expect(page.getByRole("alert")).toContainText("Saved");
  });

  test("deletes a plan with confirmation", async ({ page }) => {
    await page.goto("/plans/test-plan-id");

    await page.getByRole("button", { name: "Delete" }).click();

    // Confirmation dialog
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Are you sure");
    await dialog.getByRole("button", { name: "Delete" }).click();

    await page.waitForURL("/dashboard");
    await expect(page.getByRole("alert")).toContainText("Plan deleted");
  });
});
```

---

## CI Integration

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Install Playwright browsers
        run: bunx playwright install --with-deps

      - name: Run E2E tests
        run: bun test:e2e
        env:
          BASE_URL: http://localhost:3000
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

---

## Harness Integration

### As Phase Gate

```yaml
# In build spec
phases:
  - name: development
    steps: [...]

  - name: testing
    steps:
      - run: bun test # Unit tests
      - run: bun test:e2e # E2E tests
    on_failure: block

  - name: staging
    depends_on: testing
    steps: [...]
```

### Selective E2E Runs

```bash
# Quick smoke test (critical flows only)
bun test:e2e --grep "@smoke"

# Full regression suite
bun test:e2e

# Visual regression only
bun test:e2e --grep "visual"

# Single browser (faster)
bun test:e2e --project=chromium
```

### Test Tagging

```typescript
// Tag tests for selective runs
test("login flow @smoke @critical", async ({ page }) => {
  // ...
});

test("edge case handling @regression", async ({ page }) => {
  // ...
});
```

---

## Debugging

### Interactive Mode

```bash
# UI mode - see tests run visually
bun test:e2e:ui

# Debug mode - step through
bun test:e2e:debug

# Headed mode - watch browser
bun test:e2e:headed
```

### Trace Viewer

```bash
# Run with trace
bun test:e2e --trace on

# View trace
bunx playwright show-trace trace.zip
```

### Screenshots & Videos

Automatically captured on failure (configured in playwright.config.ts). Find in:

- `test-results/` — Screenshots, videos, traces
- `playwright-report/` — HTML report

---

## Best Practices

### ✅ Do

- Use data-testid for test-specific selectors
- Keep tests independent (no shared state between tests)
- Use page objects for reusable interactions
- Mock external services (Stripe, APIs)
- Run critical paths on every PR
- Use meaningful test names that describe behavior

### ❌ Don't

- Don't use CSS selectors that break on style changes
- Don't depend on test execution order
- Don't hardcode wait times (use waitFor\* methods)
- Don't test third-party UI (Stripe's iframe internals)
- Don't run visual regression on every commit (slow)
- Don't leave console.logs in test files

---

## Quick Reference

```bash
# Run all E2E tests
bun test:e2e

# Run specific file
bun test:e2e tests/e2e/auth.spec.ts

# Run tests matching pattern
bun test:e2e --grep "login"

# Run tagged tests
bun test:e2e --grep "@smoke"

# Single browser
bun test:e2e --project=chromium

# Debug mode
bun test:e2e --debug

# Update snapshots
bun test:e2e --update-snapshots

# Show report
bun test:e2e:report
```
