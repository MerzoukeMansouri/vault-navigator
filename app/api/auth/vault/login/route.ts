import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { namespace, vaultUrl, role } = body;

    // Validate that vaultUrl is provided
    if (!vaultUrl) {
      return NextResponse.json(
        { error: 'Vault URL is required' },
        { status: 400 }
      );
    }

    // Construct the redirect URI based on the app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';
    const redirectUri = `${appUrl}/auth/vault/callback`;

    console.log('OIDC Login Request:', {
      vaultUrl,
      namespace,
      role,
      redirectUri,
    });

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add namespace header if provided
    if (namespace) {
      headers['X-Vault-Namespace'] = namespace;
    }

    // Prepare request body
    const requestBody: Record<string, string> = {
      redirect_uri: redirectUri,
    };

    // Add role if provided (optional if default_role is configured)
    if (role) {
      requestBody.role = role;
    }

    // Request authorization URL from Vault
    const response = await fetch(
      `${vaultUrl}/v1/auth/oidc/oidc/auth_url`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vault auth_url request failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      let errorMessage = 'Failed to get authorization URL from Vault';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors && errorJson.errors.length > 0) {
          errorMessage = errorJson.errors.join(', ');
        }
      } catch {
        // Not JSON, use the raw text
        if (errorText) {
          errorMessage = errorText;
        }
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: errorText,
          status: response.status,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Vault auth_url response:', data);

    // Check if auth_url is present and not empty
    if (!data.data?.auth_url) {
      console.error('Empty auth_url received from Vault:', data);
      return NextResponse.json(
        {
          error: 'Vault returned an empty authorization URL. This usually means OIDC is not properly configured for this namespace or the redirect URI is not allowed.',
          details: JSON.stringify(data),
          vaultUrl,
          namespace,
          redirectUri,
        },
        { status: 500 }
      );
    }

    // Return the authorization URL to the client
    return NextResponse.json({
      authUrl: data.data.auth_url,
      vaultUrl,
      namespace: namespace || undefined,
    });

  } catch (error) {
    console.error('OIDC login initiation failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate OIDC login',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
