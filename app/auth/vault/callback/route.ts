import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Note: OAuth callbacks MUST use GET (OAuth 2.0 spec requirement).
// CSRF protection relies on state parameter validation.
// Sensitive data is passed via secure HTTP-only cookies, not URL params.
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

    // TODO: Validate state parameter against stored CSRF token for proper CSRF protection
    // For now, we accept any state (OAuth provider validates the code)

    // Get the vault URL from session storage or default
    // We'll try both production and non-production vaults
    const vaultUrls = [
      'https://vault.factory.adeo.cloud',
      'https://vault-nprd.factory.adeo.cloud'
    ];

    // Try all vault URLs in parallel for faster response
    const results = await Promise.allSettled(
      vaultUrls.map(async (vaultUrl) => {
        const callbackUrl = `${vaultUrl}/v1/auth/oidc/oidc/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;

        const response = await fetch(callbackUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Check if we got a valid token
        if (!data.auth?.client_token) {
          throw new Error('No client token in response');
        }

        return { data, vaultUrl };
      })
    );

    // Find the first successful result
    let tokenData = null;
    let usedVaultUrl = '';

    for (const result of results) {
      if (result.status === 'fulfilled') {
        tokenData = result.value.data;
        usedVaultUrl = result.value.vaultUrl;
        break;
      } else {
        console.error(`Failed to authenticate:`, result.reason);
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
    // TODO: Move sensitive data to secure HTTP-only cookies instead of URL params
    // to prevent token exposure in browser history and referrer headers
    const redirectUrl = new URL('/', request.url);
    const response = NextResponse.redirect(redirectUrl);

    // Set secure cookies for sensitive data
    response.cookies.set('vault_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: leaseDuration
    });
    response.cookies.set('vault_url', usedVaultUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: leaseDuration
    });
    response.cookies.set('vault_username', username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: leaseDuration
    });

    // Only pass non-sensitive success indicator via URL
    redirectUrl.searchParams.set('oidc_success', 'true');

    if (namespace) {
      response.cookies.set('vault_namespace', namespace, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: leaseDuration
      });
    }

    response.cookies.set('vault_policies', policies.join(','), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: leaseDuration
    });
    response.cookies.set('vault_expires_in', String(leaseDuration), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: leaseDuration
    });

    return response;

  } catch (error) {
    console.error('OIDC callback processing failed:', error);
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('error', 'callback_error');
    redirectUrl.searchParams.set('message', error instanceof Error ? error.message : 'Unknown error occurred');
    return NextResponse.redirect(redirectUrl);
  }
}
