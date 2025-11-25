import { NextRequest, NextResponse } from "next/server";

// Ensure this runs on Node.js runtime for external API calls
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyToVault(request, params.path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyToVault(request, params.path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyToVault(request, params.path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyToVault(request, params.path);
}


// OPTIONS for CORS preflight (though not needed with same-origin)
export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

async function proxyToVault(request: NextRequest, pathSegments: string[]) {
  // Debug: log all headers
  console.log("API Route - All headers:", Object.fromEntries(request.headers.entries()));

  const vaultUrl = request.headers.get("x-vault-url");
  const vaultToken = request.headers.get("x-vault-token");
  const vaultNamespace = request.headers.get("x-vault-namespace");
  const methodOverride = request.headers.get("x-http-method-override");

  console.log("API Route - Extracted:", { vaultUrl, vaultToken, vaultNamespace, methodOverride });

  if (!vaultUrl || !vaultToken) {
    return NextResponse.json(
      {
        error: "Missing Vault URL or token",
        received: {
          vaultUrl: !!vaultUrl,
          vaultToken: !!vaultToken,
          headerKeys: Array.from(request.headers.keys())
        }
      },
      { status: 400 }
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

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: error.message || "Proxy request failed" },
      { status: 502 }
    );
  }
}
