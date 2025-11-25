# Vault Navigator

A modern, feature-rich UI for HashiCorp Vault built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

### Core Functionality
- **Token-Based Authentication**: Secure login using Vault tokens
- **Namespace Management**: Easy switching between multiple namespaces
- **Secret Browser**: Tree-view navigation with folder expansion
- **Secret Editor**: Read, create, update, and delete secrets
- **Advanced Search**: Search secrets by name or content
- **Multi-Configuration**: Save and manage multiple Vault connections
- **Built-in CORS Proxy**: No CORS configuration needed on Vault server

### UX/UI Features
- **Modern Design**: Clean, professional interface with Tailwind CSS
- **Smooth Animations**: Powered by Framer Motion
- **Responsive Layout**: Works seamlessly on desktop and mobile
- **Real-time Updates**: Instant feedback for all operations
- **Copy to Clipboard**: Quick copy functionality for secret values
- **Form & JSON Modes**: Edit secrets using forms or raw JSON

## Getting Started

### Prerequisites
- Node.js 18+ (recommended)
- A running HashiCorp Vault instance
- Vault token with appropriate permissions

### Installation

1. Clone the repository or navigate to the project directory

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### First Time Setup

1. Click "Configure Connection" on the welcome page
2. Add your Vault configuration:
   - **Configuration Name**: A friendly name (e.g., "Production Vault")
   - **Vault URL**: Your Vault server URL (e.g., `https://vault.example.com`)
   - **Vault Token**: Your authentication token
   - **Namespaces**: Comma-separated list of namespaces (optional)
3. Click the configuration card to connect
4. Start browsing and managing your secrets!

## Usage

### Switching Namespaces
Click the namespace dropdown in the header to switch between configured namespaces or use the root namespace.

### Browsing Secrets
- Click on folders to expand and navigate the secret tree
- Click on secrets to view their contents
- Use the search bar for advanced search across all secrets

### Editing Secrets
1. Select a secret from the browser
2. Click "Edit" to enter edit mode
3. Choose between Form or JSON mode
4. Make your changes
5. Click "Save" to commit changes

### Managing Configurations
- Navigate to the "Configurations" page
- Add, edit, or delete Vault connections
- Switch between configurations by clicking on them

## Architecture

- **Frontend**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **API Client**: Axios
- **Icons**: Lucide React
- **CORS Solution**: Built-in Next.js API proxy (no Vault CORS config needed!)

## Security Notes

- Tokens are stored in browser localStorage
- All communication with Vault uses HTTPS
- Tokens are never logged or exposed in the UI
- Consider using short-lived tokens and rotating them regularly

## Development

### Project Structure
```
vault-navigator/
├── app/                    # Next.js app router pages
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── config-manager.tsx
│   ├── header.tsx
│   ├── secret-browser.tsx
│   ├── secret-editor.tsx
│   └── secret-search.tsx
├── contexts/             # React contexts
├── lib/                  # Utilities and API client
│   ├── vault-client.ts  # Vault API client
│   ├── storage.ts       # LocalStorage wrapper
│   └── types.ts         # TypeScript types
└── public/              # Static assets
```

### Building for Production

```bash
pnpm build
pnpm start
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
