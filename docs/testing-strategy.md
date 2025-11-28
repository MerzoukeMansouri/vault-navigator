# Testing Strategy

Comprehensive testing strategy for Vault Navigator focusing on business logic, not UI templates.

## 🎯 Testing Philosophy

### What We Test

**Focus on LOGIC, not templates:**
- ✅ **Custom Hooks** - Business logic and state management
- ✅ **Services** - VaultCache, API clients
- ✅ **Utilities** - Path utils, logger, tree utils
- ✅ **VaultClient** - API methods and error handling
- ✅ **Storage** - LocalStorage wrapper

### What We DON'T Test

**Skip PRESENTATION:**
- ❌ **UI Components** - React components (.tsx files)
- ❌ **JSX Templates** - Visual rendering
- ❌ **Styling** - Tailwind classes, CSS
- ❌ **Pages** - Next.js page components
- ❌ **Layouts** - App shell and structure

### Why This Approach?

**Benefits:**
1. **High ROI**: Logic has more edge cases than UI
2. **Less Brittle**: UI changes frequently, logic is stable
3. **Faster Tests**: No DOM rendering, no browser overhead
4. **Better Coverage**: Focus on critical business paths
5. **Easier Maintenance**: Less test updates when UI changes

**UI Testing is handled by:**
- Manual QA during development
- User acceptance testing
- (Optional) E2E tests for critical flows

## 📊 Testing Pyramid

```
        ┌─────────────┐
        │  E2E Tests  │  ← Manual/Optional
        │  (Critical  │
        │    Flows)   │
        ├─────────────┤
        │ Integration │  ← Future: API + Hooks
        │    Tests    │
        ├─────────────┤
        │             │
        │    Unit     │  ← Current Focus:
        │   Tests     │     Hooks, Services, Utils
        │             │
        └─────────────┘
```

**Our Focus**: Unit tests for all business logic

## 🛠️ Testing Tools

### Core Testing Framework

**Vitest** - Fast, modern test runner
- Why: Native ESM support, faster than Jest
- Features: TypeScript support, watch mode, coverage
- Compatible with Jest API (easy migration)

```bash
# Run tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage report
pnpm test:coverage

# UI mode (interactive)
pnpm test:ui
```

### React Testing Library

**@testing-library/react-hooks** - Test custom hooks
- Renders hooks in isolation
- No need for dummy components
- Clean, focused tests

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useSecretEditor } from "../use-secret-editor";

test("loads secret on mount", async () => {
  const { result } = renderHook(() => useSecretEditor("secret/test"));
  await waitFor(() => expect(result.current.secret).toBeTruthy());
});
```

### Mutation Testing

**Stryker Mutator** - Verify test quality
- Introduces bugs (mutations) in code
- Checks if tests catch the bugs
- Measures test effectiveness

```bash
# Run mutation testing
pnpm test:mutation
```

## 📁 Test Organization

### File Structure

```
vault-navigator/
├── hooks/
│   ├── use-secret-editor.ts
│   └── __tests__/
│       └── use-secret-editor.test.ts
│
├── lib/
│   ├── services/
│   │   ├── vault-cache.ts
│   │   └── __tests__/
│   │       └── vault-cache.test.ts
│   │
│   ├── utils/
│   │   ├── vault-path-utils.ts
│   │   └── __tests__/
│   │       └── vault-path-utils.test.ts
│   │
│   ├── vault-client.ts
│   └── __tests__/
│       └── vault-client.test.ts
│
└── vitest.config.ts
```

### Naming Conventions

- **Test files**: `*.test.ts` or `*.test.tsx`
- **Test folder**: `__tests__/` next to source
- **Test names**: Describe behavior, not implementation

```typescript
// ✅ GOOD: Describes behavior
test("returns null when secret does not exist", () => {});
test("invalidates cache when secret is deleted", () => {});

// ❌ BAD: Describes implementation
test("calls client.readSecret", () => {});
test("sets state to null", () => {});
```

## ✅ What to Test

### 1. Custom Hooks (`hooks/`)

**Test:**
- State initialization
- State updates
- API calls
- Error handling
- Callbacks and side effects

**Example: `use-secret-editor.test.ts`**
```typescript
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSecretEditor } from "../use-secret-editor";

describe("useSecretEditor", () => {
  test("loads secret on mount", async () => {
    const { result } = renderHook(() =>
      useSecretEditor("secret/myapp/db")
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.secret).toBeTruthy();
    });
  });

  test("saves secret successfully", async () => {
    const { result } = renderHook(() =>
      useSecretEditor("secret/myapp/db")
    );

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.saving).toBe(false);
    // Verify toast.success was called
  });

  test("handles save errors", async () => {
    // Mock client to throw error
    const { result } = renderHook(() =>
      useSecretEditor("secret/invalid")
    );

    await act(async () => {
      await expect(result.current.handleSave()).rejects.toThrow();
    });

    // Verify toast.error was called
  });
});
```

**Hooks to test:**
- ✅ `use-secret-editor.ts`
- ✅ `use-secret-creator.ts`
- ✅ `use-config-form.ts`
- ✅ `use-config-list.ts`
- ✅ `use-confirm.ts`
- ✅ `use-token-detection.tsx`

### 2. Services (`lib/services/`)

**Test:**
- CRUD operations
- Cache expiration
- Pattern matching
- Edge cases

**Example: `vault-cache.test.ts`**
```typescript
import { VaultCache } from "../vault-cache";

describe("VaultCache", () => {
  let cache: VaultCache<string>;

  beforeEach(() => {
    cache = new VaultCache({ defaultTTL: 1000 });
  });

  test("stores and retrieves data", () => {
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
  });

  test("returns null for expired entries", async () => {
    cache.set("key1", "value1", 100); // 100ms TTL
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(cache.get("key1")).toBeNull();
  });

  test("invalidates by pattern", () => {
    cache.set("secret:app1:db", "value1");
    cache.set("secret:app1:api", "value2");
    cache.set("secret:app2:db", "value3");

    cache.invalidatePattern(/^secret:app1/);

    expect(cache.get("secret:app1:db")).toBeNull();
    expect(cache.get("secret:app1:api")).toBeNull();
    expect(cache.get("secret:app2:db")).toBe("value3");
  });

  test("purges expired entries", async () => {
    cache.set("key1", "value1", 100);
    cache.set("key2", "value2", 10000);

    await new Promise(resolve => setTimeout(resolve, 150));

    const purged = cache.purgeExpired();
    expect(purged).toBe(1);
    expect(cache.size()).toBe(1);
  });
});
```

### 3. Utilities (`lib/utils/`)

**Test:**
- Input variations
- Edge cases
- Error conditions

**Example: `vault-path-utils.test.ts`**
```typescript
import { VaultPathUtils } from "../vault-path-utils";

describe("VaultPathUtils", () => {
  describe("cleanSecretPath", () => {
    test("removes secret/ prefix", () => {
      expect(VaultPathUtils.cleanSecretPath("secret/myapp/db"))
        .toBe("myapp/db");
    });

    test("handles path without prefix", () => {
      expect(VaultPathUtils.cleanSecretPath("myapp/db"))
        .toBe("myapp/db");
    });

    test("handles empty path", () => {
      expect(VaultPathUtils.cleanSecretPath(""))
        .toBe("");
    });
  });

  describe("joinPaths", () => {
    test("joins multiple segments", () => {
      expect(VaultPathUtils.joinPaths("secret", "myapp", "db"))
        .toBe("secret/myapp/db");
    });

    test("handles empty segments", () => {
      expect(VaultPathUtils.joinPaths("secret", "", "db"))
        .toBe("secret/db");
    });

    test("normalizes double slashes", () => {
      expect(VaultPathUtils.joinPaths("secret//myapp", "db"))
        .toBe("secret/myapp/db");
    });
  });

  describe("buildCacheKey", () => {
    test("includes namespace", () => {
      const key = VaultPathUtils.buildCacheKey("list", "secret/app", "dev");
      expect(key).toBe("list:secret/app:dev");
    });

    test("uses root for missing namespace", () => {
      const key = VaultPathUtils.buildCacheKey("list", "secret/app");
      expect(key).toBe("list:secret/app:root");
    });
  });
});
```

### 4. VaultClient (`lib/vault-client.ts`)

**Test:**
- API methods
- Cache integration
- Error handling
- Namespace switching

**Example: `vault-client.test.ts`**
```typescript
import { VaultClient } from "../vault-client";

describe("VaultClient", () => {
  let client: VaultClient;

  beforeEach(() => {
    client = new VaultClient({
      url: "https://vault.example.com",
      token: "hvs.test",
    });
  });

  describe("listSecrets", () => {
    test("returns cached results on second call", async () => {
      const spy = vi.spyOn(client["client"], "request");

      await client.listSecrets("secret/myapp");
      await client.listSecrets("secret/myapp"); // Should use cache

      expect(spy).toHaveBeenCalledTimes(1);
    });

    test("returns empty array for 404", async () => {
      // Mock 404 response
      const result = await client.listSecrets("secret/nonexistent");
      expect(result).toEqual([]);
    });
  });

  describe("writeSecret", () => {
    test("invalidates cache after write", async () => {
      await client.listSecrets("secret/myapp");
      await client.writeSecret("secret/myapp/db", { password: "test" });

      // Cache should be invalidated
      const cacheKey = "secret:secret/myapp:root";
      expect(client["listCache"].has(cacheKey)).toBe(false);
    });
  });

  describe("updateNamespace", () => {
    test("clears cache when namespace changes", async () => {
      await client.listSecrets("secret/myapp");

      client.updateNamespace("dev");

      expect(client["listCache"].size()).toBe(0);
      expect(client["secretCache"].size()).toBe(0);
    });
  });
});
```

### 5. Storage (`lib/storage.ts`)

**Test:**
- Save/load operations
- JSON serialization
- Error handling

## 🧬 Mutation Testing

### What is Mutation Testing?

Mutation testing verifies that your tests are **effective** by:
1. Introducing bugs (mutations) in your code
2. Running your tests
3. Checking if tests catch the mutations

**Example mutations:**
```typescript
// Original code
if (count > 5) { }

// Mutation 1: Boundary change
if (count >= 5) { }  // Should tests catch this?

// Mutation 2: Operator change
if (count < 5) { }   // Should tests catch this?

// Mutation 3: Constant change
if (count > 6) { }   // Should tests catch this?
```

### Mutation Score

```
Mutation Score = (Killed Mutations / Total Mutations) × 100%
```

**Target**: 80%+ mutation score for critical code

### Running Mutation Tests

```bash
# Run mutation testing
pnpm test:mutation

# Mutation testing on specific file
pnpm test:mutation --mutate="hooks/use-secret-editor.ts"
```

### Interpreting Results

**Survived Mutations** ⚠️:
- Mutations that didn't break tests
- Indicates missing or weak tests
- Add tests to kill these mutations

**Killed Mutations** ✅:
- Mutations caught by tests
- Good test coverage

**Timeout Mutations** ⏱️:
- Tests took too long
- May indicate infinite loops

### Configuration

**Focus on:**
- Hooks (high business value)
- Services (complex logic)
- Utilities (many edge cases)

**Exclude:**
- UI components
- Constants
- Types

## 📈 Coverage Goals

### Line Coverage
- **Overall**: 80%+
- **Hooks**: 90%+
- **Services**: 90%+
- **Utilities**: 85%+
- **VaultClient**: 85%+

### Mutation Coverage
- **Critical paths**: 90%+
- **Hooks**: 85%+
- **Services**: 85%+
- **Utilities**: 80%+

## 🚀 Running Tests

### During Development

```bash
# Watch mode (recommended)
pnpm test --watch

# Run specific test file
pnpm test use-secret-editor

# Run tests for changed files only
pnpm test --changed
```

### Before Commit

```bash
# Run all tests
pnpm test

# Check coverage
pnpm test:coverage

# View coverage report
open coverage/index.html
```

### CI Pipeline

```bash
# CI mode (no watch)
pnpm test --run

# Coverage with threshold enforcement
pnpm test:coverage --coverage.thresholds.lines=80
```

## 🎨 Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ✅ GOOD: Tests behavior
test("displays error message when save fails", async () => {
  const { result } = renderHook(() => useSecretEditor("secret/test"));

  await act(async () => {
    await expect(result.current.handleSave()).rejects.toThrow();
  });

  // Verify error is shown to user
});

// ❌ BAD: Tests implementation
test("sets error state to true", async () => {
  const { result } = renderHook(() => useSecretEditor("secret/test"));

  await act(async () => {
    await result.current.handleSave();
  });

  expect(result.current.error).toBe(true); // Internal detail
});
```

### 2. Use Descriptive Test Names

```typescript
// ✅ GOOD
test("caches list results for 5 minutes", () => {});
test("invalidates cache when secret is deleted", () => {});
test("returns empty array when path does not exist", () => {});

// ❌ BAD
test("cache works", () => {});
test("delete test", () => {});
test("test1", () => {});
```

### 3. Arrange-Act-Assert Pattern

```typescript
test("example", () => {
  // Arrange: Set up test data
  const cache = new VaultCache({ defaultTTL: 1000 });

  // Act: Perform action
  cache.set("key", "value");

  // Assert: Verify result
  expect(cache.get("key")).toBe("value");
});
```

### 4. Mock External Dependencies

```typescript
// Mock VaultClient for hook tests
vi.mock("@/lib/vault-client", () => ({
  VaultClient: vi.fn(() => ({
    readSecret: vi.fn(() => Promise.resolve({ data: { test: "value" } })),
    writeSecret: vi.fn(() => Promise.resolve()),
  })),
}));
```

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  vi.clearAllMocks(); // Clear mock history
  localStorage.clear(); // Clear localStorage
});
```

## 🔄 Testing Workflow

### Adding New Feature

1. **Write test first** (TDD optional)
2. **Implement feature**
3. **Run tests**: `pnpm test`
4. **Check coverage**: `pnpm test:coverage`
5. **Run mutations**: `pnpm test:mutation`
6. **Achieve 80%+ coverage**

### Fixing Bugs

1. **Write failing test** that reproduces bug
2. **Fix the code**
3. **Verify test passes**
4. **Check coverage didn't drop**

## 📚 Examples

See example test files:
- `hooks/__tests__/use-secret-editor.test.ts`
- `lib/services/__tests__/vault-cache.test.ts`
- `lib/utils/__tests__/vault-path-utils.test.ts`

## 🎯 Summary

**Test THIS** ✅:
- Hooks → Business logic
- Services → API and caching
- Utilities → Path manipulation, logging
- VaultClient → Vault API integration

**Skip THIS** ❌:
- Components → UI templates
- Pages → Next.js routes
- JSX → Visual structure

**Use THIS**:
- Vitest for unit tests
- React Testing Library for hooks
- Stryker for mutation testing

**Achieve THIS**:
- 80%+ line coverage
- 80%+ mutation coverage
- Fast, reliable tests
- High confidence in logic

---

**Next Steps**:
1. Run `pnpm install` to get dependencies
2. Run `pnpm test` to execute tests
3. Run `pnpm test:coverage` to see coverage
4. Run `pnpm test:mutation` for mutation testing
