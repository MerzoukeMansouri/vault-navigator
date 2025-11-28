"use client";

import { ConfigManager } from "@/components/config-manager";
import { ErrorBoundary } from "@/components/error-boundary";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ConfigPageContent() {
  const searchParams = useSearchParams();
  const prefilledToken = searchParams.get("token");

  return (
    <main className="container mx-auto px-6 py-8">
      <ErrorBoundary>
        <ConfigManager prefilledToken={prefilledToken || undefined} />
      </ErrorBoundary>
    </main>
  );
}

export default function ConfigPage() {
  return (
    <Suspense fallback={
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </main>
    }>
      <ConfigPageContent />
    </Suspense>
  );
}
