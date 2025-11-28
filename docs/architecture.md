# Architecture

Architecture decisions, design patterns, and technical rationale for Vault Navigator.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  React Components (Presentation)                    │    │
│  │  - SecretBrowser, SecretEditor, ConfigManager      │    │
│  └───────────────────┬────────────────────────────────┘    │
│                      │                                       │
│  ┌───────────────────▼────────────────────────────────┐    │
│  │  Custom Hooks (Business Logic)                      │    │
│  │  - useSecretEditor, useConfigForm                  │    │
│  └───────────────────┬────────────────────────────────┘    │
│                      │                                       │
│  ┌───────────────────▼────────────────────────────────┐    │
│  │  VaultClient (API Layer)                           │    │
│  │  - listSecrets(), readSecret(), writeSecret()      │    │
│  └───────────────────┬────────────────────────────────┘    │
└────────────────────┬─┘                                      │
                     │ HTTP (localhost:3000/api/vault)        │
┌────────────────────▼─────────────────────────────────────┐
│              Next.js API Proxy                            │
│              /app/api/vault/[...path]/route.ts           │
│              - Forwards requests to Vault                │
│              - Adds headers (token, namespace)           │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTPS (server-to-server)
┌────────────────────▼─────────────────────────────────────┐
│              HashiCorp Vault Server                       │
│              - KV v2 Secrets Engine                      │
└──────────────────────────────────────────────────────────┘
```

## 🎯 Design Principles

### SOLID Principles

#### Single Responsibility (S)
**Every module has one job:**
- Components: Render UI only
- Hooks: Manage state and business logic
- Utilities: Perform specific operations
- Services: Handle external APIs

**Example:**
```typescript
// ✅ GOOD: Single responsibility
// useSecretEditor - manages secret state
// SecretEditor - renders UI
// VaultClient - handles API calls

// ❌ BAD: Multiple responsibilities
// SecretEditor does everything (render + API + state)
```

#### Open/Closed (O)
**Open for extension, closed for modification:**
- Components accept props for customization
- Hooks accept options for configuration
- No need to modify existing code to add features

**Example:**
```typescript
// ✅ Extensible through props
<ErrorBoundary
  fallback={(error, reset) => <CustomError />}
  onError={(error) => trackError(error)}
/>
```

#### Liskov Substitution (L)
**Subtypes must be substitutable:**
- TypeScript interfaces ensure contracts
- Components follow consistent prop patterns

#### Interface Segregation (I)
**Clients shouldn't depend on unused interfaces:**
- Props interfaces are minimal and focused
- Hooks return only what's needed

**Example:**
```typescript
// ✅ GOOD: Focused interface
interface SecretViewerProps {
  secret: Secret;
  onCopy: (key: string) => void;
}

// ❌ BAD: Bloated interface
interface SecretViewerProps {
  secret: Secret;
  onCopy: (key: string) => void;
  onEdit: () => void;      // Not used in viewer
  onDelete: () => void;    // Not used in viewer
}
```

#### Dependency Inversion (D)
**Depend on abstractions, not concretions:**
- Components depend on hooks (abstraction)
- Hooks depend on VaultClient interface
- Easy to mock for testing

### DRY (Don't Repeat Yourself)
**No duplicate code:**
- Centralized constants (`lib/constants/`)
- Shared utilities (`lib/utils/`)
- Reusable hooks (`hooks/`)
- Common components (`components/ui/`)

### KISS (Keep It Simple, Stupid)
**Simplicity over cleverness:**
- Clear, readable code
- Straightforward control flow
- No over-engineering

## 🔧 Technology Choices

### State Management: Custom Hooks (Not Redux/Zustand)

**Why custom hooks?**
- ✅ **Simpler**: No boilerplate, no store setup
- ✅ **More testable**: Isolated logic, easy to mock
- ✅ **No global state needed**: This app doesn't need cross-component state
- ✅ **Better type safety**: TypeScript works naturally with hooks
- ✅ **Easier to understand**: Less abstraction, clearer flow

**When to use Redux/Zustand:**
- ❌ Complex shared state across many components
- ❌ Time-travel debugging needed
- ❌ Multiple sources of truth

**Our app:**
- ✅ Simple state: VaultContext for auth, hooks for features
- ✅ No complex state synchronization
- ✅ Perfect fit for React hooks

### CORS Solution: Next.js API Routes (Not CORS Configuration)

**Why API proxy?**
- ✅ **Zero Vault configuration**: No admin access needed
- ✅ **Built-in**: Part of Next.js, no separate proxy server
- ✅ **Transparent**: Code works the same way
- ✅ **Secure**: Tokens in headers, not URLs
- ✅ **Works everywhere**: Dev, staging, production

**How it works:**
```
Browser → /api/vault → Vault Server
(same origin) (server-to-server, no CORS)
```

**Alternative (not chosen):**
- ❌ Configure Vault CORS: Requires admin access
- ❌ Separate proxy: Extra infrastructure
- ❌ Browser extension: Not portable

### Caching: VaultCache (Not React Query)

**Why custom cache?**
- ✅ **Lightweight**: ~150 lines, no dependencies
- ✅ **Custom TTL**: Different TTL for lists vs secrets
- ✅ **Pattern invalidation**: Smart cache invalidation
- ✅ **Simple API**: get(), set(), invalidate()

**When to use React Query:**
- ❌ Complex data fetching patterns
- ❌ Optimistic updates
- ❌ Background refetching
- ❌ Infinite queries

**Our needs:**
- ✅ Simple TTL-based caching
- ✅ Manual invalidation on write/delete
- ✅ No background refetch needed

**Implementation:**
```typescript
// lib/services/vault-cache.ts
class VaultCache<T> {
  get(key: string): T | null;
  set(key: string, data: T, ttl?: number): void;
  invalidate(key: string): void;
  invalidatePattern(pattern: RegExp): void;
}

// Usage
const cache = new VaultCache<Secret>({ defaultTTL: 2 * 60 * 1000 });
cache.set("secret:myapp/db", secretData);
cache.invalidatePattern(/^secret:myapp/); // Invalidate folder
```

### Toast Notifications: Sonner (Not react-hot-toast)

**Why Sonner?**
- ✅ **Beautiful**: Modern, animated toasts
- ✅ **Lightweight**: Minimal bundle size
- ✅ **Simple API**: `toast.success()`, `toast.error()`
- ✅ **Rich features**: Promise toasts, action buttons
- ✅ **Accessible**: ARIA labels, keyboard navigation

**Usage:**
```typescript
toast.success("Secret saved successfully");
toast.error("Failed to save secret");
toast.promise(
  saveSecret(),
  {
    loading: "Saving...",
    success: "Saved!",
    error: "Failed"
  }
);
```

### Animations: Framer Motion (Not CSS Animations)

**Why Framer Motion?**
- ✅ **Declarative**: React-style animation
- ✅ **Powerful**: Complex animations made easy
- ✅ **AnimatePresence**: Exit animations
- ✅ **Layout animations**: Automatic layout transitions

**Usage:**
```typescript
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>
```

### Error Handling: Error Boundaries

**Why Error Boundaries?**
- ✅ **Graceful degradation**: App doesn't crash
- ✅ **Better UX**: Show friendly error messages
- ✅ **Isolated failures**: One component fails, others work
- ✅ **Recovery**: "Try Again" button

**Strategy:**
```typescript
// Wrap major sections, not every component
<ErrorBoundary>
  <SecretBrowser />
</ErrorBoundary>

<ErrorBoundary>
  <SecretEditor />
</ErrorBoundary>
```

**Not this:**
```typescript
// ❌ Too granular
<ErrorBoundary>
  <Button />
</ErrorBoundary>
```

### Logging: Custom Logger (Not console)

**Why custom logger?**
- ✅ **Environment-aware**: Debug logs only in development
- ✅ **Consistent format**: Structured logging
- ✅ **Easy to extend**: Add remote logging later
- ✅ **Type-safe**: TypeScript support

**Implementation:**
```typescript
// lib/utils/logger.ts
class Logger {
  debug(message: string, data?: unknown): void {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEBUG] ${message}`, data);
    }
  }

  error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, error);
  }
}
```

## 🎨 Component Architecture

### Composition over Inheritance

**We use component composition:**
```typescript
// ✅ GOOD: Composition
<SecretEditor>
  {isEditing ? (
    mode === "form" ? (
      <SecretFormEditor />
    ) : (
      <SecretJsonEditor />
    )
  ) : (
    <SecretViewer />
  )}
</SecretEditor>

// ❌ BAD: Inheritance
class SecretEditor extends BaseEditor {
  // Complex inheritance hierarchy
}
```

### Container/Presentation Pattern

**Containers (Hooks) handle logic:**
```typescript
// hooks/use-secret-editor.ts
export function useSecretEditor(path: string) {
  // All business logic here
  const [secret, setSecret] = useState<Secret | null>(null);
  const handleSave = async () => { /* ... */ };
  return { secret, handleSave };
}
```

**Presentations (Components) handle UI:**
```typescript
// components/secret-editor.tsx
export function SecretEditor({ path }: Props) {
  const { secret, handleSave } = useSecretEditor(path);
  return <Card>...</Card>;
}
```

### Controlled Components

**All form inputs are controlled:**
```typescript
// ✅ GOOD: Controlled
<Input
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
/>

// ❌ BAD: Uncontrolled
<Input defaultValue={name} ref={inputRef} />
```

## 🔄 Data Flow

### Unidirectional Data Flow

```
User Action → Event Handler → State Update → Re-render
```

**Example:**
```typescript
// 1. User clicks button
<Button onClick={handleSave}>Save</Button>

// 2. Event handler called
const handleSave = async () => {
  // 3. API call
  await client.writeSecret(path, data);

  // 4. State update
  setSecret(newSecret);

  // 5. Component re-renders
};
```

### State Placement

**State lives in the lowest common ancestor:**
```typescript
// ✅ GOOD: State in parent
function Home() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  return (
    <>
      <SecretBrowser onSelect={setSelectedPath} />
      <SecretEditor path={selectedPath} />
    </>
  );
}

// ❌ BAD: Duplicate state
function Home() {
  return (
    <>
      <SecretBrowser /> {/* Has its own selectedPath */}
      <SecretEditor />  {/* Has its own selectedPath */}
    </>
  );
}
```

## 🗂️ File Organization Strategy

### Why This Structure?

**`/hooks` for all business logic:**
- Single source of truth for logic
- Easy to test
- Reusable across components

**`/components` flat structure:**
- Easy to find components
- Sub-folders only for component groups
- No deep nesting

**`/lib` for shared code:**
- Utilities that don't use React
- Services (VaultClient, VaultCache)
- Types and constants

**`/contexts` for global state:**
- Only VaultContext (authentication)
- Minimal global state

## 🚀 Performance Considerations

### Code Splitting
- Next.js automatic code splitting
- Route-based splitting (pages)
- Component lazy loading not needed (small app)

### Memoization
- Used sparingly, only when needed
- `useCallback` for event handlers passed to children
- `useMemo` for expensive computations
- `memo()` for frequently re-rendered components

**Example:**
```typescript
// components/secret-browser.tsx
const TreeNodeComponent = memo(({ node, onToggle }: Props) => {
  // Prevents re-render of entire tree
});
```

### Caching Strategy
- **Lists**: 5 minute TTL (low change frequency)
- **Secrets**: 2 minute TTL (higher change frequency)
- **Invalidation**: On write/delete operations

## 🔐 Security Considerations

### Token Storage
- Stored in localStorage (user choice)
- Never in URLs or cookies
- Only sent in request headers

### CORS Proxy
- Token never exposed to browser directly
- Server-side requests to Vault
- Next.js API validates and forwards

### Input Validation
- TypeScript for type safety
- Form validation before submission
- Server-side validation in API routes

## 🧪 Testability

### Current State (No Tests Yet)
Code is structured for easy testing:
- Business logic in hooks (easy to test)
- Pure utility functions (easy to test)
- Components accept props (easy to mock)

### Future Testing Strategy
1. **Unit tests** for utilities and hooks
2. **Integration tests** for components
3. **E2E tests** for critical flows

**Example test structure:**
```typescript
// hooks/use-secret-editor.test.ts
describe("useSecretEditor", () => {
  it("loads secret on mount", async () => {
    const { result } = renderHook(() => useSecretEditor("secret/test"));
    await waitFor(() => expect(result.current.secret).toBeTruthy());
  });
});
```

## 📊 Decision Log

### Major Decisions

| Decision | Chosen | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| State Management | Custom Hooks | Redux, Zustand | Simpler, no global state needed |
| CORS Solution | Next.js API | CORS config | No Vault admin needed |
| Caching | VaultCache | React Query | Lightweight, custom TTL |
| Toasts | Sonner | react-hot-toast | Better animations, smaller |
| Animations | Framer Motion | CSS, GSAP | Declarative, React-friendly |
| Styling | Tailwind + shadcn/ui | CSS Modules, Styled Components | Fast development, consistent |
| Forms | Controlled components | react-hook-form | Simple forms, no need for library |

### Future Considerations

**When the app grows:**
- Consider React Query if data fetching becomes complex
- Consider form library if forms get complex
- Consider state management if global state is needed
- Add testing infrastructure

**Current philosophy:**
- Start simple, add complexity when needed
- No premature optimization
- Clean, readable code over clever solutions

---

**Related Docs:**
- [Development Guide](./development.md) - Coding conventions and patterns
- [Project Summary](./project-summary.md) - High-level overview
