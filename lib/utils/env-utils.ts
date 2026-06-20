export const ENV_DEFINITIONS = [
  { key: "prod", label: "prod", color: "#ef4444", patterns: ["prod"] },
  { key: "pre",  label: "pre",  color: "#f97316", patterns: ["pre", "prep"] },
  { key: "qa",   label: "qa / uat", color: "#a855f7", patterns: ["qa", "uat"] },
  { key: "sit",  label: "sit",  color: "#3b82f6", patterns: ["sit"] },
  { key: "dev",  label: "dev",  color: "#22c55e", patterns: ["dev", "local"] },
] as const;

/** Returns the env hex color for a node name or secret path, or null if no env matched. */
export function detectEnvColor(nameOrPath: string): string | null {
  const segments = nameOrPath.toLowerCase().split(/[-_/]/);
  for (const def of ENV_DEFINITIONS) {
    for (const pattern of def.patterns) {
      if (segments.includes(pattern)) return def.color;
    }
  }
  return null;
}
