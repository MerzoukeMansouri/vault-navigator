import { ENV_DEFINITIONS } from "@/lib/utils/env-utils";

export function EnvLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {ENV_DEFINITIONS.map((def) => (
        <span key={def.key} className="flex items-center gap-1 text-xs text-muted-foreground">
          <span
            className="inline-block size-2 rounded-full shrink-0"
            style={{ backgroundColor: def.color }}
          />
          {def.label}
        </span>
      ))}
    </div>
  );
}
