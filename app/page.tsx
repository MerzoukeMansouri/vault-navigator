"use client";

import { useState } from "react";
import { SecretBrowser } from "@/components/secret-browser";
import { SecretEditor } from "@/components/secret-editor";
import { SecretSearch } from "@/components/secret-search";
import { SecretCreator } from "@/components/secret-creator";
import { ErrorBoundary } from "@/components/error-boundary";
import { useVault } from "@/contexts/vault-context";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MaintenancePage } from "@/components/maintenance-page";

export default function Home() {
  // React hooks must be called before any conditional returns
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const { isAuthenticated } = useVault();

  // Check if maintenance mode is enabled
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true' || true;

  // If maintenance mode is enabled, show the maintenance page
  if (isMaintenanceMode) {
    return <MaintenancePage />;
  }

  const handleSecretDeleted = () => {
    setSelectedPath(null);
  };

  const handleSecretCreated = (path: string) => {
    setSelectedPath(path);
  };

  if (!isAuthenticated) {
    return (
      <main className="container mx-auto px-6 py-12">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Welcome to Vault Navigator</h1>
              <p className="text-muted-foreground">
                Connect to your HashiCorp Vault instance to get started
              </p>
              <Link href="/config">
                <Button className="mt-4">Configure Connection</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-6 py-6">
      <ErrorBoundary>
        <div className="mb-6 flex gap-4 items-start">
          <div className="flex-1">
            <SecretSearch onSelectSecret={setSelectedPath} />
          </div>
          <SecretCreator onCreated={handleSecretCreated} />
        </div>
      </ErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ErrorBoundary>
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-12rem)] overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <h2 className="font-semibold">Secrets</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <SecretBrowser
                    onSelectSecret={setSelectedPath}
                    selectedPath={selectedPath || undefined}
                  />
                </div>
              </div>
            </Card>
          </div>
        </ErrorBoundary>

        <ErrorBoundary>
          <div className="lg:col-span-2">
            {selectedPath ? (
              <SecretEditor
                key={selectedPath}
                path={selectedPath}
                onDeleted={handleSecretDeleted}
              />
            ) : (
              <Card className="h-[calc(100vh-12rem)]">
                <CardContent className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    Select a secret from the browser to view and edit
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </ErrorBoundary>
      </div>
    </main>
  );
}
