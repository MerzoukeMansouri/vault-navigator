'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VaultOIDCLoginProps {
  onLoginStart?: () => void;
  onLoginError?: (error: string) => void;
}

const COMMON_NAMESPACES = [
  'adeo/solution-offer-design',
  'adeo',
];

const COMMON_VAULT_URLS = [
  { name: 'Production', url: 'https://vault.factory.adeo.cloud' },
  { name: 'Non-Production', url: 'https://vault-nprd.factory.adeo.cloud' },
];

export function VaultOIDCLogin({ onLoginStart, onLoginError }: VaultOIDCLoginProps) {
  const [namespace, setNamespace] = useState('adeo/solution-offer-design');
  const [vaultUrl, setVaultUrl] = useState('https://vault.factory.adeo.cloud');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    if (onLoginStart) {
      onLoginStart();
    }

    try {
      const response = await fetch('/api/auth/vault/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namespace: namespace || undefined,
          vaultUrl,
          role: role || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error || 'Failed to initiate OIDC login';
        const details = errorData.details ? `\n\nDetails: ${errorData.details}` : '';
        throw new Error(errorMsg + details);
      }

      const data = await response.json();

      if (!data.authUrl) {
        throw new Error('No authorization URL received from server. Check console for details.');
      }

      // Redirect to OIDC provider
      window.location.href = data.authUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setLoading(false);

      if (onLoginError) {
        onLoginError(errorMessage);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login with OIDC</CardTitle>
        <CardDescription>
          Authenticate using your organization's OIDC provider
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vault-url">Vault URL</Label>
          <div className="space-y-2">
            <Input
              id="vault-url"
              placeholder="https://vault.example.com"
              value={vaultUrl}
              onChange={(e) => setVaultUrl(e.target.value)}
              disabled={loading}
            />
            <div className="flex flex-wrap gap-2">
              {COMMON_VAULT_URLS.map((env) => (
                <Button
                  key={env.url}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVaultUrl(env.url)}
                  disabled={loading}
                  className="text-xs"
                >
                  {env.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="namespace">Namespace (optional)</Label>
          <div className="space-y-2">
            <Input
              id="namespace"
              placeholder="e.g., adeo/solution-offer-design"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              disabled={loading}
            />
            <div className="flex flex-wrap gap-2">
              {COMMON_NAMESPACES.map((ns) => (
                <Button
                  key={ns}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNamespace(ns)}
                  disabled={loading}
                  className="text-xs"
                >
                  {ns}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role (optional)</Label>
          <Input
            id="role"
            placeholder="e.g., reader"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-gray-500">
            Leave empty to use the default role configured in Vault
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md max-h-40 overflow-y-auto">
            <p className="text-sm text-red-800 whitespace-pre-wrap">{error}</p>
          </div>
        )}

        <Button
          onClick={handleLogin}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Initiating login...' : 'Login with OIDC'}
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <p>This will redirect you to your organization's login page.</p>
          <p>After authentication, you'll be redirected back to this app with a valid token.</p>
        </div>
      </CardContent>
    </Card>
  );
}
