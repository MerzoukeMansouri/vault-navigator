"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ZshrcSnippet() {
  const [address, setAddress] = useState("");
  const [namespace, setNamespace] = useState("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const snippet = `vault-me() {
  local ns="\${1:-${namespace}}"
  local addr="${address}"
  vault login -method=oidc -namespace="$ns" -address="$addr" && \\
  [[ -f ~/.vault-token ]] && pbcopy < ~/.vault-token && \\
  echo "VAULT_TOKEN=$(<~/.vault-token)" > ~/.env-spring && \\
  open "${origin}/config?token=$(cat ~/.vault-token)&url=$addr&namespace=$ns"
}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Terminal className="size-3.5" />
          <span>
            Add to <code className="font-mono text-foreground">~/.zshrc</code> for one-command login
          </span>
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleCopy}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-px border-b bg-border">
        <div className="bg-card px-4 py-2">
          <Input
            placeholder="Vault address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="border-0 shadow-none px-0 h-8 text-sm focus-visible:ring-0 bg-transparent"
          />
        </div>
        <div className="bg-card px-4 py-2">
          <Input
            placeholder="Namespace"
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
            className="border-0 shadow-none px-0 h-8 text-sm focus-visible:ring-0 bg-transparent"
          />
        </div>
      </div>

      <pre className="p-4 text-sm font-mono text-foreground overflow-x-auto leading-relaxed">
        {snippet}
      </pre>
    </div>
  );
}

export default function TipsPage() {
  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-heading">Tips</h1>
        <p className="text-sm text-muted-foreground mt-1">Handy shell snippets to streamline your Vault workflow.</p>
      </div>
      <ZshrcSnippet />
    </div>
  );
}
