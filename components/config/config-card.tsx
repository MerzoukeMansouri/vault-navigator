"use client";

import { Edit2, Trash2, PlugZap } from "lucide-react";
import { Button } from "../ui/button";
import { SavedConfig } from "@/lib/types";
import { cn, toConfigName } from "@/lib/utils";

interface ConfigCardProps {
  config: SavedConfig;
  isActive: boolean;
  onSelect: (config: SavedConfig) => void;
  onEdit: (config: SavedConfig) => void;
  onDelete: (id: string) => void;
}

export function ConfigCard({
  config,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: ConfigCardProps) {
  return (
    <tr
      onClick={() => onSelect(config)}
      className={cn(
        "cursor-pointer border-b transition-colors last:border-0",
        isActive ? "bg-secondary hover:bg-secondary/80" : "hover:bg-accent"
      )}
    >
      <td className="py-3 px-4 w-8 text-center text-sm">
        {isActive ? "✅" : ""}
      </td>
      <td className="py-3 px-4">
        <span className="text-sm font-medium font-mono tracking-wide">{toConfigName(config.name)}</span>
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground truncate max-w-xs">
        {config.url}
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground">
        {config.namespace || "Root"}
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {!isActive && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              onClick={(e) => { e.stopPropagation(); onSelect(config); }}
              aria-label={`Connect to ${config.name}`}
              title="Connect"
            >
              <PlugZap className="size-3.5" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={(e) => { e.stopPropagation(); onEdit(config); }}
            aria-label={`Edit ${config.name}`}
            title="Edit"
          >
            <Edit2 className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={(e) => { e.stopPropagation(); onDelete(config.id); }}
            aria-label={`Delete ${config.name}`}
            title="Delete"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
