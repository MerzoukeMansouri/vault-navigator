import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // Check if we have the required parameters
    if (!code || !state) {
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('error', 'missing_params');
      redirectUrl.searchParams.set('message', 'Missing authorization code or state parameter');
      return NextResponse.redirect(redirectUrl);
    }

    // Get the vault URL from session storage or default
    // We'll try both production and non-production vaults
    const vaultUrls = [
      'https://vault.factory.adeo.cloud',
      'https://vault-nprd.factory.adeo.cloud'
    ];

    let tokenData = null;
    let usedVaultUrl = '';

    // Try each vault URL until one succeeds
    for (const vaultUrl of vaultUrls) {
      try {
        const callbackUrl = `${vaultUrl}/v1/auth/oidc/oidc/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;

        const response = await fetch(callbackUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();

          // Check if we got a valid token
          if (data.auth?.client_token) {
            tokenData = data;
            usedVaultUrl = vaultUrl;
            break;
          }
        }
      } catch (error) {
        // Continue to next vault URL
        console.error(`Failed to authenticate with ${vaultUrl}:`, error);
      }
    }

    // If we didn't get a token from any vault, redirect with error
    if (!tokenData || !usedVaultUrl) {
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('error', 'auth_failed');
      redirectUrl.searchParams.set('message', 'Failed to authenticate with Vault');
      return NextResponse.redirect(redirectUrl);
    }

    // Extract token information
    const token = tokenData.auth.client_token;
    const namespace = tokenData.auth.metadata?.namespace || '';
    const policies = tokenData.auth.policies || [];
    const leaseDuration = tokenData.auth.lease_duration || 0;
    const username = tokenData.auth.metadata?.username || tokenData.auth.metadata?.role || 'user';

    // Create a success redirect with token information
    // We'll pass this as URL params which the client will then store securely
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('oidc_success', 'true');
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('vault_url', usedVaultUrl);

    if (namespace) {
      redirectUrl.searchParams.set('namespace', namespace);
    }

    redirectUrl.searchParams.set('username', username);
    redirectUrl.searchParams.set('policies', policies.join(','));
    redirectUrl.searchParams.set('expires_in', String(leaseDuration));

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('OIDC callback processing failed:', error);
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('error', 'callback_error');
    redirectUrl.searchParams.set('message', error instanceof Error ? error.message : 'Unknown error occurred');
    return NextResponse.redirect(redirectUrl);
  }
}
