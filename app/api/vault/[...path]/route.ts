import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { HTTP_STATUS, HTTP_METHODS } from "@/lib/constants";

// Ensure this runs on Node.js runtime for external API calls
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Unified handler for all HTTP methods
 */
async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToVault(request, path);
}

// Export all HTTP methods using the unified handler
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;

// OPTIONS for CORS preflight (though not needed with same-origin)
export async function OPTIONS(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  await params; // Consume params even though we don't use it
  return new NextResponse(null, {
    status: HTTP_STATUS.OK,
    headers: {
      "Access-Control-Allow-Methods": `${HTTP_METHODS.GET}, ${HTTP_METHODS.POST}, ${HTTP_METHODS.PUT}, ${HTTP_METHODS.DELETE}, ${HTTP_METHODS.OPTIONS}`,
      "Access-Control-Allow-Headers": "*",
    },
  });
}

async function proxyToVault(request: NextRequest, pathSegments: string[]) {
  // Extract Vault configuration from headers
  const vaultUrl = request.headers.get("x-vault-url");
  const vaultToken = request.headers.get("x-vault-token");
  const vaultNamespace = request.headers.get("x-vault-namespace");
  const methodOverride = request.headers.get("x-http-method-override");

  logger.debug("API Route - Proxy request", {
    vaultUrl,
    hasToken: !!vaultToken,
    namespace: vaultNamespace,
    methodOverride,
  });

  if (!vaultUrl || !vaultToken) {
    logger.warn("Missing Vault URL or token in request headers");
    return NextResponse.json(
      {
        error: "Missing Vault URL or token",
        received: {
          vaultUrl: !!vaultUrl,
          vaultToken: !!vaultToken,
          headerKeys: Array.from(request.headers.keys())
        }
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  const path = pathSegments.join("/");
  const url = `${vaultUrl}/${path}`;

  try {
    const headers: Record<string, string> = {
      "X-Vault-Token": vaultToken,
      "Content-Type": "application/json",
    };

    if (vaultNamespace) {
      headers["X-Vault-Namespace"] = vaultNamespace;
    }

    let body = undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      try {
        body = await request.text();
      } catch {
        // No body
      }
    }

    // Use method override if provided (for Vault's LIST method)
    const httpMethod = methodOverride || request.method;
    const fetchOptions: RequestInit = {
      method: httpMethod,
      headers,
    };

    // Add body for non-GET requests (but not for LIST operations)
    if (body && httpMethod !== "GET" && httpMethod !== "HEAD" && httpMethod !== "LIST") {
      fetchOptions.body = body;
    }

    const response = await fetch(url, fetchOptions);

    const data = await response.text();

    logger.debug("Vault response received", {
      status: response.status,
      path: pathSegments.join("/"),
    });

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: unknown) {
    logger.error("Proxy error", error);
    const message = error instanceof Error ? error.message : "Proxy request failed";
    return NextResponse.json(
      { error: message },
      { status: HTTP_STATUS.BAD_GATEWAY }
    );
  }
}
