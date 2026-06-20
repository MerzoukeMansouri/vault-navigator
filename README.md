# Vault Navigator

A modern, production-ready UI for HashiCorp Vault built with Next.js 14, TypeScript, and Tailwind CSS. Features enterprise-grade code quality following SOLID principles, comprehensive error handling, and an exceptional user experience.

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![Code Quality](https://img.shields.io/badge/Code%20Quality-Reports-purple)](https://merzoukemansouri.github.io/vault-navigator/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## ✨ Features

### Core Functionality
- 🔐 **Multiple Authentication Methods**:
  - Token-based authentication
  - **OIDC/SSO authentication** with automatic namespace support
  - Automatic token detection from clipboard
- 🎯 **Automatic Token Detection**: Intelligently detects Vault tokens from clipboard and offers quick configuration updates
- 📁 **Namespace Management**: Seamless switching between multiple namespaces with OIDC integration
- 🌳 **Secret Browser**: Interactive tree-view navigation with folder expansion, lazy loading, favorites/pins, and one-click path copy
- ✏️ **Secret Editor**: Full CRUD operations (Create, Read, Update, Delete) for secrets
- 🔍 **Advanced Search**: Powerful search across all secrets by name or content with result highlighting
- ⚙️ **Multi-Configuration**: Save and manage multiple Vault connections with connection testing
- 🌐 **Built-in CORS Proxy**: Zero CORS configuration needed on Vault server
- 💾 **Smart Caching**: Intelligent caching with configurable TTL for optimal performance

### User Experience
- 🎨 **Modern Design**: Clean, professional interface built with Tailwind CSS
- ✨ **Smooth Animations**: Delightful transitions powered by Framer Motion
- 📱 **Responsive Layout**: Works flawlessly on desktop, tablet, and mobile
- ⚡ **Real-time Updates**: Instant visual feedback for all operations
- 📋 **Copy to Clipboard**: One-click copy for any secret value or path with visual confirmation
- 🔄 **Dual Edit Modes**: Edit secrets using intuitive forms or raw JSON
- 🎭 **Custom Dialogs**: Beautiful confirmation dialogs replace browser alerts
- 🔔 **Smart Notifications**: Professional error and success messages
- 🌈 **Environment Color Coding**: Icons and secret cards are color-coded by environment (`dev` green, `sit` blue, `qa/uat` purple, `pre` orange, `prod` red) with a legend in the sidebar
- ⭐ **Favorites / Pins**: Pin any secret or folder for quick access from the top of the tree, persisted across sessions

### Developer Experience
- 🏗️ **Clean Architecture**: SOLID principles, DRY, and separation of concerns
- 🧩 **Modular Components**: Highly reusable, testable components and hooks
- 🎯 **Type Safety**: 100% TypeScript with strict mode
- 📝 **Professional Logging**: Environment-aware logging (debug only in development)
- 🧪 **Testable Code**: Business logic isolated in custom hooks
- 📦 **Zero Bundle Bloat**: Optimized build with code splitting

## 🚀 Getting Started

### Prerequisites
- **Node.js** 24+ — exact version pinned in `.node-version` (auto-picked by `fnm`; `nvm` users run `nvm install` manually)
- **pnpm** 8+ (or npm 9+)
- **HashiCorp Vault** instance (local or remote)
- **Vault Token** with appropriate KV v2 permissions

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd vault-navigator

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open your browser
open http://localhost:3000
```

### First Time Setup

#### Option 1: Manual Configuration
1. Click **"Configure Connection"** on the welcome page
2. Fill in your Vault details:
   - **Configuration Name**: `Production Vault`
   - **Vault URL**: `https://vault.example.com`
   - **Vault Token**: `hvs.XXXXXXXXXXXXXX`
   - **Namespace**: `my-namespace` (optional, leave empty for root)
3. Click **"Test Connection"** to verify
4. Click **"Save"** to store the configuration
5. Click the configuration card to connect
6. Start browsing your secrets! 🎉

#### Option 2: Automatic Token Detection
1. Copy a Vault token to your clipboard (must start with `hvs.`)
2. Open Vault Navigator - it will automatically detect the token
3. Choose to update an existing configuration or create a new one
4. Fill in remaining details and you're done!

#### Option 3: OIDC Authentication (Enterprise/SSO)
1. Navigate to **"Configurations"** page
2. Find the **"Login with OIDC"** card
3. Select your Vault environment (Production/Non-Production)
4. Enter your namespace (optional, e.g., `adeo/solution-offer-design`)
5. Click **"Login with OIDC"**
6. You'll be redirected to your organization's login page
7. After authentication, you're automatically connected! 🎉

**OIDC Setup Requirements:**
- Set `NEXT_PUBLIC_APP_URL` in `.env.local` (see `.env.example`)
- Your app's redirect URI must be registered in Vault's OIDC role configuration
- Example redirect URI: `https://your-app.com/auth/vault/callback`

## 📚 Documentation

Comprehensive guides and references for Vault Navigator:

- **[Quick Start Guide](docs/quickstart.md)** - Get up and running in 5 minutes with step-by-step instructions
- **[Development Guide](docs/development.md)** - Coding conventions, patterns, and best practices for contributing
- **[Architecture](docs/architecture.md)** - Design decisions, technology choices, and architectural patterns
- **[Testing Strategy](docs/testing-strategy.md)** - Comprehensive testing approach for hooks, services, and utilities
- **[Project Summary](docs/project-summary.md)** - High-level overview and feature summary
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues, solutions, and debugging tips

## 📖 Usage Guide

### Browsing Secrets
- **Expand Folders**: Click on folder icons to expand and navigate
- **View Secrets**: Click on secret names to view contents
- **Search**: Use the search bar to find secrets by name or content
- **Copy Path**: Hover any node to reveal a copy button — click to copy its Vault path to clipboard
- **Pin / Unpin**: Hover any node and click the star icon to pin it; pinned items appear at the top of the tree and persist across sessions
- **Environment Colors**: Icons and secret detail cards are automatically color-coded based on the environment segment in the path (`dev`, `sit`, `qa`/`uat`, `pre`/`prep`, `prod`)

### Managing Secrets

#### Create New Secret
1. Click **"Create Secret"** button
2. Enter secret path (e.g., `myapp/config`)
3. Add key-value pairs in Form mode or paste JSON
4. Click **"Create"**

#### Edit Secret
1. Select a secret from the browser
2. Click **"Edit"** button
3. Switch between **Form** or **JSON** mode
4. Make your changes
5. Click **"Save"**

#### Delete Secret
1. Select a secret
2. Click **"Delete"** button
3. Confirm deletion in the dialog

### Managing Configurations
- Navigate to **"Configurations"** page via header menu
- **Add**: Click "Add Configuration" button
- **Edit**: Click edit icon on any configuration card
- **Delete**: Click delete icon (with confirmation)
- **Switch**: Click any configuration card to activate it
- **Test**: Use "Test Connection" to validate the token **and** namespace combination — calls `GET /v1/auth/token/lookup-self` so authentication is fully verified, not just reachability

### Token Rotation
When your token expires or you get a new one:
1. Copy the new token to your clipboard
2. Vault Navigator will detect it automatically
3. Select which configuration to update
4. Your connection is refreshed instantly

No manual editing required! 🎯

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5+ (Strict mode)
- **Styling**: Tailwind CSS 3+
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **State Management**: React Context + Custom Hooks
- **Caching**: Custom TTL-based cache service

### Design Patterns
- ✅ **SOLID Principles**: Single Responsibility, Open/Closed, etc.
- ✅ **Clean Code**: DRY, KISS, separation of concerns
- ✅ **Custom Hooks**: Business logic isolated and testable
- ✅ **Component Composition**: Small, focused, reusable components
- ✅ **Type Safety**: Full TypeScript coverage

### Project Structure
```
vault-navigator/
├── app/                          # Next.js app router
│   ├── api/vault/[...path]/     # Vault API proxy
│   ├── config/                   # Config page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── components/                   # React components
│   ├── config/                   # Config-related components
│   │   ├── config-form.tsx       # Configuration form
│   │   └── config-card.tsx       # Configuration card
│   ├── secret/                   # Secret-related components
│   │   ├── secret-viewer.tsx     # Read-only secret view
│   │   ├── secret-form-editor.tsx # Form-based editor
│   │   └── secret-json-editor.tsx # JSON-based editor
│   ├── ui/                       # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── confirm-dialog.tsx    # Custom confirmation dialog
│   │   └── ...
│   ├── config-manager.tsx        # Config management
│   ├── env-legend.tsx            # Environment color legend
│   ├── header.tsx                # App header
│   ├── secret-browser.tsx        # Tree navigation (favorites, copy path, env colors)
│   ├── secret-editor.tsx         # Secret editor
│   └── secret-search.tsx         # Search functionality
│
├── contexts/                     # React contexts
│   └── vault-context.tsx         # Vault state management
│
├── hooks/                        # Custom React hooks
│   ├── use-config-form.ts        # Config form logic
│   ├── use-config-list.ts        # Config list management
│   ├── use-confirm.ts            # Confirmation dialogs
│   ├── use-secret-editor.ts      # Secret editor logic
│   └── use-token-detection.tsx   # Token detection
│
├── lib/                          # Core utilities
│   ├── constants/                # Application constants
│   │   └── index.ts              # All constants
│   ├── services/                 # Business services
│   │   └── vault-cache.ts        # Caching service
│   ├── utils/                    # Utility functions
│   │   ├── env-utils.ts          # Environment detection and color map
│   │   ├── logger.ts             # Logging utility
│   │   ├── tree-utils.ts         # Tree operations
│   │   └── vault-path-utils.ts   # Path utilities
│   ├── storage.ts                # LocalStorage wrapper
│   ├── types.ts                  # TypeScript types
│   ├── utils.ts                  # General utilities
│   └── vault-client.ts           # Vault API client
│
└── public/                       # Static assets
```

### Key Components

#### VaultClient
Handles all Vault API communication with intelligent caching:
- Connection testing
- Secret CRUD operations
- Namespace management
- List operations with caching
- Search functionality

#### Custom Hooks
Business logic separated into testable hooks:
- `useConfigForm`: Form state and validation
- `useConfigList`: Configuration CRUD
- `useSecretEditor`: Secret editing logic
- `useConfirm`: Promise-based confirmations
- `useTokenDetection`: Clipboard monitoring

#### Caching System
Intelligent caching with TTL:
- **List Cache**: 5 minutes
- **Secret Cache**: 2 minutes
- Automatic invalidation on updates
- Pattern-based cache clearing

## 🔒 Security

### Token Security
- ✅ Tokens stored in browser `localStorage` only
- ✅ Tokens never logged or exposed in console
- ✅ HTTPS required for production
- ✅ No token transmission to third parties

### Best Practices
1. **Use short-lived tokens**: Configure Vault with limited TTL
2. **Rotate regularly**: Use automatic token detection feature
3. **Limit permissions**: Use tokens with minimal required scope
4. **Don't commit secrets**: Never commit `.env` or config files
5. **HTTPS only**: Always use HTTPS in production

### CORS Solution
Built-in Next.js API proxy eliminates CORS issues:
- Browser → Next.js API (`/api/vault`)
- Next.js → Vault Server (server-to-server, no CORS)
- No Vault configuration required!

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev          # Start dev server (localhost:3000)

# Building
pnpm build        # Production build
pnpm start        # Start production server

# Testing
pnpm test         # Run unit tests (watch mode)
pnpm test:ui      # Run tests with UI
pnpm test:coverage      # Generate coverage report
pnpm test:mutation      # Run mutation testing

# Code Quality
pnpm lint         # Run ESLint
pnpm analyze      # Run SonarJS code analysis
```

### Code Quality Reports

View automated code quality analysis at **[Code Quality Reports](https://merzoukemansouri.github.io/vault-navigator/)**

Our CI pipeline automatically analyzes code quality on every push using SonarJS rules:
- **Cognitive Complexity**: Measures code understandability (threshold: ≤10)
- **Cyclomatic Complexity**: Measures code paths (threshold: ≤10)
- **File Size**: Maximum 250 lines per file
- **Function Size**: Maximum 50 lines per function
- **Code Duplication**: Detects duplicate strings and identical functions
- **Code Smells**: Identifies maintainability issues

Reports are deployed to GitHub Pages and updated automatically with each CI run.

### Environment Variables

Create a `.env.local` file for local development:

```env
# Optional: Default Vault URL
NEXT_PUBLIC_DEFAULT_VAULT_URL=https://vault.example.com

# Optional: Enable debug logging
NEXT_PUBLIC_DEBUG=true
```

### Code Quality Standards

This project follows strict code quality standards:

- ✅ **TypeScript Strict Mode**: Full type safety
- ✅ **ESLint**: Code linting with Next.js rules
- ✅ **SOLID Principles**: Clean architecture
- ✅ **DRY**: No code duplication
- ✅ **Single Responsibility**: Focused modules
- ✅ **Custom Hooks**: Testable business logic

### Testing Strategy

Comprehensive testing focused on **business logic**, not UI:

**What We Test:**
- ✅ **Custom Hooks** - State management and business logic
- ✅ **Services** - VaultCache, VaultClient
- ✅ **Utilities** - Path utils, logger, tree utils
- ✅ **Storage** - LocalStorage wrapper

**What We Skip:**
- ❌ **UI Components** - Visual rendering (manual QA)
- ❌ **Pages** - Next.js routes
- ❌ **JSX Templates** - Presentation layer

**Testing Tools:**
- **Vitest** - Fast, modern test runner
- **React Testing Library** - Hook testing
- **Stryker Mutator** - Mutation testing for code quality

**Coverage Goals:**
- Overall: 80%+
- Hooks: 90%+
- Services: 90%+
- Utilities: 85%+

See [Testing Strategy](docs/testing-strategy.md) for complete documentation.

### Recent Improvements

#### Phase 1 (Core Refactoring)
- ✅ Centralized constants and configuration
- ✅ Professional logging system
- ✅ Path utilities (DRY)
- ✅ Generic cache service
- ✅ Tree manipulation utilities
- ✅ Refactored VaultClient

#### Phase 2 (Component Breakdown)
- ✅ Extracted custom hooks (4 new hooks)
- ✅ Created reusable components (6 new components)
- ✅ ConfigManager: 343 → 130 lines (62% reduction)
- ✅ SecretEditor: 333 → 225 lines (32% reduction)
- ✅ Custom ConfirmDialog (replaced browser alerts)

#### Phase 3 (UX & Environment Awareness)
- ✅ **Secret Browser — Favorites/Pins**: star any secret or folder; pinned items surface at the top and persist in `localStorage`
- ✅ **Secret Browser — Copy Path**: hover-reveal copy button on every tree node
- ✅ **Environment Color Coding**: tree icons and secret detail cards colored by env segment (`dev` / `sit` / `qa`/`uat` / `pre` / `prod`); legend shown at sidebar bottom
- ✅ **Test Connection**: now validates token + namespace via `GET /v1/auth/token/lookup-self` (previously called the unauthenticated `/sys/health` endpoint)
- ✅ **Config URL cleanup**: `?token=&url=&namespace=` query params stripped from the browser URL after first use via `router.replace`
- ✅ **Config deduplication**: URL comparison normalized to hostname to avoid false mismatches on trailing slashes

See `CLEAN_CODE_PLAN.md`, `REFACTORING_SUMMARY.md`, and `PHASE2_SUMMARY.md` for detailed documentation.

## 📋 Requirements

### Vault Requirements
- **KV Secrets Engine**: Version 2 (mounted at `secret/` by default)
- **Token Permissions**: Minimum required capabilities:
  ```hcl
  # List secrets
  path "secret/metadata/*" {
    capabilities = ["list", "read"]
  }

  # Read secrets
  path "secret/data/*" {
    capabilities = ["read"]
  }

  # Create/Update secrets
  path "secret/data/*" {
    capabilities = ["create", "update"]
  }

  # Delete secrets
  path "secret/metadata/*" {
    capabilities = ["delete"]
  }
  ```

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern browsers with ES2020 support

## 🚀 Deployment

### Production Build

```bash
# Build optimized production bundle
pnpm build

# Start production server
pnpm start
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Deploy to Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Follow** the existing code style and patterns
4. **Test** your changes thoroughly
5. **Commit** using conventional commits
6. **Push** to your branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### Code Style
- Use TypeScript strict mode
- Follow existing component patterns
- Extract business logic into custom hooks
- Keep components small and focused
- Add proper TypeScript types
- Use the logger utility for debugging

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- HashiCorp Vault for the excellent secret management platform
- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Framer Motion for smooth animations
- Lucide for beautiful icons

## 📞 Support

- 📖 **Documentation**: See `QUICKSTART.md`, `PROJECT_SUMMARY.md`, and `TROUBLESHOOTING.md`
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-repo/vault-navigator/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-repo/vault-navigator/discussions)

---

**Built with ❤️ for the HashiCorp Vault community**

*Production-ready • Type-safe • Clean Code • SOLID Principles*
