# Fix OIDC Empty auth_url Issue

## Problem
Vault returns an empty `auth_url` because the app's redirect URI is not in the allowed list.

## Solution

You need to add your application's callback URL to the OIDC role configuration.

### Option 1: Update the OIDC Role (If you have admin access)

```bash
# Set your vault token
export VAULT_TOKEN=$(cat ~/.vault-token)
export VAULT_ADDR="https://vault.factory.adeo.cloud"
export VAULT_NAMESPACE="adeo/solution-offer-design"

# Read current configuration
vault read auth/oidc/role/users -format=json > oidc-role.json

# Update the role with your new redirect URI
vault write auth/oidc/role/users \
  allowed_redirect_uris="https://vault.factory.adeo.cloud/ui/vault/auth/oidc/oidc/callback?namespace=adeo%2Fsolution-offer-design" \
  allowed_redirect_uris="https://vault-internal-vault.factory.adeo.cloud/ui/vault/auth/oidc/oidc/callback?namespace=adeo%2Fsolution-offer-design" \
  allowed_redirect_uris="https://vault-internal.factory.adeo.cloud/ui/vault/auth/oidc/oidc/callback?namespace=adeo%2Fsolution-offer-design" \
  allowed_redirect_uris="https://vault1-prod.factory.adeo.cloud/ui/vault/auth/oidc/oidc/callback?namespace=adeo%2Fsolution-offer-design" \
  allowed_redirect_uris="https://vault2-prod.factory.adeo.cloud/ui/vault/auth/oidc/oidc/callback?namespace=adeo%2Fsolution-offer-design" \
  allowed_redirect_uris="http://localhost:8250/oidc/callback" \
  allowed_redirect_uris="http://localhost:3000/auth/vault/callback" \
  allowed_redirect_uris="https://your-production-domain.com/auth/vault/callback" \
  bound_audiences="0Pc847a9884676677e5369e2649f28148c" \
  user_claim="sub"
```

### Option 2: Ask Your Vault Admin

If you don't have admin permissions, send this request to your Vault administrator:

```
Hi,

I'm developing a web application that uses Vault OIDC authentication.
Could you please add the following redirect URIs to the OIDC role "users"
in namespace "adeo/solution-offer-design"?

Development:
- http://localhost:3000/auth/vault/callback

Production (when deployed):
- https://your-production-domain.com/auth/vault/callback

This will allow our application to authenticate users via OIDC.

Thank you!
```

## Verify the Configuration

After updating, verify the new URIs are registered:

```bash
vault read auth/oidc/role/users
```

You should see your new redirect URIs in the `allowed_redirect_uris` list.

## Test the Flow

1. Restart your development server (if needed)
2. Navigate to `/config` in your app
3. Try "Login with OIDC" again
4. You should now be redirected to the OIDC provider

## Important Notes

- **Development**: Use `http://localhost:3000/auth/vault/callback`
- **Production**: Use `https://your-domain.com/auth/vault/callback`
- Both must be registered before they will work
- The redirect URI must EXACTLY match (protocol, domain, port, path)
- Set `NEXT_PUBLIC_APP_URL` in `.env.local` to match your environment

## Alternative: Use the Vault CLI Callback (Workaround)

If you can't update the OIDC role, you could temporarily modify the app to use the CLI's callback URL, but this is NOT recommended for production as it requires running a local server on port 8250.
