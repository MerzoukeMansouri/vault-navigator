# CORS Solution - How It Works

## The Problem
When you try to access Vault from a browser at `http://localhost:3000` to `https://vault.factory.adeo.cloud`, browsers block the request due to **CORS (Cross-Origin Resource Sharing)** policy.

```
❌ Browser (localhost:3000) → Vault (vault.factory.adeo.cloud)
   BLOCKED: "No 'Access-Control-Allow-Origin' header"
```

## The Simple Solution
We use **Next.js API Routes** as a built-in proxy. Your browser talks to Next.js (same origin), and Next.js talks to Vault (server-to-server, no CORS!).

```
✅ Browser → Next.js API (/api/vault) → Vault Server
   Same origin!    Server-to-server (no CORS needed)
```

## What Was Changed

### 1. Created API Proxy Route
**File**: `app/api/vault/[...path]/route.ts`

This catches all requests to `/api/vault/*` and forwards them to your actual Vault server.

### 2. Updated Vault Client
**File**: `lib/vault-client.ts`

Changed from:
```typescript
baseURL: config.url  // Direct to Vault (CORS issues)
```

To:
```typescript
baseURL: "/api/vault"  // Through our proxy (no CORS!)
```

## Benefits

✅ **No Vault Configuration Needed** - You don't need admin access to configure CORS on Vault
✅ **No Separate Proxy Server** - Built into Next.js
✅ **Transparent** - Your code works the same way
✅ **Secure** - Tokens stay in request headers, not exposed in URLs

## How to Use

Just start the app normally:
```bash
npm run dev
```

That's it! The proxy is automatically running at `http://localhost:3000/api/vault`

## For Production

When you deploy to production:
1. The proxy deploys with your app
2. Works the same way
3. No additional configuration needed

## Technical Details

- Browser makes requests to `/api/vault/v1/secret/metadata` (same origin)
- Next.js API route receives the request
- Extracts Vault URL and token from headers
- Makes server-side request to real Vault
- Returns response to browser
- Browser never directly calls Vault (no CORS issue!)
