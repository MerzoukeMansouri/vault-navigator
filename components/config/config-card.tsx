/**
 * Configuration card component
 * Displays a single configuration with edit/delete actions
 */

"use client";

import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { SavedConfig } from "@/lib/types";

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
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isActive ? "ring-2 ring-primary" : ""
      }`}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="truncate">{config.name}</span>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(config);
              }}
              aria-label={`Edit ${config.name}`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(config.id);
              }}
              aria-label={`Delete ${config.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent onClick={() => onSelect(config)}>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-semibold">URL:</span>{" "}
            <span className="text-muted-foreground truncate block">
              {config.url}
            </span>
          </div>
          <div>
            <span className="font-semibold">Namespace:</span>{" "}
            <span className="text-muted-foreground">
              {config.namespace || "Root"}
            </span>
          </div>
        </div>
        {isActive && (
          <div className="mt-3 text-xs font-semibold text-primary">
            Active
          </div>
        )}
      </CardContent>
    </Card>
  );
}
