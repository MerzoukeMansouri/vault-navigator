# OIDC Authentication Setup Guide

This guide explains how to set up OIDC (OpenID Connect) authentication in Vault Navigator, allowing users to authenticate using their organization's SSO provider instead of managing Vault tokens manually.

## Overview

The OIDC authentication flow in Vault Navigator:
1. User selects namespace and clicks "Login with OIDC"
2. App requests authorization URL from Vault
3. User is redirected to organization's SSO login page
4. After successful authentication, user is redirected back to the app
5. App receives and stores the Vault token automatically

## Prerequisites

### 1. Vault OIDC Configuration

Your Vault administrator must configure OIDC authentication:

```bash
# Enable OIDC auth method (if not already enabled)
vault auth enable oidc

# Configure OIDC with your identity provider
vault write auth/oidc/config \
  oidc_discovery_url="https://your-idp.com/" \
  oidc_client_id="your-client-id" \
  oidc_client_secret="your-client-secret" \
  default_role="reader" \
  namespace_in_state=true

# Create OIDC role with allowed redirect URIs
vault write auth/oidc/role/reader \
  bound_audiences="your-client-id" \
  allowed_redirect_uris="http://localhost:3000/auth/vault/callback,https://your-production-domain.com/auth/vault/callback" \
  user_claim="sub" \
  token_policies="reader,default" \
  token_ttl=768h \
  token_max_ttl=768h
```

**Important Configuration Notes:**
- `namespace_in_state=true` allows the app to pass namespace in auth requests
- `allowed_redirect_uris` must include your app's callback URL for both development and production
- Adjust `token_policies`, `token_ttl`, and `token_max_ttl` according to your security requirements

### 2. Identity Provider Configuration

Your OIDC provider (e.g., Azure AD, Okta, Google) must be configured with:
- **Client ID** and **Client Secret** (provided to Vault)
- **Redirect URI**: `https://your-app-domain.com/auth/vault/callback`
- **Grant Type**: Authorization Code
- **Response Type**: code
- **Scopes**: openid, profile, email (adjust as needed)

### 3. Application Configuration

Set the required environment variable in your `.env.local` file:

```env
# Required: Your application's public URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For production:**
```env
NEXT_PUBLIC_APP_URL=https://vault-navigator.your-domain.com
```

This URL is used to construct the OIDC callback redirect URI.

## Usage

### For End Users

1. Navigate to the **Configurations** page
2. Find the **"Login with OIDC"** card
3. Select your Vault environment:
   - Production: `http://vault.factory.adeo.cloud`
   - Non-Production: `http://vault-nprd.factory.adeo.cloud`
4. Enter your namespace (optional):
   - Common namespaces are provided as quick-select buttons
   - Leave empty to authenticate at the root namespace
5. (Optional) Enter a role name if different from the default
6. Click **"Login with OIDC"**
7. Complete authentication on your organization's SSO page
8. You'll be automatically redirected back and logged in!

### Namespace Handling

The OIDC implementation supports multiple namespaces:
- Namespace is passed to Vault via the `X-Vault-Namespace` header
- Vault encodes the namespace in the OAuth state parameter
- After authentication, the namespace is automatically included in your configuration
- You can switch namespaces later using the namespace selector

### Multiple Vault Environments

The component supports both production and non-production Vault instances:
- **Production**: `http://vault.factory.adeo.cloud`
- **Non-Production**: `http://vault-nprd.factory.adeo.cloud`

Select the appropriate environment before initiating OIDC login.

## Technical Implementation

### API Routes

#### `/api/auth/vault/login` (POST)
Initiates OIDC authentication by requesting an authorization URL from Vault.

**Request Body:**
```json
{
  "namespace": "adeo/solution-offer-design",
  "vaultUrl": "http://vault.factory.adeo.cloud",
  "role": "reader"
}
```

**Response:**
```json
{
  "authUrl": "https://your-idp.com/authorize?...",
  "vaultUrl": "http://vault.factory.adeo.cloud",
  "namespace": "adeo/solution-offer-design"
}
```

#### `/auth/vault/callback` (GET)
Handles the OIDC callback after successful authentication.

**Query Parameters:**
- `code`: Authorization code from identity provider
- `state`: Encrypted state from Vault (contains namespace)

**Redirect:**
After successful token exchange, redirects to home page with:
- `oidc_success=true`
- `token=<vault-token>`
- `vault_url=<vault-url>`
- `namespace=<namespace>`
- Additional metadata (username, policies, expiration)

### Component Architecture

#### VaultOIDCLogin Component
- Located at: `components/vault-oidc-login.tsx`
- Provides UI for OIDC authentication
- Handles environment selection, namespace input, and role configuration
- Displays loading states and error messages

#### VaultContext Integration
- Located at: `contexts/vault-context.tsx`
- `handleOIDCCallback()` method processes callback parameters
- Automatically creates and saves configuration from OIDC token
- Cleans up URL parameters after successful authentication

### Security Considerations

1. **Token Storage**: Tokens are stored in localStorage (same as manual token entry)
2. **State Parameter**: Generated and validated by Vault to prevent CSRF attacks
3. **HTTPS Required**: Always use HTTPS in production environments
4. **Token Expiration**: Monitor token expiration and prompt re-authentication
5. **Redirect URI Validation**: Callback URL must exactly match Vault configuration

## Troubleshooting

### Error: "Missing authorization code or state parameter"
**Cause**: OIDC callback didn't receive expected parameters.
**Solution**: Check that your identity provider is correctly configured and redirecting to the callback URL.

### Error: "Failed to authenticate with Vault"
**Cause**: Vault couldn't exchange the authorization code for a token.
**Solutions**:
- Verify your redirect URI is registered in both Vault and your identity provider
- Check that `namespace_in_state=true` is set in Vault OIDC config
- Ensure the OIDC role has correct audience and redirect URI settings
- Verify the authorization code hasn't expired (usually 10 minutes)

### Error: "Failed to get authorization URL from Vault"
**Cause**: Vault rejected the auth URL request.
**Solutions**:
- Verify the namespace exists and you have access to it
- Check that the OIDC auth method is enabled in the specified namespace
- Verify the role name is correct
- Check Vault logs for detailed error messages

### Redirect URI Mismatch
**Cause**: The callback URL doesn't match what's configured in Vault.
**Solutions**:
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly
- Verify the redirect URI in Vault includes the exact URL: `${NEXT_PUBLIC_APP_URL}/auth/vault/callback`
- Check for trailing slashes or protocol mismatches (http vs https)

### Token Not Saved After Callback
**Cause**: VaultContext didn't process the callback parameters.
**Solutions**:
- Check browser console for JavaScript errors
- Verify the callback route is returning expected parameters
- Check localStorage permissions in your browser

## Equivalent Shell Command

The OIDC authentication in Vault Navigator replaces the manual shell command:

```bash
# Your vault-me alias
vault login -method=oidc \
  -namespace="adeo/solution-offer-design" \
  -address="http://vault.factory.adeo.cloud"
```

The web app automates this entire flow, including:
- Opening the OIDC provider login page
- Handling the callback
- Storing the token in your browser
- Creating a reusable configuration

## Advanced Configuration

### Custom Roles

If your Vault setup uses different role names:

1. Enter the role name in the "Role" field
2. Or leave empty to use the `default_role` from Vault config

### Multiple Configurations

You can save multiple OIDC-authenticated configurations:
- Each namespace can have its own configuration
- Different Vault environments (prod/non-prod) create separate configs
- All OIDC configs are labeled as "OIDC: username (namespace)"

### Token Refresh

OIDC tokens have an expiration time:
- Monitor the token expiration in your configuration
- Re-authenticate before expiration using the OIDC login flow
- Old configuration will be updated with the new token

## API Reference

### Vault OIDC Endpoints

#### `POST /v1/auth/oidc/oidc/auth_url`
Get authorization URL for OIDC login.

**Headers:**
- `Content-Type: application/json`
- `X-Vault-Namespace: <namespace>` (optional)

**Request Body:**
```json
{
  "redirect_uri": "https://your-app.com/auth/vault/callback",
  "role": "reader"
}
```

**Response:**
```json
{
  "data": {
    "auth_url": "https://your-idp.com/authorize?..."
  }
}
```

#### `GET /v1/auth/oidc/oidc/callback?code=<code>&state=<state>`
Complete OIDC authentication.

**Response:**
```json
{
  "auth": {
    "client_token": "hvs.CAES...",
    "accessor": "...",
    "policies": ["default", "reader"],
    "metadata": {
      "role": "reader",
      "username": "user@example.com",
      "namespace": "adeo/solution-offer-design"
    },
    "lease_duration": 2764800,
    "renewable": true
  }
}
```

## Additional Resources

- [HashiCorp Vault OIDC Auth Method Documentation](https://www.vaultproject.io/docs/auth/oidc)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)
- [OpenID Connect Core Specification](https://openid.net/specs/openid-connect-core-1_0.html)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Vault audit logs for detailed error messages
3. Contact your Vault administrator for configuration issues
4. Open a GitHub issue for app-specific problems
