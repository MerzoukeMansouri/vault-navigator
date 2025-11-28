# Development Guide

Complete guide for developing Vault Navigator with conventions, patterns, and best practices.

## 📁 Project Structure

```
vault-navigator/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (Vault proxy)
│   ├── config/            # Configuration page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
│
├── components/            # React Components (Presentational)
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── config/           # Configuration-related components
│   ├── secret/           # Secret management sub-components
│   ├── *-browser.tsx     # Feature components
│   ├── *-editor.tsx      # Feature components
│   └── error-boundary.tsx # Error handling
│
├── hooks/                # Custom React Hooks (Business Logic)
│   ├── use-*.ts         # Feature-specific hooks
│   └── use-*.tsx        # Hooks with JSX (rare)
│
├── contexts/             # React Contexts
│   └── vault-context.tsx # Global Vault state
│
├── lib/                  # Libraries & Utilities
│   ├── constants/       # Application constants
│   ├── services/        # Business logic services
│   ├── utils/          # Utility functions
│   ├── vault-client.ts # Main Vault API client
│   ├── storage.ts      # LocalStorage wrapper
│   └── types.ts        # TypeScript types
│
└── docs/                # Documentation
    ├── quickstart.md
    ├── troubleshooting.md
    ├── project-summary.md
    ├── development.md   # This file
    └── architecture.md
```

## 📝 Naming Conventions

### Files
- **Components**: `PascalCase.tsx` → `SecretEditor.tsx`
- **Hooks**: `kebab-case.ts` → `use-secret-editor.ts`
- **Utilities**: `kebab-case.ts` → `vault-path-utils.ts`
- **Types**: `types.ts` (not `*.types.ts`)
- **Pages**: Next.js convention → `page.tsx`, `layout.tsx`

### Code
- **Components**: `PascalCase` → `SecretEditor`
- **Functions**: `camelCase` → `handleSave`
- **Hooks**: `use` prefix → `useSecretEditor`
- **Constants**: `UPPER_SNAKE_CASE` → `VAULT_CONFIG`
- **Interfaces**: `PascalCase` → `VaultConfig`
- **Types**: `PascalCase` → `EditMode`

## 🎯 Code Patterns

### 1. Separation of Concerns

**Business logic goes in hooks:**
```typescript
// ✅ GOOD: hooks/use-secret-editor.ts
export function useSecretEditor(path: string) {
  const [secret, setSecret] = useState<Secret | null>(null);

  const handleSave = async () => {
    await client.writeSecret(path, data);
    toast.success("Secret saved");
  };

  return { secret, handleSave };
}
```

**Components are presentational only:**
```typescript
// ✅ GOOD: components/secret-editor.tsx
export function SecretEditor({ path }: SecretEditorProps) {
  const { secret, handleSave } = useSecretEditor(path);

  return (
    <Card>
      <Button onClick={handleSave}>Save</Button>
    </Card>
  );
}
```

**❌ BAD: Mixing concerns**
```typescript
// ❌ Don't put business logic in components
export function SecretEditor({ path }: SecretEditorProps) {
  const [secret, setSecret] = useState<Secret | null>(null);

  const handleSave = async () => {
    await client.writeSecret(path, data); // ❌ API call in component
  };
}
```

### 2. Error Handling

**Use toast notifications, not alerts:**
```typescript
// ✅ GOOD
try {
  await handleDelete();
  toast.success("Secret deleted");
} catch (error) {
  toast.error(error instanceof Error ? error.message : "Failed");
}

// ❌ BAD
alert("Secret deleted"); // Don't use browser alerts
```

**Wrap sections in ErrorBoundary:**
```typescript
// ✅ GOOD
<ErrorBoundary>
  <SecretBrowser />
</ErrorBoundary>

// ❌ BAD - no error boundary
<SecretBrowser />
```

### 3. Logging

**Use logger, not console:**
```typescript
// ✅ GOOD
import { logger } from "@/lib/utils/logger";
logger.error("Failed to load secret", error);
logger.debug("Secret loaded", path);

// ❌ BAD
console.log("Secret loaded"); // Don't use console directly
console.error("Failed", error);
```

### 4. Constants

**Use centralized constants:**
```typescript
// ✅ GOOD
import { VAULT_CONFIG } from "@/lib/constants";
const cacheTTL = VAULT_CONFIG.CACHE_TTL.SECRET;

// ❌ BAD
const cacheTTL = 2 * 60 * 1000; // Magic number
```

### 5. User Feedback

**Provide clear, actionable feedback:**
```typescript
// ✅ GOOD
toast.success("Secret saved successfully");
toast.error("Failed to save secret: Invalid JSON format");

// ❌ BAD
toast.success("Success!"); // Too vague
toast.error("Error"); // No context
```

## 🚀 Adding New Features

### Step-by-Step Workflow

#### 1. **Create Custom Hook** (Business Logic)
```bash
# Create hook file
touch hooks/use-my-feature.ts
```

```typescript
// hooks/use-my-feature.ts
import { useState, useCallback } from "react";
import { useVault } from "@/contexts/vault-context";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";

export function useMyFeature() {
  const { client } = useVault();
  const [loading, setLoading] = useState(false);

  const handleAction = useCallback(async () => {
    setLoading(true);
    try {
      // Business logic here
      await client.doSomething();
      toast.success("Action completed");
      logger.info("Action completed");
    } catch (error) {
      logger.error("Action failed", error);
      toast.error("Failed to complete action");
    } finally {
      setLoading(false);
    }
  }, [client]);

  return { loading, handleAction };
}
```

#### 2. **Create Component** (Presentation)
```bash
# Create component file
touch components/my-feature.tsx
```

```typescript
// components/my-feature.tsx
"use client";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useMyFeature } from "@/hooks/use-my-feature";
import { Loader2 } from "lucide-react";

interface MyFeatureProps {
  onComplete?: () => void;
}

export function MyFeature({ onComplete }: MyFeatureProps) {
  const { loading, handleAction } = useMyFeature();

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Feature</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleAction} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Do Something
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### 3. **Add to Page**
```typescript
// app/page.tsx
import { MyFeature } from "@/components/my-feature";
import { ErrorBoundary } from "@/components/error-boundary";

export default function Home() {
  return (
    <ErrorBoundary>
      <MyFeature onComplete={() => console.log("Done!")} />
    </ErrorBoundary>
  );
}
```

## 📦 Import Organization

**Standard import order:**
```typescript
// 1. React & Next.js
import { useState, useCallback } from "react";
import Link from "next/link";

// 2. Third-party libraries
import { toast } from "sonner";
import { motion } from "framer-motion";

// 3. UI Components
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

// 4. Custom components
import { SecretViewer } from "./secret/secret-viewer";

// 5. Hooks
import { useVault } from "@/contexts/vault-context";
import { useSecretEditor } from "@/hooks/use-secret-editor";

// 6. Utilities & Types
import { logger } from "@/lib/utils/logger";
import { VAULT_CONFIG } from "@/lib/constants";
import { Secret } from "@/lib/types";

// 7. Icons (last)
import { Save, Edit2, Trash2 } from "lucide-react";
```

## 🎨 Component Guidelines

### Props Interface
```typescript
// ✅ GOOD: Clear, typed props
interface SecretEditorProps {
  path: string;
  onDeleted?: () => void;
  onSaved?: () => void;
}

export function SecretEditor({ path, onDeleted, onSaved }: SecretEditorProps) {
  // ...
}
```

### Event Handlers
```typescript
// ✅ GOOD: Descriptive names
const handleSave = async () => { };
const handleDelete = async () => { };
const handleCopy = async (key: string) => { };

// ❌ BAD: Generic names
const onClick = () => { };
const doSomething = () => { };
```

### Loading States
```typescript
// ✅ GOOD: Show loading feedback
if (loading) {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
```

### Error States
```typescript
// ✅ GOOD: User-friendly error messages
if (error) {
  return (
    <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20">
      <p className="text-sm text-destructive">{error}</p>
      <Button onClick={retry}>Try Again</Button>
    </div>
  );
}
```

## 🧪 TypeScript Guidelines

### No `any` Types
```typescript
// ✅ GOOD: Properly typed
const handleError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
};

// ❌ BAD: Using any
const handleError = (error: any) => { }; // Don't use any
```

### Use Type Inference
```typescript
// ✅ GOOD: Let TypeScript infer
const [count, setCount] = useState(0); // Infers number

// ❌ BAD: Over-explicit
const [count, setCount] = useState<number>(0); // Unnecessary
```

### Extract Complex Types
```typescript
// ✅ GOOD: Reusable type
export type EditMode = "form" | "json";

export function useEditor() {
  const [mode, setMode] = useState<EditMode>("form");
}

// ❌ BAD: Inline complex types everywhere
const [mode, setMode] = useState<"form" | "json">("form");
```

## 🔧 Utility Guidelines

### Small, Focused Functions
```typescript
// ✅ GOOD: Single responsibility
export class VaultPathUtils {
  static cleanSecretPath(path: string): string {
    return path.startsWith("secret/") ? path.substring(7) : path;
  }

  static joinPaths(...segments: string[]): string {
    return segments.filter(Boolean).join("/");
  }
}
```

### JSDoc Documentation
```typescript
// ✅ GOOD: Document public APIs
/**
 * Cleans a secret path by removing the "secret/" prefix
 * @param path - The path to clean
 * @returns The cleaned path
 * @example
 * cleanSecretPath("secret/myapp/config") // "myapp/config"
 */
static cleanSecretPath(path: string): string {
  // ...
}
```

## 🎯 Best Practices Summary

### DO ✅
- Extract business logic into custom hooks
- Use `logger` for all logging
- Use `toast` for user notifications
- Wrap sections in `ErrorBoundary`
- Use centralized constants
- Write descriptive names
- Add JSDoc to public APIs
- Keep components under 200 lines
- Keep functions under 50 lines

### DON'T ❌
- Mix business logic with presentation
- Use `console.log` or `console.error`
- Use browser `alert()` or `confirm()`
- Use magic numbers or strings
- Use `any` type
- Create giant components (>300 lines)
- Forget error handling
- Ignore TypeScript errors

## 🚀 Quick Reference

### Create New Feature
1. Design the API (what does it do?)
2. Create hook in `hooks/use-feature-name.ts`
3. Create component in `components/feature-name.tsx`
4. Wrap in ErrorBoundary
5. Test and iterate

### Add New Utility
1. Create file in `lib/utils/utility-name.ts`
2. Add JSDoc comments
3. Export as class or functions
4. Import and use via `@/lib/utils/utility-name`

### Add New Constant
1. Add to `lib/constants/index.ts`
2. Group logically with existing constants
3. Add JSDoc comment explaining purpose
4. Use `as const` for type safety

---

**Questions?** Check [Architecture](./architecture.md) for design decisions or [Troubleshooting](./troubleshooting.md) for common issues.
